
/**
 * Simulation utility for social belief echo chamber
 * Handles agent creation, network generation, and belief propagation
 */

import { toast } from "sonner";

export type BigFiveTraits = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type Agent = {
  id: number;
  traits: BigFiveTraits;
  believer: boolean;
  neighbors: number[];
  beliefHistory: boolean[];
  susceptibility?: number; // Calculated value based on traits
};

export type Network = {
  nodes: Agent[];
  links: { source: number; target: number }[];
};

export type SimulationConfig = {
  agentCount: number;
  initialBelieverPercentage: number;
  networkDensity: number;
  networkType: "random" | "scale-free" | "small-world";
  steps: number;
  currentStep: number;
};

/**
 * Generate random Big Five personality traits
 * @returns Object containing the Big Five traits with values between 0 and 1
 */
export const generateRandomTraits = (): BigFiveTraits => ({
  openness: Math.random(),
  conscientiousness: Math.random(),
  extraversion: Math.random(),
  agreeableness: Math.random(),
  neuroticism: Math.random(),
});

/**
 * Calculate agent's susceptibility to influence based on their traits
 * @param traits Agent's Big Five traits
 * @returns Susceptibility score between 0 and 1
 */
export const calculateSusceptibility = (traits: BigFiveTraits): number => {
  // Higher agreeableness and neuroticism increase susceptibility
  // Higher conscientiousness decreases susceptibility
  // Openness and extraversion have mixed effects
  return (
    0.4 * traits.agreeableness +
    0.3 * traits.neuroticism +
    0.2 * traits.openness -
    0.3 * traits.conscientiousness +
    0.1 * traits.extraversion +
    0.3 // Base susceptibility
  );
};

/**
 * Initialize agents with random traits and assign initial believers
 * @param count Number of agents to create
 * @param initialBelieverPercentage Percentage of agents that start as believers
 * @returns Array of initialized agents
 */
export const initializeAgents = (
  count: number,
  initialBelieverPercentage: number
): Agent[] => {
  const agents: Agent[] = [];

  for (let i = 0; i < count; i++) {
    const traits = generateRandomTraits();
    const susceptibility = calculateSusceptibility(traits);
    
    agents.push({
      id: i,
      traits,
      believer: false, // Will be set later for some agents
      neighbors: [],
      beliefHistory: [],
      susceptibility,
    });
  }

  // Assign initial believers randomly
  const initialBelieverCount = Math.floor(
    (count * initialBelieverPercentage) / 100
  );
  
  const shuffledIndices = [...Array(count).keys()].sort(
    () => Math.random() - 0.5
  );
  
  for (let i = 0; i < initialBelieverCount; i++) {
    const index = shuffledIndices[i];
    agents[index].believer = true;
    agents[index].beliefHistory = [true];
  }
  
  // Initialize belief history for non-believers
  agents.forEach((agent) => {
    if (agent.beliefHistory.length === 0) {
      agent.beliefHistory = [false];
    }
  });

  return agents;
};

/**
 * Create a random network connecting the agents
 * @param agents Array of agents
 * @param density Connection density (0-1)
 * @returns Network object with nodes and links
 */
export const createRandomNetwork = (
  agents: Agent[],
  density: number
): Network => {
  const nodes = [...agents];
  const links: { source: number; target: number }[] = [];
  const agentCount = agents.length;

  // For each pair of agents, create a link with probability = density
  for (let i = 0; i < agentCount; i++) {
    for (let j = i + 1; j < agentCount; j++) {
      if (Math.random() < density) {
        // Add bidirectional connection
        nodes[i].neighbors.push(j);
        nodes[j].neighbors.push(i);
        
        // Add link for visualization
        links.push({ source: i, target: j });
      }
    }
  }

  return { nodes, links };
};

/**
 * Create a scale-free network using preferential attachment (Barabási–Albert model)
 * @param agents Array of agents
 * @param m Number of connections per new node
 * @returns Network object with nodes and links
 */
