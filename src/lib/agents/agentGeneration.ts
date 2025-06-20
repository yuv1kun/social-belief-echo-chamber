
import { Agent, BigFiveTraits, Gender } from "./agentTypes";
import { INDIAN_NAMES } from "../data/names";

export function generateRandomTraits(): BigFiveTraits {
  return {
    openness: Math.random(),
    conscientiousness: Math.random(),
    extraversion: Math.random(),
    agreeableness: Math.random(),
    neuroticism: Math.random(),
  };
}

export function generateAgentName(gender: Gender): string {
  const names = INDIAN_NAMES[gender];
  return names[Math.floor(Math.random() * names.length)];
}

export function initializeAgents(count: number, believerPercentage: number): Agent[] {
  const agents: Agent[] = [];
  const believerCount = Math.floor((count * believerPercentage) / 100);
  
  for (let i = 0; i < count; i++) {
    const genders: Gender[] = ["male", "female", "non-binary"];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const isBeliever = i < believerCount;
    
    agents.push({
      id: i,
      name: generateAgentName(gender),
      gender,
      age: Math.floor(Math.random() * 50) + 18,
      beliefs: isBeliever ? 1 : 0,
      believer: isBeliever,
      susceptibility: Math.random(),
      traits: generateRandomTraits(),
      traitHistory: [],
      neighbors: [],
      beliefHistory: [isBeliever],
      messages: [],
      receivedMessages: []
    });
  }
  
  return agents;
}
