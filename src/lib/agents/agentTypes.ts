
export interface BigFiveTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export type Gender = "male" | "female" | "non-binary";

export interface Agent {
  id: number;
  name: string;
  gender: Gender;
  age: number;
  beliefs: number;
  susceptibility: number;
  traits: BigFiveTraits;
  traitHistory?: BigFiveTraits[];
  thoughts?: string;
  messageStyle?: string;
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
