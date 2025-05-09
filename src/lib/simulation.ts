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

export type Gender = "male" | "female";

export type Message = {
  id: string;
  senderId: number;
  receiverId: number | null; // null for broadcast messages
  timestamp: number;
  content: string;
  belief: boolean; // The belief state when the message was sent
  topic?: string; // The topic of discussion
};

export type Agent = {
  id: number;
  name: string;
  gender: Gender;
  traits: BigFiveTraits;
  believer: boolean;
  neighbors: number[];
  beliefHistory: boolean[];
  susceptibility?: number; // Calculated value based on traits
  thoughtState?: string; // Internal thought about current belief
  messages: Message[]; // Messages sent by this agent
  receivedMessages: Message[]; // Messages received by this agent
  currentTopic?: string; // Current topic the agent is discussing
};

export type Network = {
  nodes: Agent[];
  links: { source: number; target: number }[];
  messageLog: Message[];
  currentTopic: string; // Changed from optional to required
};

export type SimulationConfig = {
  agentCount: number;
  initialBelieverPercentage: number;
  networkDensity: number;
  networkType: "random" | "scale-free" | "small-world";
  steps: number;
  currentStep: number;
};

// Adding the missing indianNames variable
export const indianNames = {
  male: [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", 
    "Reyansh", "Ayaan", "Atharva", "Ishaan", "Shaurya", 
    "Advik", "Rudra", "Kabir", "Dhruv", "Krishna", 
    "Krish", "Darsh", "Veer", "Aayan", "Yuvan"
  ],
  female: [
    "Aanya", "Aadhya", "Aaradhya", "Saanvi", "Myra", 
    "Ananya", "Pari", "Siya", "Diya", "Pihu", 
    "Sara", "Tara", "Aarna", "Riya", "Drishti", 
    "Kiara", "Navya", "Avni", "Neha", "Vanya"
  ]
};

// List of real-world topics for agents to discuss
export const discussionTopics = [
  "Climate change and its effects",
  "Vegetarianism vs. non-vegetarian diets",
  "Effectiveness of online education",
  "Cricket World Cup predictions",
  "Should mobile phones be allowed in schools?",
  "Benefits of yoga and meditation",
  "Bollywood vs. Hollywood movies",
  "Public transportation in Indian cities",
  "Traditional medicine vs. modern medicine",
  "Work from home vs. office work",
  "Social media's impact on society",
  "Arranged marriages in modern India",
  "Importance of learning multiple languages",
  "Indian street food safety",
  "Electric vehicles in India",
  "Future of artificial intelligence",
  "Online shopping vs. local markets",
  "Indian classical music popularity among youth",
  "Water conservation methods",
  "Traditional festivals in modern times"
];

// Select a random topic from the list
export const getRandomTopic = (): string => {
  const index = Math.floor(Math.random() * discussionTopics.length);
  return discussionTopics[index];
};

/**
 * Generate a random Indian name based on gender
 * @param gender The gender to generate a name for
 * @returns A random Indian name
 */
