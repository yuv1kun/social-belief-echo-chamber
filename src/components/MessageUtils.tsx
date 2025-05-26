import { Network, Message } from "@/lib/simulation";
import { MESSAGE_TEMPLATES, REACTIONS, PERSONA_PHRASES } from "./MessageTemplates";
import { generateMessage, getGeminiEnabled, getGeminiApiKey } from "@/lib/geminiApi";

// Function to find the most recent message from a specific sender
export const findLastMessageFromSender = (messages: Message[], senderId: number): Message | undefined => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderId === senderId) {
      return messages[i];
    }
  }
  return undefined;
};

// Enhanced step function with Gemini-only message generation
export const enhanceNetworkMessages = async (network: Network): Promise<Network> => {
  // Check if Gemini API is available and properly configured
  const isGeminiEnabled = getGeminiEnabled();
  const geminiApiKey = getGeminiApiKey();
  
  console.log(`Enhancing messages - Gemini enabled: ${isGeminiEnabled}, API key present: ${!!geminiApiKey}`);
  
  // If Gemini is not enabled or no API key, return network unchanged
  if (!isGeminiEnabled || !geminiApiKey) {
    console.log("Gemini not available, skipping message enhancement");
    return network;
  }
  
  // Get recent message patterns to create variety
  const recentMessages = network.messageLog.slice(-10);
  
  // Get most recent speakers
  const recentSpeakerIds = recentMessages.map(m => m.senderId).slice(-3);
  
  // Create a new updated message log with enhanced messages
  const enhancedMessageLog = [...network.messageLog];
  
  // Find ALL newly created messages that need enhancement
  const messagesToEnhance = network.messageLog.filter(msg => {
    // Enhanced logic to identify messages that need Gemini enhancement
    const content = msg.content;
    
    // Check if message is a basic template or needs enhancement
    const needsEnhancement = 
      content.includes("This has been on my mind recently") || 
      content.includes("Let's discuss something interesting") ||
      content.includes("What do you think about") ||
      content.includes("I have an opinion on") ||
      content.includes("What does everyone think about") ||
      content.includes("Curious what you all think") ||
      // Also enhance messages that look very basic or repetitive
      content.split(' ').length < 8 || // Very short messages
      content.includes("READ THIS NOW!") || // Template-like content
      content.includes("*sends link*"); // Template-like content
    
    return needsEnhancement;
  });
  
  console.log(`Found ${messagesToEnhance.length} messages to enhance with Gemini`);
  
  // Process each message that needs enhancement
  for (const msg of messagesToEnhance) {
    // Get the agent first
    const agent = network.nodes.find(a => a.id === msg.senderId);
    if (!agent) continue;
    
    // Extract the agent's name from the message
    let agentName = "";
    const colonIndex = msg.content.indexOf(':');
    if (colonIndex > 0) {
      agentName = msg.content.substring(0, colonIndex).trim();
    } else {
      agentName = `Agent${agent.id}`;
    }
    
    // Determine message type based on conversation flow and agent personality
    let messageType = "OPINION"; // default
    
    // If there are recent messages, agents should respond more often than ask new questions
    if (recentMessages.length > 0) {
      const lastMessage = recentMessages[recentMessages.length - 1];
      const isLastMessageFromSameAgent = lastMessage.senderId === agent.id;
      
      if (!isLastMessageFromSameAgent) {
        // Different agent - much higher chance to respond/react to previous message (90%)
        if (Math.random() < 0.9) {
          // Choose response type based on agent personality
          if (agent.traits.agreeableness > 0.6) {
            messageType = Math.random() < 0.6 ? "AGREEMENT" : "SUPPORTIVE";
          } else if (agent.traits.agreeableness < 0.4) {
            messageType = Math.random() < 0.5 ? "DISAGREEMENT" : "SKEPTICAL";
          } else {
            messageType = Math.random() < 0.4 ? "OPINION" : "STORY";
          }
        } else {
          // Occasionally ask follow-up questions
          messageType = "QUESTION";
        }
      }
    }
    
    // Adjust based on personality for initial messages
    if (recentMessages.length === 0 || Math.random() < 0.2) { // Reduced from 0.3 to 0.2
      if (agent.traits.openness > 0.7) {
        messageType = Math.random() < 0.5 ? "STORY" : "OPINION";
      } else if (agent.traits.extraversion > 0.7) {
        messageType = Math.random() < 0.3 ? "QUESTION" : "JOKE"; // Reduced question chance
      } else if (agent.traits.neuroticism > 0.7) {
        messageType = Math.random() < 0.2 ? "OFFTOPIC" : "SKEPTICAL"; // Reduced offtopic chance
      }
    }
    
    // Get a last speaker to reference (if applicable)
    let lastSpeaker = "";
    if (["AGREEMENT", "DISAGREEMENT", "SUPPORTIVE"].includes(messageType) && recentSpeakerIds.length > 0) {
      // Find a different agent to reference
      const otherAgentIds = recentSpeakerIds.filter(id => id !== agent.id);
      if (otherAgentIds.length > 0) {
        const lastSpeakerId = otherAgentIds[0];
        const speakerAgent = network.nodes.find(a => a.id === lastSpeakerId);
        if (speakerAgent) {
          const previousMessage = findLastMessageFromSender(network.messageLog, lastSpeakerId);
          if (previousMessage) {
            const colonIndex = previousMessage.content.indexOf(':');
            if (colonIndex > 0) {
              lastSpeaker = previousMessage.content.substring(0, colonIndex).trim();
            }
          }
          
          if (!lastSpeaker) {
            lastSpeaker = `Agent${lastSpeakerId}`;
          }
        }
      }
    }
    
    try {
      console.log(`Using Gemini for agent #${agent.id}, message type: ${messageType}`);
      
      // Use Gemini API to generate message
      const generatedMessage = await generateMessage(
        agent, 
        network, 
        messageType, 
        recentMessages,
        lastSpeaker
      );
      
      if (generatedMessage) {
        const content = generatedMessage;
        console.log(`Gemini generated message: "${content}"`);
        
        // Add reactions/emoji to make it more conversational
        const addReaction = Math.random() < 0.35;
        const reaction = addReaction ? ` ${REACTIONS[Math.floor(Math.random() * REACTIONS.length)]}` : '';
        
        // Final message with name prefix and optional reaction
        const enhancedContent = `${agentName}: ${content}${reaction}`;
        
        // Update the message content
        const msgIndex = enhancedMessageLog.findIndex(m => m.id === msg.id);
        if (msgIndex >= 0) {
          enhancedMessageLog[msgIndex] = {
            ...msg,
            content: enhancedContent
          };
          console.log(`Enhanced message for agent #${agent.id}: "${enhancedContent}"`);
        }
      } else {
        console.log(`Gemini failed to generate message for agent #${agent.id}, removing message from log`);
        // Remove the message from the log if Gemini fails
        const msgIndex = enhancedMessageLog.findIndex(m => m.id === msg.id);
        if (msgIndex >= 0) {
          enhancedMessageLog.splice(msgIndex, 1);
        }
      }
    } catch (error) {
      console.error("Error generating message with Gemini:", error);
      // Remove the message from the log if there's an error
      const msgIndex = enhancedMessageLog.findIndex(m => m.id === msg.id);
      if (msgIndex >= 0) {
        enhancedMessageLog.splice(msgIndex, 1);
      }
    }
  }
  
  return {
    ...network,
    messageLog: enhancedMessageLog
  };
};

// Helper function to get content from templates (kept for backwards compatibility but not used when Gemini is enabled)
function getTemplateContent(messageType: string, topic: string, lastSpeaker: string = ""): string {
  // Get templates for the selected message type
  let templates;
  let template;
  
  // For persona-specific phrases
  if (["INTELLECTUAL", "CASUAL", "ENTHUSIASTIC", "SKEPTICAL", "SUPPORTIVE"].includes(messageType)) {
    templates = PERSONA_PHRASES[messageType as keyof typeof PERSONA_PHRASES];
    template = templates[Math.floor(Math.random() * templates.length)];
  } else {
    // Normal message templates
    templates = MESSAGE_TEMPLATES[messageType as keyof typeof MESSAGE_TEMPLATES];
    template = templates[Math.floor(Math.random() * templates.length)];
  }
  
  // Generate the content
  return template
    .replace("{topic}", topic)
    .replace("{lastSpeaker}", lastSpeaker);
}