export const createScaleFreeNetwork = (
  agents: Agent[],
  m: number
): Network => {
  const nodes = [...agents];
  const links: { source: number; target: number }[] = [];
  const agentCount = agents.length;
  
  if (agentCount < m + 1) {
    toast.error("Need more agents for scale-free network");
    return createRandomNetwork(agents, 0.1);
  }

  // Initialize with m fully connected nodes
  for (let i = 0; i < m; i++) {
    for (let j = i + 1; j < m; j++) {
      nodes[i].neighbors.push(j);
      nodes[j].neighbors.push(i);
      links.push({ source: i, target: j });
    }
  }

  // Add remaining nodes with preferential attachment
  for (let i = m; i < agentCount; i++) {
    // Calculate probability distribution based on current degree
    const degreeSum = links.length * 2;
    const probabilities: number[] = [];
    
    for (let j = 0; j < i; j++) {
      probabilities.push(nodes[j].neighbors.length / degreeSum);
    }
    
    // Add m connections for this new node
    const connected: Set<number> = new Set();
    while (connected.size < m) {
      // Select node based on probability (preferential attachment)
      let r = Math.random();
      let j = 0;
      
      while (r > 0 && j < i) {
        r -= probabilities[j];
        j++;
      }
      j = Math.max(0, j - 1);
      
      if (!connected.has(j)) {
        connected.add(j);
        nodes[i].neighbors.push(j);
        nodes[j].neighbors.push(i);
        links.push({ source: i, target: j });
      }
    }
  }

  return { nodes, links };
};

/**
 * Create a small-world network (Watts-Strogatz model)
 * @param agents Array of agents
 * @param k Each node is connected to k nearest neighbors
 * @param beta Rewiring probability
 * @returns Network object with nodes and links
 */
export const createSmallWorldNetwork = (
  agents: Agent[],
  k: number = 4,
  beta: number = 0.1
): Network => {
  const nodes = [...agents];
  const links: { source: number; target: number }[] = [];
  const agentCount = agents.length;

  if (k >= agentCount || k % 2 !== 0) {
    toast.error("Invalid k value for small-world network");
    return createRandomNetwork(agents, 0.1);
  }

  // Create ring lattice
  for (let i = 0; i < agentCount; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const neighbor = (i + j) % agentCount;
      nodes[i].neighbors.push(neighbor);
      nodes[neighbor].neighbors.push(i);
      links.push({ source: i, target: neighbor });
    }
  }

  // Rewire edges with probability beta
  for (let i = 0; i < agentCount; i++) {
    for (let j = 1; j <= k / 2; j++) {
      if (Math.random() < beta) {
        // Remove current edge
        const oldNeighbor = (i + j) % agentCount;
        const indexInOld = nodes[oldNeighbor].neighbors.indexOf(i);
        const indexInCurrent = nodes[i].neighbors.indexOf(oldNeighbor);
        
        if (indexInOld !== -1) {
          nodes[oldNeighbor].neighbors.splice(indexInOld, 1);
        }
        
        if (indexInCurrent !== -1) {
          nodes[i].neighbors.splice(indexInCurrent, 1);
        }
        
        // Find link to remove
        const linkIndex = links.findIndex(
          (link) =>
            (link.source === i && link.target === oldNeighbor) ||
            (link.source === oldNeighbor && link.target === i)
        );
        
        if (linkIndex !== -1) {
          links.splice(linkIndex, 1);
        }

        // Add new random edge
        let newNeighbor;
        do {
          newNeighbor = Math.floor(Math.random() * agentCount);
        } while (
          newNeighbor === i ||
          nodes[i].neighbors.includes(newNeighbor)
        );
        
        nodes[i].neighbors.push(newNeighbor);
        nodes[newNeighbor].neighbors.push(i);
        links.push({ source: i, target: newNeighbor });
      }
    }
  }

  return { nodes, links };
};

/**
 * Create a network based on the specified type
 * @param agents Array of agents
 * @param type Network type (random, scale-free, small-world)
 * @param density Connection density for random networks
 * @returns Network object with nodes and links
 */
