import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import SimulationHeader from "@/components/SimulationHeader";
import NetworkVisualization from "@/components/NetworkVisualization";
import SimulationControls from "@/components/SimulationControls";
import AgentDetails from "@/components/AgentDetails";
import SimulationStats from "@/components/SimulationStats";
import NetworkMessages from "@/components/NetworkMessages";
import AgentSelector from "@/components/AgentSelector";
import ElevenLabsSettings from "@/components/ElevenLabsSettings";
import {
  Agent,
  Network,
  SimulationConfig,
  calculateStatistics,
  createNetwork,
  downloadCSV,
  generateBeliefHistoryData,
  generateExportData,
  initializeAgents,
  runBeliefPropagationStep,
  getRandomTopic,
} from "@/lib/simulation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle, Settings } from "lucide-react";
import { initializeTTS, cancelSpeech, getApiKey } from "@/lib/elevenLabsSpeech";

// Simulation step interval in milliseconds (adjusted to 10 seconds to allow time for message processing)
const STEP_INTERVAL = 10000;

// Message templates for more diverse conversation patterns
const MESSAGE_TEMPLATES = {
  OPINION: [
    "I strongly believe that {topic} is important because...",
    "In my opinion, {topic} has changed significantly over the years.",
    "I think {topic} is overrated. Here's why...",
    "My take on {topic} is quite different from most people.",
    "From my perspective, {topic} is actually beneficial when you consider..."
  ],
  QUESTION: [
    "What do you all think about {topic}? I'm curious.",
    "Has anyone here had personal experience with {topic}?",
    "I'm wondering, does {topic} really make a difference in practice?",
    "Could someone explain why {topic} is so controversial these days?",
    "What would happen if we all embraced {topic} completely?"
  ],
  AGREEMENT: [
    "I completely agree with what @{lastSpeaker} said about {topic}!",
    "That's exactly right @{lastSpeaker}, {topic} is definitely worth considering.",
    "Yes! @{lastSpeaker} makes a good point about {topic}.",
    "@{lastSpeaker} - 100% this. {topic} deserves more attention.",
    "Couldn't have said it better myself, @{lastSpeaker}!"
  ],
  DISAGREEMENT: [
    "I respectfully disagree with @{lastSpeaker}. {topic} isn't that simple.",
    "Actually @{lastSpeaker}, I see {topic} quite differently because...",
    "I'm not convinced that's true about {topic}, @{lastSpeaker}.",
    "That's an interesting perspective @{lastSpeaker}, but I think {topic} is more nuanced.",
    "I see where you're coming from @{lastSpeaker}, but have you considered this about {topic}..."
  ],
  JOKE: [
    "Why did {topic} cross the road? Because it was running from all these hot takes! 😂",
    "They say {topic} is serious business, but I'm just here for the memes 🤣",
    "Plot twist: {topic} was the real social media influencer all along! 😆",
    "My relationship with {topic} is complicated... like my coffee order at Starbucks! ☕️",
    "*Dramatic voice* In a world dominated by {topic}, one person dared to scroll past... 🎬"
  ],
  STORY: [
    "True story: last year I had a fascinating experience with {topic} that changed my view completely...",
    "This reminds me of when I first encountered {topic} in college. It was eye-opening!",
    "My friend actually works with {topic} and the stories they tell are incredible.",
    "I once read a book about {topic} that completely changed my perspective.",
    "Growing up, my family always emphasized {topic}. Now I understand why."
  ],
  OFFTOPIC: [
    "Slightly off-topic, but has anyone seen that new show everyone's talking about?",
    "Speaking of {topic}, did you all hear about that viral news story yesterday?",
    "This conversation is great! Anyone else enjoying these discussions as much as I am?",
    "Random thought: {topic} makes me think about how much society has changed.",
    "Sorry to interrupt the {topic} talk, but I just had the best food delivery arrive! 🍕"
  ]
};

// Diverse reactions and emojis to make messages more human-like
const REACTIONS = [
  "❤️", "👍", "👏", "🙌", "💯", "🔥", "😂", "🤔", "🙄", "😮", "🤦‍♀️", 
  "exactly!", "this.", "100%", "facts", "debatable", "interesting", 
  "wait what?", "mind blown", "I can't even", "same"
];

