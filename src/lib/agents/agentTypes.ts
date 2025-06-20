
export interface BigFiveTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export type Gender = "male" | "female" | "non-binary";

export interface Message {
  id: string;
  senderId: number;
  receiverId?: number | null;
  content: string;
  timestamp: number;
  type?: string;
  belief?: boolean;
  replyToId?: string;
}

export interface Agent {
  id: number;
  name: string;
  gender: Gender;
  age: number;
  beliefs: number;
  believer: boolean;
  susceptibility: number;
  traits: BigFiveTraits;
  traitHistory?: BigFiveTraits[];
  thoughts?: string;
  thoughtState?: string;
  messageStyle?: string;
  neighbors: number[];
  beliefHistory: boolean[];
  messages?: Message[];
  receivedMessages?: Message[];
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}