export const createNetwork = (
  agents: Agent[],
  type: "random" | "scale-free" | "small-world",
  density: number
): Network => {
  switch (type) {
    case "random":
      return createRandomNetwork(agents, density);
    case "scale-free":
      const m = Math.max(2, Math.floor(density * 10)); // Convert density to connections
      return createScaleFreeNetwork(agents, m);
    case "small-world":
      const k = Math.max(4, Math.floor(density * 10)); // Convert density to nearest neighbors
      return createSmallWorldNetwork(agents, k % 2 === 0 ? k : k + 1);
    default:
      return createRandomNetwork(agents, density);
  }
};

/**
 * Run a single step of belief propagation in the network
 * @param network Current network state
 * @returns Updated network after one step of belief propagation
 */
export const runBeliefPropagationStep = (network: Network): Network => {
  const newNetwork = { 
    nodes: JSON.parse(JSON.stringify(network.nodes)),
    links: [...network.links] 
  };

  // For each agent, check neighbors' beliefs
  newNetwork.nodes.forEach((agent, index) => {
    const neighbors = agent.neighbors;
    
    if (neighbors.length === 0) {
      // Isolated agent, belief doesn't change
      agent.beliefHistory.push(agent.believer);
      return;
    }

    // Count believing neighbors
    const believingNeighborsCount = neighbors.filter(
      (neighborId) => network.nodes[neighborId].believer
    ).length;

    // Simple majority rule with susceptibility adjustment
    const thresholdBase = 0.5; // Default threshold is 50%
    const threshold = thresholdBase - (agent.susceptibility || 0) * 0.2;
    const majorityBelieve = believingNeighborsCount / neighbors.length > threshold;

    // Update belief
    agent.believer = majorityBelieve;
    agent.beliefHistory.push(majorityBelieve);
  });

  return newNetwork;
};

/**
 * Calculate statistics for the current simulation state
 * @param network Current network state
 * @returns Object with statistics
 */
export const calculateStatistics = (network: Network) => {
  const totalAgents = network.nodes.length;
  const believers = network.nodes.filter((agent) => agent.believer).length;
  
  return {
    totalAgents,
    believers,
    nonBelievers: totalAgents - believers,
    believerPercentage: (believers / totalAgents) * 100,
    averageSusceptibility: 
      network.nodes.reduce((sum, agent) => sum + (agent.susceptibility || 0), 0) / totalAgents,
    averageDegree: 
      network.nodes.reduce((sum, agent) => sum + agent.neighbors.length, 0) / totalAgents,
  };
};

/**
 * Generate data for belief adoption over time chart
 * @param network Current network state
 * @returns Array of data points for chart
 */
export const generateBeliefHistoryData = (network: Network) => {
  const historyLength = network.nodes[0]?.beliefHistory.length || 0;
  const data = [];

  for (let step = 0; step < historyLength; step++) {
    const believers = network.nodes.filter(
      (agent) => agent.beliefHistory[step]
    ).length;
    
    data.push({
      step,
      believers,
      nonBelievers: network.nodes.length - believers,
      believerPercentage: (believers / network.nodes.length) * 100,
    });
  }

  return data;
};

/**
 * Generate a CSV export of the simulation results
 * @param network Current network state
 * @returns CSV string of simulation data
 */
export const generateExportData = (network: Network): string => {
  // CSV header
  let csv = "agent_id,openness,conscientiousness,extraversion,agreeableness,neuroticism,susceptibility,final_belief,neighbors,belief_history\n";
  
  // Add data for each agent
  network.nodes.forEach((agent) => {
    csv += `${agent.id},${agent.traits.openness.toFixed(3)},${agent.traits.conscientiousness.toFixed(3)},${agent.traits.extraversion.toFixed(3)},${agent.traits.agreeableness.toFixed(3)},${agent.traits.neuroticism.toFixed(3)},${(agent.susceptibility || 0).toFixed(3)},${agent.believer},${agent.neighbors.join("|")},${agent.beliefHistory.map(b => b ? 1 : 0).join("|")}\n`;
  });
  
  return csv;
};

/**
 * Download data as a CSV file
 * @param data CSV string data
 * @param filename Name of the file to download
 */
export const downloadCSV = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
