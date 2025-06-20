
import { Agent } from "../agents/agentTypes";
import { Network, Message } from "../network/networkTypes";
import { CONVERSATION_STARTERS } from "../data/topics";

export function createMessage(senderId: number, content: string): Message {
  return {
    id: `${senderId}-${Date.now()}-${Math.random()}`,
    senderId,
    content,
    timestamp: Date.now(),
  };
}

export function generateBasicMessage(agent: Agent, topic: string): string {
  const starter = CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];
  return `${agent.name}: ${starter} ${topic}. Thoughts?`;
}

export function simulateMessageExchange(network: Network): Network {
  if (network.nodes.length === 0) return network;
  
  const activeAgents = network.nodes.filter(agent => Math.random() < 0.3);
  const newMessages: Message[] = [];
  
  activeAgents.forEach(agent => {
    const message = generateBasicMessage(agent, network.currentTopic);
    newMessages.push(createMessage(agent.id, message));
  });
  
  return {
    ...network,
    messageLog: [...network.messageLog, ...newMessages]
  };
}
