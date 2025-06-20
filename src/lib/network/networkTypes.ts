
import { Agent } from "../agents/agentTypes";

export interface Link {
  source: number;
  target: number;
  strength?: number;
}

export interface Message {
  id: string;
  senderId: number;
  content: string;
  timestamp: number;
  type?: string;
}

export interface Network {
  nodes: Agent[];
  links: Link[];
  messageLog: Message[];
  currentTopic: string;
}

export interface SimulationConfig {
  agentCount: number;
  initialBelieverPercentage: number;
  networkDensity: number;
  networkType: "random" | "scale-free" | "small-world";
  steps: number;
  currentStep: number;
}