export const generateRandomIndianName = (gender: Gender): string => {
  const nameList = indianNames[gender];
  return nameList[Math.floor(Math.random() * nameList.length)];
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
 * Generate a thought state for an agent based on their personality and belief
 * @param agent The agent to generate a thought for
 * @returns A string representing the agent's internal thought
 */
export const generateThought = (agent: Agent): string => {
  const { traits, believer, currentTopic } = agent;
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = traits;

  // Topic-specific thoughts
  if (currentTopic) {
    if (believer) {
      const topicThoughts = [
        `I think this ${currentTopic} discussion is really important.`,
        `Everyone should be talking about ${currentTopic} more.`,
        `I'm glad we're discussing ${currentTopic}, it matters a lot.`,
        `I have strong opinions about ${currentTopic}.`,
        `I've read a lot about ${currentTopic} recently.`
      ];
      return topicThoughts[Math.floor(Math.random() * topicThoughts.length)];
    } else {
      const topicThoughts = [
        `I'm not sure what to think about ${currentTopic} yet.`,
        `People seem to overreact about ${currentTopic}.`,
        `I need more information before forming an opinion on ${currentTopic}.`,
        `I'm skeptical about what people are saying regarding ${currentTopic}.`,
        `I wonder if ${currentTopic} is really as important as people think.`
      ];
      return topicThoughts[Math.floor(Math.random() * topicThoughts.length)];
    }
  }

  // Fall back to general thoughts if no topic
  const thoughts = {
    believer: [
      "This belief makes so much sense to me.",
      "I'm convinced this is correct.",
      "The evidence for this is compelling.",
      "I'm certain this is the right position.",
      "This position aligns with my values."
    ],
    nonBeliever: [
      "I'm not convinced by this belief.",
      "I need more evidence before accepting this.",
      "This doesn't seem right to me.",
      "I'm skeptical about this claim.",
      "I don't think this position is correct."
    ]
  };

  // Adjust thought based on personality traits
  let thoughtBase = believer ? thoughts.believer : thoughts.nonBeliever;
  let thoughtIndex = Math.floor(Math.random() * thoughtBase.length);
  
  return thoughtBase[thoughtIndex];
};

/**
 * Generate a message from an agent based on their personality, beliefs, thought, and current topic
 * @param agent The agent sending the message
 * @param receiverId The recipient agent id (null for broadcast)
 * @returns A message object
 */
export const generateMessage = (agent: Agent, receiverId: number | null = null): Message => {
  const { traits, believer, id, thoughtState, name, gender, currentTopic } = agent;
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = traits;
  
  // Topic-specific messages based on the current network topic
  let topicMessages = [];
  if (currentTopic) {
    if (believer) {
      topicMessages = [
        `What do you all think about ${currentTopic}? I've been reading about it and think it's really important.`,
        `Has anyone been following the news about ${currentTopic}? I found some interesting articles!`,
        `I was just talking to my friend about ${currentTopic} yesterday. It's such a relevant issue.`,
        `${currentTopic} is something we need to take seriously. I've seen its effects firsthand.`,
        `Let's discuss ${currentTopic} - I think there's a lot of misinformation going around.`,
        `Anyone have strong opinions on ${currentTopic}? I'm definitely in favor of addressing it.`,
        `My cousin works in a field related to ${currentTopic} and says we should all be concerned.`,
        `Does anyone else find ${currentTopic} fascinating? I can't stop reading about it!`,
        `I'm convinced that ${currentTopic} will be one of the defining issues of our generation.`,
        `We need more awareness about ${currentTopic}, not enough people understand its importance.`
      ];
    } else {
      topicMessages = [
        `I don't get the hype around ${currentTopic}. Is it really that big of a deal?`,
        `People are overreacting about ${currentTopic} IMO. Let's be rational here.`,
        `I've been researching ${currentTopic} and I'm not convinced by what I'm seeing.`,
        `Can someone explain why ${currentTopic} matters so much? I'm genuinely curious.`,
        `My friend who's an expert says ${currentTopic} is being blown out of proportion.`,
        `I used to worry about ${currentTopic} until I actually looked into the facts.`,
        `Let's be skeptical about what we hear regarding ${currentTopic}.`,
        `Does anyone have reliable sources about ${currentTopic}? Not just social media posts?`,
        `I think we need more evidence before jumping to conclusions about ${currentTopic}.`,
        `I'm keeping an open mind about ${currentTopic}, but so far I'm not convinced.`
      ];
    }
  }
  
  // Varied message templates for believers with conversational language
  const believerTemplates = [
    `I think this is definitely true because my cousin experienced something similar!`,
    `Have you seen the latest evidence? It's pretty convincing tbh`,
    `I was skeptical at first but now I'm totally on board with this`,
    `This makes a lot of sense when you think about it...`,
    `I read about this yesterday and it clicked for me`,
    `I can't believe more people don't see this is real`,
    `My friend showed me proof and I was like... wow`,
    `This explains so many things that were confusing me before`,
    `I've been saying this for ages, glad others are catching on`,
    `Trust me, there's solid evidence behind this`
  ];
  
  // Varied message templates for non-believers with conversational language
  const nonBelieverTemplates = [
    `I'm not buying it, seems like people are jumping to conclusions`,
    `Has anyone actually verified this from reliable sources?`,
    `I checked the facts and they don't add up at all`,
    `This sounds like another internet rumor tbh`,
    `I need way more proof before I believe something like this`,
    `My cousin works in this field and says it's completely false`,
    `People will believe anything these days 🙄`,
    `I used to think this was true until I did my research`,
    `This has been debunked so many times already`,
    `Let's be real, this doesn't make any logical sense`
  ];

  // Casual intros to make messages sound more natural
  const casualIntros = [
    "",
    "Hey! ",
    "So... ",
    "Guys, ",
    "Listen, ",
    "TBH ",
    "IMO ",
    "Not gonna lie, ",
    "Just saying, ",
    "FYI - "
  ];
  
  // Conversational endings
  const conversationalEndings = [
    "",
    " What do you all think?",
    " Agree?",
    " Am I wrong?",
    " Thoughts?",
    " Anyone else feel this way?",
    " Just my two cents.",
    " Sorry if that's controversial!",
    " That's my take anyway.",
    " I might be wrong tho."
  ];
  
  // Add emojis occasionally
  const emojis = [
    "",
    " 😊",
    " 🤔",
    " 👀",
    " 💯",
    " 🙌",
    " 😂",
    " 👍",
    " 🤷‍♀️",
    " 🤦‍♂️"
  ];
  
  // Select topic-based message if available, otherwise use general templates
  const templates = currentTopic ? 
    (topicMessages.length > 0 ? topicMessages : (believer ? believerTemplates : nonBelieverTemplates)) : 
    (believer ? believerTemplates : nonBelieverTemplates);
    
  const baseIndex = Math.floor(Math.random() * templates.length);
  
  // Add random conversational elements
  const intro = casualIntros[Math.floor(Math.random() * casualIntros.length)];
  const ending = conversationalEndings[Math.floor(Math.random() * conversationalEndings.length)];
  const emoji = Math.random() > 0.7 ? emojis[Math.floor(Math.random() * emojis.length)] : "";
  
  // Construct the message with natural phrasing
  let content = `${name}: ${intro}${templates[baseIndex]}${emoji}${ending}`;
  
  // Modify message based on personality traits but keep it subtle
  if (traits.agreeableness > 0.8 && Math.random() > 0.5) {
    content = `${content} (I respect everyone's opinions on this though!)`;
  }
  
  if (traits.neuroticism > 0.8 && Math.random() > 0.6) {
    content = `${content} I get so stressed thinking about this stuff...`;
  }
  
  if (traits.extraversion > 0.8 && Math.random() > 0.6) {
    content = `${content} EVERYONE NEEDS TO KNOW ABOUT THIS!!`;
  }
  
  if (traits.openness > 0.8 && Math.random() > 0.7) {
    content = `${content} I'm open to changing my mind if someone shows me good evidence.`;
  }
  
  if (traits.conscientiousness > 0.8 && Math.random() > 0.7) {
    content = `${content} I've been researching this carefully for a while now.`;
  }

  // Add thought if available (with probability to make it more natural)
  if (thoughtState && Math.random() > 0.7) {
    content = `${content} (Thinking to myself: "${thoughtState}")`;
  }

  return {
    id: `msg_${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    senderId: id,
    receiverId,
    timestamp: Date.now(),
    content,
    belief: believer,
    topic: currentTopic
  };
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
    const gender: Gender = Math.random() > 0.5 ? "male" : "female";
    const name = generateRandomIndianName(gender);
    
    agents.push({
      id: i,
      name,
      gender,
      traits,
      believer: false, // Will be set later for some agents
      neighbors: [],
      beliefHistory: [],
      susceptibility,
      messages: [],
      receivedMessages: []
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
    
    // Generate initial thought
    agent.thoughtState = generateThought(agent);
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

  // Initialize with a random topic
  const currentTopic = getRandomTopic();

  return { 
    nodes, 
    links,
    messageLog: [],
    currentTopic
  };
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

  // Initialize with a random topic
  const currentTopic = getRandomTopic();

  return { 
    nodes, 
    links,
    messageLog: [],
    currentTopic
  };
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

  // Initialize with a random topic
  const currentTopic = getRandomTopic();

  return { 
    nodes, 
    links,
    messageLog: [],
    currentTopic
  };
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
  let result: Network;
  
  switch (type) {
    case "random":
      result = createRandomNetwork(agents, density);
      break;
    case "scale-free":
      const m = Math.max(2, Math.floor(density * 10)); // Convert density to connections
      result = createScaleFreeNetwork(agents, m);
      break;
    case "small-world":
      const k = Math.max(4, Math.floor(density * 10)); // Convert density to nearest neighbors
      result = createSmallWorldNetwork(agents, k % 2 === 0 ? k : k + 1);
      break;
    default:
      result = createRandomNetwork(agents, density);
  }
  
  return result;
};

/**
 * Exchange messages between agents in the network
 * @param network Current network state
 * @returns Updated network with exchanged messages
 */
export const exchangeMessages = (network: Network): Network => {
  const updatedNetwork = { ...network };
  const newMessages: Message[] = [];

  // Each agent generates and sends messages
  updatedNetwork.nodes.forEach((agent) => {
    // Generate a new thought state
    agent.thoughtState = generateThought(agent);
    
    // Send messages to neighbors (weighted by extraversion)
    const messageCount = Math.floor(agent.traits.extraversion * 3) + 1;
    
    for (let i = 0; i < messageCount; i++) {
      if (agent.neighbors.length > 0) {
        // Choose a random neighbor
        const neighborIndex = Math.floor(Math.random() * agent.neighbors.length);
        const receiverId = agent.neighbors[neighborIndex];
        
        // Generate and send message
        const message = generateMessage(agent, receiverId);
        agent.messages.push(message);
        newMessages.push(message);
        
        // Add message to receiver's inbox
        const receiver = updatedNetwork.nodes.find(a => a.id === receiverId);
        if (receiver) {
          receiver.receivedMessages.push(message);
        }
      }
    }
  });

  // Add all new messages to the log
  updatedNetwork.messageLog = [...updatedNetwork.messageLog, ...newMessages];
  
  return updatedNetwork;
};

/**
 * Run a single step of belief propagation in the network
 * @param network Current network state
 * @returns Updated network after one step of belief propagation
 */
export const runBeliefPropagationStep = (network: Network): Network => {
  // Assign a new random topic for this simulation step
  const currentTopic = getRandomTopic();
  
  // Deep clone network to avoid reference issues
  let newNetwork = { 
    ...network,
    currentTopic,
    nodes: JSON.parse(JSON.stringify(network.nodes)),
    links: [...network.links],
    messageLog: [...network.messageLog]
  };
  
  // Assign the topic to each agent
  newNetwork.nodes.forEach(agent => {
    agent.currentTopic = currentTopic;
  });

  // Exchange messages with the new topic
  newNetwork = exchangeMessages(newNetwork);

  // For each agent, check neighbors' beliefs and received messages
  newNetwork.nodes.forEach((agent) => {
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

    // Get recent messages from neighbors
    const recentMessages = agent.receivedMessages.slice(-5);
    const believerMessageCount = recentMessages.filter(m => m.belief).length;
    
    // Adjust belief threshold based on message content (weighted by agreeableness)
    const messageInfluence = recentMessages.length > 0 
      ? (believerMessageCount / recentMessages.length - 0.5) * agent.traits.agreeableness * 0.2
      : 0;

    // Simple majority rule with susceptibility and message adjustments
    const thresholdBase = 0.5; // Default threshold is 50%
    const threshold = thresholdBase - (agent.susceptibility || 0) * 0.2 - messageInfluence;
    const majorityBelieve = believingNeighborsCount / neighbors.length > threshold;

    // Update belief
    agent.believer = majorityBelieve;
    agent.beliefHistory.push(majorityBelieve);
    
    // Update thought state based on new belief
    agent.thoughtState = generateThought(agent);
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
 * Generate a CSV export of the simulation results including messages
 * @param network Current network state
 * @returns CSV string of simulation data
 */
export const generateExportData = (network: Network): string => {
  // CSV header
  let csv = "agent_id,name,gender,openness,conscientiousness,extraversion,agreeableness,neuroticism,susceptibility,final_belief,neighbors,belief_history\n";
  
  // Add data for each agent
  network.nodes.forEach((agent) => {
    csv += `${agent.id},${agent.name},${agent.gender},${agent.traits.openness.toFixed(3)},${agent.traits.conscientiousness.toFixed(3)},${agent.traits.extraversion.toFixed(3)},${agent.traits.agreeableness.toFixed(3)},${agent.traits.neuroticism.toFixed(3)},${(agent.susceptibility || 0).toFixed(3)},${agent.believer},${agent.neighbors.join("|")},${agent.beliefHistory.map(b => b ? 1 : 0).join("|")}\n`;
  });
  
  return csv;
};

/**
 * Generate a CSV export of the message log
 * @param network Current network state
 * @returns CSV string of message data
 */
export const generateMessageLogExport = (network: Network): string => {
  // CSV header
  let csv = "message_id,sender_id,receiver_id,timestamp,belief_state,content\n";
  
  // Add data for each message
  network.messageLog.forEach((message) => {
    // Escape quotes in content
    const safeContent = message.content.replace(/"/g, '""');
    
    csv += `${message.id},${message.senderId},${message.receiverId || "broadcast"},${message.timestamp},${message.belief ? 1 : 0},"${safeContent}"\n`;
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
