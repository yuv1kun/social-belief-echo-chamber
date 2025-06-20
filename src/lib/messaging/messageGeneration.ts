
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
  // Generate simple template messages that Gemini can enhance
  const templates = [
    `What do you think about ${topic}? Thoughts?`,
    `I have an opinion on ${topic}. Let's discuss.`,
    `${topic} has been on my mind recently.`,
    `Been hearing a lot about ${topic} lately.`,
    `Curious what you all think about ${topic}.`,
    `Let's discuss something interesting about ${topic}.`
  ];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  return `${agent.name}: ${template}`;
}

export function simulateMessageExchange(network: Network): Network {
  if (network.nodes.length === 0) return network;
  
  // Select 1-3 agents to speak in this round
  const speakingCount = Math.min(3, Math.max(1, Math.floor(network.nodes.length * 0.3)));
  const activeAgents = network.nodes
    .sort(() => Math.random() - 0.5)
    .slice(0, speakingCount);
  
  const newMessages: Message[] = [];
  
  console.log(`Simulation step: ${activeAgents.length} agents will speak`);
  
  activeAgents.forEach(agent => {
    const message = generateBasicMessage(agent, network.currentTopic);
    newMessages.push(createMessage(agent.id, message));
    console.log(`Generated basic message for Agent #${agent.id}: "${message}"`);
  });
  
  return {
    ...network,
    messageLog: [...network.messageLog, ...newMessages]
  };
}