const Index = () => {
  // Simulation state
  const [config, setConfig] = useState<SimulationConfig>({
    agentCount: 50,
    initialBelieverPercentage: 20,
    networkDensity: 0.1,
    networkType: "random",
    steps: 20,
    currentStep: 0,
  });

  const [network, setNetwork] = useState<Network>({ 
    nodes: [], 
    links: [],
    messageLog: [],
    currentTopic: getRandomTopic()
  });
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [runInterval, setRunInterval] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false); // Track message processing
  const [statistics, setStatistics] = useState({
    totalAgents: 0,
    believers: 0,
    nonBelievers: 0,
    believerPercentage: 0,
    averageSusceptibility: 0,
    averageDegree: 0,
  });

  // Initialize simulation
  const initializeSimulation = useCallback(() => {
    try {
      // Cancel any ongoing speech
      cancelSpeech();
      
      // Generate a single topic for this simulation run
      const simulationTopic = getRandomTopic();
      toast.info(`New discussion topic: ${simulationTopic}`);
      
      // Create agents
      const agents = initializeAgents(
        config.agentCount,
        config.initialBelieverPercentage
      );

      // Initialize trait history for all agents
      agents.forEach(agent => {
        if (!agent.traitHistory) {
          agent.traitHistory = [];
        }
        agent.traitHistory.push({...agent.traits});
      });

      // Create network
      const newNetwork = createNetwork(
        agents,
        config.networkType,
        config.networkDensity
      );

      // Set the topic in the network
      newNetwork.currentTopic = simulationTopic;
      
      // Ensure message log is empty
      newNetwork.messageLog = [];

      setNetwork(newNetwork);
      setSelectedAgentId(null);
      setConfig((prev) => ({ ...prev, currentStep: 0 }));

      // Calculate initial stats
      const stats = calculateStatistics(newNetwork);
      setStatistics(stats);

      // Generate initial history data
      const history = generateBeliefHistoryData(newNetwork);
      setHistoryData(history);

      setIsInitialized(true);
      toast.success("Simulation initialized");
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Failed to initialize simulation");
    }
  }, [config.agentCount, config.initialBelieverPercentage, config.networkDensity, config.networkType]);

  // Initialize TTS and simulation on first load
  useEffect(() => {
    initializeTTS();
    initializeSimulation();
    
    // Check if ElevenLabs API key is set
    if (!getApiKey()) {
      // Show settings on first load if no API key is set
      setShowSettings(true);
    }
  }, [initializeSimulation]);

  // Enhanced step function with more diverse messaging
  const handleStep = useCallback(() => {
    if (config.currentStep >= config.steps) {
      toast.info("Simulation complete");
      setIsRunning(false);
      if (runInterval) {
        clearInterval(runInterval);
        setRunInterval(null);
      }
      return;
    }

    // Only continue if not processing a message
    if (isProcessingMessage) {
      console.log("Skipping step while processing message");
      return;
    }

    try {
      console.log(`Running belief propagation step ${config.currentStep + 1} of ${config.steps}`);
      
      // Generate more diverse and human-like messages
      const enhanceNetworkMessages = (network: Network): Network => {
        // Get recent message patterns to create variety
        const recentMessages = network.messageLog.slice(-10);
        const hasQuestions = recentMessages.some(m => m.content.includes('?'));
        const hasOpinions = recentMessages.some(m => m.content.includes('I think') || m.content.includes('opinion'));
        const hasJokes = recentMessages.some(m => m.content.includes('😂') || m.content.includes('🤣'));
        
        // Get most recent speakers
        const recentSpeakerIds = recentMessages.slice(-3).map(m => m.senderId);
        
        // Create a new updated message log with enhanced messages
        const enhancedMessageLog = [...network.messageLog];
        
        // Enhance any new messages that came from the belief propagation
        const newMessages = network.messageLog.filter(
          msg => !enhancedMessageLog.some(existingMsg => existingMsg.id === msg.id)
        );
        
        newMessages.forEach(msg => {
          // 60% chance to enhance the message with more personality
          if (Math.random() < 0.6) {
            // Get the agent
            const agent = network.nodes.find(a => a.id === msg.senderId);
            if (!agent) return;
            
            // Extract the agent's name from the message
            let agentName = "";
            const colonIndex = msg.content.indexOf(':');
            if (colonIndex > 0) {
              agentName = msg.content.substring(0, colonIndex).trim();
            }
            
            // Select message type based on agent traits and conversation context
            let messageType = "OPINION"; // default
            
            if (agent.traits.openness > 0.7) {
              // Creative agents are more likely to tell jokes or stories
              messageType = Math.random() < 0.5 ? "JOKE" : "STORY";
            } else if (agent.traits.agreeableness < 0.3) {
              // Disagreeable agents tend to disagree with others
              messageType = "DISAGREEMENT";
            } else if (agent.traits.agreeableness > 0.7 && recentSpeakerIds.length > 0) {
              // Agreeable agents tend to agree with others
              messageType = "AGREEMENT";
            } else if (agent.traits.extraversion > 0.7) {
              // Extraverted agents ask questions to engage others
              messageType = Math.random() < 0.7 ? "QUESTION" : "OPINION";
            } else if (agent.traits.neuroticism > 0.7) {
              // Neurotic agents may go off-topic occasionally
              messageType = Math.random() < 0.3 ? "OFFTOPIC" : "OPINION";
            } else {
              // Balance messaging types based on recent conversation
              if (hasQuestions && !hasOpinions) {
                messageType = "OPINION";
              } else if (!hasQuestions && hasOpinions) {
                messageType = "QUESTION";
              } else if (!hasJokes && Math.random() < 0.3) {
                messageType = "JOKE";
              } else if (recentSpeakerIds.length > 0 && Math.random() < 0.4) {
                messageType = Math.random() < 0.5 ? "AGREEMENT" : "DISAGREEMENT";
              } else if (Math.random() < 0.2) {
                messageType = "STORY";
              } else if (Math.random() < 0.1) {
                messageType = "OFFTOPIC";
              }
            }
            
            // Get templates for the selected message type
            const templates = MESSAGE_TEMPLATES[messageType as keyof typeof MESSAGE_TEMPLATES];
            const template = templates[Math.floor(Math.random() * templates.length)];
            
            // Get a last speaker to reference (if applicable)
            let lastSpeaker = "";
            if (["AGREEMENT", "DISAGREEMENT"].includes(messageType) && recentSpeakerIds.length > 0) {
              // Find a different agent to reference
              const otherAgentIds = recentSpeakerIds.filter(id => id !== agent.id);
              if (otherAgentIds.length > 0) {
                const lastSpeakerId = otherAgentIds[0];
                const speakerAgent = network.nodes.find(a => a.id === lastSpeakerId);
                if (speakerAgent) {
                  // Extract name from previous message
                  const previousMessage = enhancedMessageLog.findLast(m => m.senderId === lastSpeakerId);
                  if (previousMessage) {
                    const colonIndex = previousMessage.content.indexOf(':');
                    if (colonIndex > 0) {
                      lastSpeaker = previousMessage.content.substring(0, colonIndex).trim();
                    }
                  }
                  
                  // If name extraction failed, use default format
                  if (!lastSpeaker) {
                    lastSpeaker = `Agent${lastSpeakerId}`;
                  }
                }
              }
            }
            
            // Sometimes add reactions/emoji to make it more conversational
            const addReaction = Math.random() < 0.3;
            const reaction = addReaction ? ` ${REACTIONS[Math.floor(Math.random() * REACTIONS.length)]}` : '';
            
            // Generate the new message content
            let content = template
              .replace("{topic}", network.currentTopic)
              .replace("{lastSpeaker}", lastSpeaker);
              
            // Add personality-specific traits to messages
            if (agent.traits.conscientiousness > 0.8) {
              // Conscientious agents are more formal and detailed
              content += " I've given this careful consideration.";
            } else if (agent.traits.extraversion > 0.8) {
              // Extraverts are more enthusiastic
              content += " I'm really passionate about this!";
            } else if (agent.traits.neuroticism > 0.8) {
              // Neurotic agents are more hesitant
              content += " But I could be wrong...";
            }
            
            // Final message with name prefix and optional reaction
            const enhancedContent = `${agentName}: ${content}${reaction}`;
            
            // Update the message content
            const msgIndex = enhancedMessageLog.findIndex(m => m.id === msg.id);
            if (msgIndex >= 0) {
              enhancedMessageLog[msgIndex] = {
                ...msg,
                content: enhancedContent
              };
            }
          }
        });
        
        return {
          ...network,
          messageLog: enhancedMessageLog
        };
      };
      
      // Run one step of belief propagation
      const updatedNetwork = runBeliefPropagationStep(network);
      
      // Enhance messages with more diversity
      const enhancedNetwork = enhanceNetworkMessages(updatedNetwork);
      
      // Log message counts for debugging
      console.log(`Messages before step: ${network.messageLog.length}`);
      console.log(`Messages after step: ${enhancedNetwork.messageLog.length}`);
      console.log(`New messages: ${enhancedNetwork.messageLog.length - network.messageLog.length}`);
      
      // Ensure message IDs are preserved
      const newMessages = enhancedNetwork.messageLog.filter(
        newMsg => !network.messageLog.some(oldMsg => oldMsg.id === newMsg.id)
      );
      console.log(`Filtered new messages: ${newMessages.length}`);
      
      // For debugging, log content of first new message if available
      if (newMessages.length > 0) {
        console.log(`First new message: Agent #${newMessages[0].senderId} says "${newMessages[0].content}"`);
      }
      
      setNetwork(prev => ({
        ...enhancedNetwork,
        // Ensure we don't lose any messages if there's a race condition
        messageLog: [...prev.messageLog, ...newMessages]
      }));
      
      setConfig((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));

      // Update stats
      const stats = calculateStatistics(enhancedNetwork);
      setStatistics(stats);

      // Update history data
      const history = generateBeliefHistoryData(enhancedNetwork);
      setHistoryData(history);

      // If selected agent exists, update the selection to reflect new data
      if (selectedAgentId !== null) {
        const updatedAgent = enhancedNetwork.nodes.find(
          (agent) => agent.id === selectedAgentId
        );
        if (updatedAgent) {
          setSelectedAgentId(updatedAgent.id);
        }
      }
    } catch (error) {
      console.error("Step error:", error);
      toast.error("Error during simulation step");
      setIsRunning(false);
      if (runInterval) {
        clearInterval(runInterval);
        setRunInterval(null);
      }
    }
  }, [config, network, runInterval, selectedAgentId, isProcessingMessage]);

  // Handle running the simulation continuously
  const handleRunContinuous = useCallback(() => {
    setIsRunning(true);
    // Start with one step immediately
    handleStep();
    
    const interval = window.setInterval(() => {
      handleStep();
    }, STEP_INTERVAL);
    setRunInterval(interval);
  }, [handleStep]);

  // Handle pausing the simulation
  const handlePause = useCallback(() => {
    setIsRunning(false);
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
    toast.info("Simulation paused");
  }, [runInterval]);

  // Handle resetting the simulation
  const handleReset = useCallback(() => {
    setIsRunning(false);
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
    // Cancel any ongoing speech
    cancelSpeech();
    initializeSimulation();
    toast.success("Simulation reset with a new discussion topic");
  }, [initializeSimulation, runInterval]);

  // Handle updating simulation configuration
  const handleUpdateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    setIsRunning(false);
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
    setIsInitialized(false);
  }, [runInterval]);

  // Initialize simulation when configuration changes and not initialized
  useEffect(() => {
    if (!isInitialized) {
      initializeSimulation();
    }
  }, [isInitialized, initializeSimulation]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      if (runInterval) {
        clearInterval(runInterval);
      }
    };
  }, [runInterval]);

  // Handle selecting an agent
  const handleSelectAgent = useCallback((id: number) => {
    setSelectedAgentId(id);
  }, []);

  // Handle exporting simulation data
  const handleExport = useCallback(() => {
    try {
      const csvData = generateExportData(network);
      downloadCSV(csvData, `belief_simulation_${Date.now()}.csv`);
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  }, [network]);

  // Handle message processing status changes
  const handleMessageProcessing = useCallback((isProcessing: boolean) => {
    console.log("Message processing status changed:", isProcessing);
    setIsProcessingMessage(isProcessing);
  }, []);

  // Get the selected agent
  const selectedAgent =
    selectedAgentId !== null
      ? network.nodes.find((agent) => agent.id === selectedAgentId) || null
      : null;

  const isComplete = config.currentStep >= config.steps;

  return (
    <div className="container py-8">
      <SimulationHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        {/* Left column - Simulation Controls, Agent Selection and Agent Details */}
        <div className="md:col-span-3 space-y-6">
          <SimulationControls
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onReset={handleReset}
            onStep={handleStep}
            onRunContinuous={handleRunContinuous}
            onPause={handlePause}
            onExport={handleExport}
            isRunning={isRunning}
            isComplete={isComplete}
            isProcessing={isProcessingMessage} // Pass processing state to disable controls
          />
          
          {/* Settings button */}
          <Button
            variant="outline"
            className="w-full flex gap-2 items-center"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
            {showSettings ? 'Hide Voice Settings' : 'Show Voice Settings'}
          </Button>
          
          {/* ElevenLabs Settings */}
          {showSettings && (
            <ElevenLabsSettings />
          )}
          
          {/* Agent Selector component */}
          <AgentSelector
            agents={network.nodes}
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleSelectAgent}
          />
          
          <AgentDetails agent={selectedAgent} />
        </div>
        
        {/* Center and Right columns - Visualization, Messages, and Stats */}
        <div className="md:col-span-9 space-y-6">
          {/* Network visualization and messages side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Network visualization */}
            <div className="lg:col-span-3">
              <NetworkVisualization
                network={network}
                selectedAgentId={selectedAgentId}
                onSelectAgent={handleSelectAgent}
              />
            </div>
            
            {/* Network messages (desktop) */}
            <div className="lg:col-span-2 hidden lg:block">
              <NetworkMessages 
                network={network} 
                isRunning={isRunning} 
                onProcessingMessage={handleMessageProcessing}
              />
            </div>
          </div>
          
          {/* Mobile-only sheet for messages */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="w-full gap-2">
                  <MessageCircle className="h-4 w-4" />
                  View Network Messages
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <div className="py-6">
                  <NetworkMessages 
                    network={network} 
                    isRunning={isRunning}
                    onProcessingMessage={handleMessageProcessing}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Statistics */}
          <SimulationStats
            network={network}
            historyData={historyData}
            statistics={statistics}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
