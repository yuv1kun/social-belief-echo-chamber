
import { Agent } from "./agentTypes";

export function calculateSusceptibility(agent: Agent): number {
  const base = agent.susceptibility;
  const personalityFactor = 
    (agent.traits.openness * 0.3) +
    (agent.traits.neuroticism * 0.2) +
    ((1 - agent.traits.conscientiousness) * 0.2) +
    (agent.traits.agreeableness * 0.2) +
    (agent.traits.extraversion * 0.1);
  
  return Math.min(1, Math.max(0, base + personalityFactor * 0.3));
}

export function generateThought(agent: Agent, topic: string): string {
  const thoughts = [
    `I wonder if ${topic} really makes a difference in our daily lives.`,
    `My experience with ${topic} has been quite different from what others say.`,
    `I think ${topic} is more complex than people realize.`,
    `The implications of ${topic} go deeper than most discussions cover.`,
    `I'm curious about the long-term effects of ${topic}.`
  ];
  
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}
