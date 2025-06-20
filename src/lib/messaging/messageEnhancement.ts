import { Network, Message } from "../network/networkTypes";
import { MESSAGE_TEMPLATES, REACTIONS, PERSONA_PHRASES } from "./messageTemplates";
import { generateMessage, getGeminiEnabled, getGeminiApiKey } from "../geminiApi";

// Function to find the most recent message from a specific sender
export const findLastMessageFromSender = (messages: Message[], senderId: number): Message | undefined => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderId === senderId) {
      return messages[i];
    }
  }
  return undefined;
};

// Enhanced step function with improved message generation
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
  
  // Find the most recent messages that need enhancement (last few messages)
  const messagesToEnhance = network.messageLog.slice(-5).filter(msg => {
    const content = msg.content;
    
    // Remove agent name prefix to check actual content
    const colonIndex = content.indexOf(':');
    const actualContent = colonIndex > 0 ? content.substring(colonIndex + 1).trim() : content;
    
    // Check if message needs Gemini enhancement - look for basic/template patterns
    const needsEnhancement = 
      // Template phrases that indicate basic generation
      actualContent.includes("This has been on my mind recently") || 
      actualContent.includes("Let's discuss something interesting") ||
      actualContent.includes("What do you think about") ||
      actualContent.includes("I have an opinion on") ||
      actualContent.includes("What does everyone think about") ||
      actualContent.includes("Curious what you all think") ||
      actualContent.includes("Been hearing a lot about") ||
      actualContent.includes("Thoughts?") ||
      actualContent.includes("lately.") ||
      // Very generic or short messages
      actualContent.split(' ').length < 8 || // Short messages
      // Basic conversation starters
      (actualContent.includes("lately") && actualContent.includes("Thoughts"));
    
    return needsEnhancement;
  });
  
  console.log(`Found ${messagesToEnhance.length} recent messages to enhance with Gemini`);
  
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
        // Different agent - higher chance to respond/react to previous message
        if (Math.random() < 0.8) {
          // Choose response type based on agent personality
          if (agent.traits.agreeableness > 0.6) {
            messageType = Math.random() < 0.6 ? "AGREEMENT" : "SUPPORTIVE";
          } else if (agent.traits.agreeableness < 0.4) {
            messageType = Math.random() < 0.5 ? "DISAGREEMENT" : "SKEPTICAL";
          } else {
            messageType = Math.random() < 0.4 ? "OPINION" : "STORY";
          }
        } else {
          messageType = "QUESTION";
        }
      }
    }
    
    // Adjust based on personality for initial messages
    if (recentMessages.length === 0 || Math.random() < 0.2) {
      if (agent.traits.openness > 0.7) {
        messageType = Math.random() < 0.5 ? "STORY" : "OPINION";
      } else if (agent.traits.extraversion > 0.7) {
        messageType = Math.random() < 0.3 ? "QUESTION" : "JOKE";
      } else if (agent.traits.neuroticism > 0.7) {
        messageType = Math.random() < 0.2 ? "OFFTOPIC" : "SKEPTICAL";
      }
    }
    
    // Get a last speaker to reference (if applicable)
    let lastSpeaker = "";
    if (["AGREEMENT", "DISAGREEMENT", "SUPPORTIVE"].includes(messageType) && recentSpeakerIds.length > 0) {
      const otherAgentIds = recentSpeakerIds.filter(id => id !== agent.id);
      if (otherAgentIds.length > 0) {
        const lastSpeakerId = otherAgentIds[0];
        const speakerAgent = network.nodes.find(a => a.id === lastSpeakerId);
        if (speakerAgent) {
          const previousMessage = recentMessages.find(m => m.senderId === lastSpeakerId);
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
      console.log(`Using Gemini for agent #${agent.id}, message type: ${messageType}, topic: ${network.currentTopic}`);
      
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
        console.log(`Gemini generated message for Agent #${agent.id}: "${content}"`);
        
        // Add reactions/emoji to make it more conversational
        const addReaction = Math.random() < 0.25;
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
        console.log(`Gemini failed to generate message for agent #${agent.id}, keeping original message`);
      }
    } catch (error) {
      console.error("Error generating message with Gemini:", error);
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
