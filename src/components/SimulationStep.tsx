
import { toast } from "sonner";
import { 
  calculateStatistics, 
  generateBeliefHistoryData, 
  simulateMessageExchange,
  Network,
  SimulationConfig
} from "@/lib/simulation";
import { enhanceNetworkMessages } from "@/lib/messaging/messageEnhancement";

export const handleStep = async ({
  network,
  config,
  runInterval,
  selectedAgentId,
  isProcessingMessage,
  setNetwork,
  setConfig,
  setStatistics,
  setHistoryData,
  setIsRunning,
  setRunInterval
}: {
  network: Network;
  config: SimulationConfig;
  runInterval: number | null;
  selectedAgentId: number | null;
  isProcessingMessage: boolean;
  setNetwork: (network: Network) => void;
  setConfig: (config: SimulationConfig) => void;
  setStatistics: (stats: any) => void;
  setHistoryData: (data: any[]) => void;
  setIsRunning: (running: boolean) => void;
  setRunInterval: (interval: number | null) => void;
}) => {
  if (config.currentStep >= config.steps) {
    setIsRunning(false);
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
    toast.success("Simulation completed!");
    return;
  }

  if (isProcessingMessage) {
    console.log("Skipping step - message processing in progress");
    return;
  }

  try {
    console.log(`Step ${config.currentStep + 1}: Starting message simulation`);
    
    // Simulate message exchange
    let updatedNetwork = simulateMessageExchange(network);
    
    console.log(`Step ${config.currentStep + 1}: Enhancing messages with AI`);
    
    // Enhance messages with AI
    updatedNetwork = await enhanceNetworkMessages(updatedNetwork);
    
    console.log(`Step ${config.currentStep + 1}: Updating statistics`);
    
    // Update statistics
    const newStats = calculateStatistics(updatedNetwork);
    setStatistics(newStats);
    
    // Update history
    const newHistory = generateBeliefHistoryData(updatedNetwork);
    setHistoryData(prev => [...prev, ...newHistory]);
    
    // Update network and step
    setNetwork(updatedNetwork);
    setConfig(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    
    console.log(`Step ${config.currentStep + 1}: Completed successfully`);
    
  } catch (error) {
    console.error("Error in simulation step:", error);
    toast.error("Error occurred during simulation step");
    setIsRunning(false);
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
  }
};

export const handleRunContinuous = (
  stepInterval: number,
  handleSimulationStep: () => Promise<void>,
  setIsRunning: (running: boolean) => void,
  setRunInterval: (interval: NodeJS.Timeout | null) => void
) => {
  setIsRunning(true);
  const interval = setInterval(handleSimulationStep, stepInterval);
  setRunInterval(interval);
  toast.info("Simulation started - running continuously");
};

export const handlePause = (
  runInterval: NodeJS.Timeout | null,
  setIsRunning: (running: boolean) => void,
  setRunInterval: (interval: NodeJS.Timeout | null) => void
) => {
  setIsRunning(false);
  if (runInterval) {
    clearInterval(runInterval);
    setRunInterval(null);
  }
  toast.info("Simulation paused");
};

export const handleReset = async (
  runInterval: NodeJS.Timeout | null,
  initializeSimulation: () => void,
  setIsRunning: (running: boolean) => void,
  setRunInterval: (interval: NodeJS.Timeout | null) => void
) => {
  setIsRunning(false);
  if (runInterval) {
    clearInterval(runInterval);
    setRunInterval(null);
  }
  await initializeSimulation();
  toast.success("Simulation reset");
};
