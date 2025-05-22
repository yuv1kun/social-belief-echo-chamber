
import { Network, Message } from "@/lib/simulation";
import { MESSAGE_TEMPLATES, REACTIONS } from "./MessageTemplates";

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
export const enhanceNetworkMessages = (network: Network): Network => {
  // Get recent message patterns to create variety
  const recentMessages = network.messageLog.slice(-10);
  const hasQuestions = recentMessages.some(m => m.content.includes('?'));
  const hasOpinions = recentMessages.some(m => m.content.includes('I think') || m.content.includes('opinion'));
  const hasJokes = recentMessages.some(m => m.content.includes('😂') || m.content.includes('🤣'));
  
  // Get most recent speakers
  const recentSpeakerIds = recentMessages.slice(-3).map(m => m.senderId);
  
  // Create a new updated message log with enhanced messages
  const enhancedMessageLog = [...network.messageLog];
  
  // Enhance any new messages that came from the belief propagation
  const newMessages = network.messageLog.filter(
    msg => !enhancedMessageLog.some(existingMsg => existingMsg.id === msg.id)
  );
  
  newMessages.forEach(msg => {
    // 60% chance to enhance the message with more personality
    if (Math.random() < 0.6) {
      // Get the agent
      const agent = network.nodes.find(a => a.id === msg.senderId);
      if (!agent) return;
      
      // Extract the agent's name from the message
      let agentName = "";
      const colonIndex = msg.content.indexOf(':');
      if (colonIndex > 0) {
        agentName = msg.content.substring(0, colonIndex).trim();
      }
      
      // Select message type based on agent traits and conversation context
      let messageType = "OPINION"; // default
      
      if (agent.traits.openness > 0.7) {
        // Creative agents are more likely to tell jokes or stories
        messageType = Math.random() < 0.5 ? "JOKE" : "STORY";
      } else if (agent.traits.agreeableness < 0.3) {
        // Disagreeable agents tend to disagree with others
        messageType = "DISAGREEMENT";
      } else if (agent.traits.agreeableness > 0.7 && recentSpeakerIds.length > 0) {
        // Agreeable agents tend to agree with others
        messageType = "AGREEMENT";
      } else if (agent.traits.extraversion > 0.7) {
        // Extraverted agents ask questions to engage others
        messageType = Math.random() < 0.7 ? "QUESTION" : "OPINION";
      } else if (agent.traits.neuroticism > 0.7) {
        // Neurotic agents may go off-topic occasionally
        messageType = Math.random() < 0.3 ? "OFFTOPIC" : "OPINION";
      } else {
        // Balance messaging types based on recent conversation
        if (hasQuestions && !hasOpinions) {
          messageType = "OPINION";
        } else if (!hasQuestions && hasOpinions) {
          messageType = "QUESTION";
        } else if (!hasJokes && Math.random() < 0.3) {
          messageType = "JOKE";
        } else if (recentSpeakerIds.length > 0 && Math.random() < 0.4) {
          messageType = Math.random() < 0.5 ? "AGREEMENT" : "DISAGREEMENT";
        } else if (Math.random() < 0.2) {
          messageType = "STORY";
        } else if (Math.random() < 0.1) {
          messageType = "OFFTOPIC";
        }
      }
      
      // Get templates for the selected message type
      const templates = MESSAGE_TEMPLATES[messageType as keyof typeof MESSAGE_TEMPLATES];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
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
      
      // Sometimes add reactions/emoji to make it more conversational
      const addReaction = Math.random() < 0.3;
      const reaction = addReaction ? ` ${REACTIONS[Math.floor(Math.random() * REACTIONS.length)]}` : '';
      
      // Generate the new message content
      let content = template
        .replace("{topic}", network.currentTopic)
        .replace("{lastSpeaker}", lastSpeaker);
        
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
      
      // Final message with name prefix and optional reaction
      const enhancedContent = `${agentName}: ${content}${reaction}`;
      
      // Update the message content
      const msgIndex = enhancedMessageLog.findIndex(m => m.id === msg.id);
      if (msgIndex >= 0) {
        enhancedMessageLog[msgIndex] = {
          ...msg,
          content: enhancedContent
        };
      }
    }
  });
  
  return {
    ...network,
    messageLog: enhancedMessageLog
  };
};
