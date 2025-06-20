
import { Agent, Message } from "../agents/agentTypes";

export interface Link {
  source: number;
  target: number;
  strength?: number;
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
