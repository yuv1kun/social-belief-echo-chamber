
import { Agent } from "../agents/agentTypes";
import { Network, Link } from "./networkTypes";

export function createRandomNetwork(agents: Agent[], density: number): Link[] {
  const links: Link[] = [];
  const n = agents.length;
  const expectedEdges = Math.floor(n * (n - 1) * density / 2);
  
  for (let i = 0; i < expectedEdges; i++) {
    let source, target;
    do {
      source = Math.floor(Math.random() * n);
      target = Math.floor(Math.random() * n);
    } while (source === target || links.some(l => 
      (l.source === source && l.target === target) || 
      (l.source === target && l.target === source)
    ));
    
    links.push({ source, target, strength: Math.random() });
  }
  
  return links;
}

export function createScaleFreeNetwork(agents: Agent[], density: number): Link[] {
  const links: Link[] = [];
  const degrees: number[] = new Array(agents.length).fill(0);
  const m = Math.max(1, Math.floor(agents.length * density / 2));
  
  // Start with a small complete graph
  for (let i = 0; i < Math.min(m + 1, agents.length); i++) {
    for (let j = i + 1; j < Math.min(m + 1, agents.length); j++) {
      links.push({ source: i, target: j, strength: Math.random() });
      degrees[i]++;
      degrees[j]++;
    }
  }
  
  // Add remaining nodes using preferential attachment
  for (let i = m + 1; i < agents.length; i++) {
    const totalDegree = degrees.reduce((sum, d) => sum + d, 0);
    const targets = new Set<number>();
    
    while (targets.size < Math.min(m, i)) {
      const rand = Math.random() * totalDegree;
      let cumsum = 0;
      
      for (let j = 0; j < i; j++) {
        cumsum += degrees[j];
        if (rand <= cumsum && !targets.has(j)) {
          targets.add(j);
          break;
        }
      }
    }
    
    targets.forEach(target => {
      links.push({ source: i, target, strength: Math.random() });
      degrees[i]++;
      degrees[target]++;
    });
  }
  
  return links;
}

export function createSmallWorldNetwork(agents: Agent[], density: number): Link[] {
  const links: Link[] = [];
  const n = agents.length;
  const k = Math.max(2, Math.floor(n * density));
  const p = 0.1; // Rewiring probability
  
  // Create ring lattice
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const target = (i + j) % n;
      if (Math.random() < p) {
        // Rewire
        let newTarget;
        do {
          newTarget = Math.floor(Math.random() * n);
        } while (newTarget === i || links.some(l => 
          (l.source === i && l.target === newTarget) || 
          (l.source === newTarget && l.target === i)
        ));
        links.push({ source: i, target: newTarget, strength: Math.random() });
      } else {
        links.push({ source: i, target, strength: Math.random() });
      }
    }
  }
  
  return links;
}

export function createNetwork(agents: Agent[], networkType: string, density: number): Network {
  let links: Link[];
  
  switch (networkType) {
    case "scale-free":
      links = createScaleFreeNetwork(agents, density);
      break;
    case "small-world":
      links = createSmallWorldNetwork(agents, density);
      break;
    default:
      links = createRandomNetwork(agents, density);
  }
  
  return {
    nodes: agents,
    links,
    messageLog: [],
    currentTopic: ""
  };
}
