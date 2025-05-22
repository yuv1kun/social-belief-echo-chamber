
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

// Enhanced step function with more diverse messaging
export const enhanceNetworkMessages = async (network: Network): Promise<Network> => {
  // Get recent message patterns to create variety
  const recentMessages = network.messageLog.slice(-10);
  const hasQuestions = recentMessages.some(m => m.content.includes('?'));
  const hasOpinions = recentMessages.some(m => m.content.includes('I think') || m.content.includes('opinion'));
  const hasJokes = recentMessages.some(m => m.content.includes('😂') || m.content.includes('🤣'));
  const hasStories = recentMessages.some(m => m.content.includes('story') || m.content.includes('happened'));
  const hasAgreements = recentMessages.some(m => m.content.toLowerCase().includes('agree'));
  const hasDisagreements = recentMessages.some(m => m.content.toLowerCase().includes('disagree'));
  
  // Get most recent speakers
  const recentSpeakerIds = recentMessages.map(m => m.senderId).slice(-3);
  
  // Create a new updated message log with enhanced messages
  const enhancedMessageLog = [...network.messageLog];
  
  // Check if Gemini API is available
  const isGeminiEnabled = getGeminiEnabled() && !!getGeminiApiKey();
  
  // Enhance any new messages that came from the belief propagation
  const newMessages = network.messageLog.filter(
    msg => !enhancedMessageLog.some(existingMsg => existingMsg.id === msg.id)
  );
  
  // Process each new message
  for (const msg of newMessages) {
    // 85% chance to enhance the message with more personality
    if (Math.random() < 0.85) {
      // Get the agent
      const agent = network.nodes.find(a => a.id === msg.senderId);
      if (!agent) continue;
      
      // Extract the agent's name from the message
      let agentName = "";
      const colonIndex = msg.content.indexOf(':');
      if (colonIndex > 0) {
        agentName = msg.content.substring(0, colonIndex).trim();
      }
      
      // Personality-based message selection
      // Select message type based on agent traits, conversation context, and randomness
      let messageType = "OPINION"; // default
      
      // Determine message type based on agent personality and conversation context
      if (agent.traits.openness > 0.7) {
        // Creative agents are more likely to tell jokes or stories
        if (hasJokes && !hasStories && Math.random() < 0.7) {
          messageType = "STORY";
        } else if (!hasJokes && Math.random() < 0.5) {
          messageType = "JOKE";
        } else {
          messageType = Math.random() < 0.5 ? "OPINION" : "STORY";
        }
      } else if (agent.traits.agreeableness < 0.3) {
        // Disagreeable agents tend to disagree with others
        if (recentSpeakerIds.length > 0 && recentSpeakerIds[0] !== agent.id && Math.random() < 0.7) {
          messageType = "DISAGREEMENT";
        } else {
          messageType = Math.random() < 0.6 ? "OPINION" : "QUESTION";
        }
      } else if (agent.traits.agreeableness > 0.7 && recentSpeakerIds.length > 0) {
        // Agreeable agents tend to agree with others
        if (recentSpeakerIds[0] !== agent.id && Math.random() < 0.8) {
          messageType = "AGREEMENT";
        } else {
          messageType = Math.random() < 0.6 ? "SUPPORTIVE" : "QUESTION";
        }
      } else if (agent.traits.extraversion > 0.7) {
        // Extraverted agents ask questions to engage others, tell jokes, or stories
        const randomVal = Math.random();
        if (randomVal < 0.4) {
          messageType = "QUESTION"; 
        } else if (randomVal < 0.6) {
          messageType = "JOKE";
        } else if (randomVal < 0.8) {
          messageType = "STORY";
        } else {
          messageType = "OPINION";
        }
      } else if (agent.traits.neuroticism > 0.7) {
        // Neurotic agents may go off-topic occasionally or question things
        if (Math.random() < 0.4) {
          messageType = "OFFTOPIC";
        } else if (Math.random() < 0.6) {
          messageType = "QUESTION";
        } else {
          messageType = "SKEPTICAL";
        }
      } else {
        // Balance messaging types based on recent conversation to create diversity
        const ratios = {
          questions: hasQuestions ? 0.1 : 0.3,
          opinions: hasOpinions ? 0.1 : 0.3,
          jokes: hasJokes ? 0.1 : 0.2,
          stories: hasStories ? 0.1 : 0.2,
          agreements: hasAgreements ? 0.1 : 0.25,
          disagreements: hasDisagreements ? 0.1 : 0.25,
          offtopic: 0.1
        };
        
        const rand = Math.random();
        if (rand < ratios.questions) {
          messageType = "QUESTION";
        } else if (rand < ratios.questions + ratios.opinions) {
          messageType = "OPINION";
        } else if (rand < ratios.questions + ratios.opinions + ratios.jokes) {
          messageType = "JOKE";
        } else if (rand < ratios.questions + ratios.opinions + ratios.jokes + ratios.stories) {
          messageType = "STORY";
        } else if (rand < ratios.questions + ratios.opinions + ratios.jokes + ratios.stories + ratios.agreements && recentSpeakerIds.length > 0) {
          messageType = "AGREEMENT";
        } else if (rand < ratios.questions + ratios.opinions + ratios.jokes + ratios.stories + ratios.agreements + ratios.disagreements && recentSpeakerIds.length > 0) {
          messageType = "DISAGREEMENT";
        } else {
          messageType = "OFFTOPIC";
        }
      }
      
      // Get a last speaker to reference (if applicable)
      let lastSpeaker = "";
      if (["AGREEMENT", "DISAGREEMENT"].includes(messageType) && recentSpeakerIds.length > 0) {
        // Find a different agent to reference
        const otherAgentIds = recentSpeakerIds.filter(id => id !== agent.id);
        if (otherAgentIds.length > 0) {
          const lastSpeakerId = otherAgentIds[0];
          const speakerAgent = network.nodes.find(a => a.id === lastSpeakerId);
          if (speakerAgent) {
            // Find previous message using loop instead of findLast
            const previousMessage = findLastMessageFromSender(network.messageLog, lastSpeakerId);
            if (previousMessage) {
              const colonIndex = previousMessage.content.indexOf(':');
              if (colonIndex > 0) {
                lastSpeaker = previousMessage.content.substring(0, colonIndex).trim();
              }
            }
            
            // If name extraction failed, use default format
            if (!lastSpeaker) {
              lastSpeaker = `Agent${lastSpeakerId}`;
            }
          }
        }
      }
      
      // Generate content based on whether Gemini is enabled or not
      let content = "";
      let enhancedContent = "";
      
      if (isGeminiEnabled) {
        try {
          // Use Gemini API to generate message
          const generatedMessage = await generateMessage(
            agent, 
            network, 
            messageType, 
            recentMessages,
            lastSpeaker
          );
          
          if (generatedMessage) {
            content = generatedMessage;
            
            // Add reactions/emoji to make it more conversational
            const addReaction = Math.random() < 0.35;
            const reaction = addReaction ? ` ${REACTIONS[Math.floor(Math.random() * REACTIONS.length)]}` : '';
            
            // Final message with name prefix and optional reaction
            enhancedContent = `${agentName}: ${content}${reaction}`;
          } else {
            // Fallback to template if Gemini fails
            const fallbackContent = getTemplateContent(messageType, network.currentTopic, lastSpeaker);
            content = fallbackContent;
            enhancedContent = `${agentName}: ${content}`;
          }
        } catch (error) {
          console.error("Error generating message with Gemini:", error);
          // Fallback to template
          const fallbackContent = getTemplateContent(messageType, network.currentTopic, lastSpeaker);
          content = fallbackContent;
          enhancedContent = `${agentName}: ${content}`;
        }
      } else {
        // Use templates for message generation (original behavior)
        content = getTemplateContent(messageType, network.currentTopic, lastSpeaker);
        
        // Add personality-specific traits to messages
        if (agent.traits.conscientiousness > 0.8) {
          // Conscientious agents are more formal and detailed
          content += " I've given this careful consideration.";
        } else if (agent.traits.extraversion > 0.8) {
          // Extraverts are more enthusiastic
          content += " I'm really passionate about this!";
        } else if (agent.traits.neuroticism > 0.8) {
          // Neurotic agents are more hesitant
          content += " But I could be wrong...";
        }
        
        // Add variability with occasional sentence starters
        if (Math.random() < 0.3) {
          const starters = [
            "Just thinking out loud, but ", 
            "Not sure if everyone agrees, but ",
            "Call me crazy, but ",
            "Been reflecting on this and ",
            "Wild thought: ",
            "Hear me out on this: ",
            "Unpopular opinion maybe, but ",
            "Consider this: "
          ];
          const starter = starters[Math.floor(Math.random() * starters.length)];
          if (!content.includes(starter)) {
            content = starter + content.charAt(0).toLowerCase() + content.slice(1);
          }
        }
        
        // Add reactions/emoji to make it more conversational
        const addReaction = Math.random() < 0.45;
        const reaction = addReaction ? ` ${REACTIONS[Math.floor(Math.random() * REACTIONS.length)]}` : '';
        
        // Final message with name prefix and optional reaction
        enhancedContent = `${agentName}: ${content}${reaction}`;
      }
      
      // Update the message content
      const msgIndex = enhancedMessageLog.findIndex(m => m.id === msg.id);
      if (msgIndex >= 0) {
        enhancedMessageLog[msgIndex] = {
          ...msg,
          content: enhancedContent
        };
      }
    }
  }
  
  return {
    ...network,
    messageLog: enhancedMessageLog
  };
};

// Helper function to get content from templates
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
