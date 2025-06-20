
import { Network } from "./networkTypes";

export interface NetworkStatistics {
  totalAgents: number;
  believers: number;
  nonBelievers: number;
  believerPercentage: number;
  averageSusceptibility: number;
  averageDegree: number;
}

export function calculateStatistics(network: Network): NetworkStatistics {
  const totalAgents = network.nodes.length;
  const believers = network.nodes.filter(agent => agent.beliefs > 0.5).length;
  const nonBelievers = totalAgents - believers;
  const believerPercentage = totalAgents > 0 ? (believers / totalAgents) * 100 : 0;
  
  const averageSusceptibility = totalAgents > 0 
    ? network.nodes.reduce((sum, agent) => sum + agent.susceptibility, 0) / totalAgents 
    : 0;
  
  const totalDegree = network.links.length * 2;
  const averageDegree = totalAgents > 0 ? totalDegree / totalAgents : 0;
  
  return {
    totalAgents,
    believers,
    nonBelievers,
    believerPercentage,
    averageSusceptibility,
    averageDegree,
  };
}

export function generateBeliefHistoryData(network: Network) {
  const believers = network.nodes.filter(agent => agent.beliefs > 0.5).length;
  const nonBelievers = network.nodes.length - believers;
  
  return [{
    step: 0,
    believers,
    nonBelievers,
    believerPercentage: network.nodes.length > 0 ? (believers / network.nodes.length) * 100 : 0
  }];
}
