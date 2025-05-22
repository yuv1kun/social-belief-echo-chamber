
import { Network, Agent, SimulationConfig, runBeliefPropagationStep, calculateStatistics, generateBeliefHistoryData } from "@/lib/simulation";
import { enhanceNetworkMessages } from "./MessageUtils";
import { toast } from "sonner";
import { cancelSpeech } from "@/lib/elevenLabsSpeech";
import { initializeGemini } from "@/lib/geminiApi";

export interface StepHandlerProps {
  network: Network;
  config: SimulationConfig;
  runInterval: number | null;
  selectedAgentId: number | null;
  isProcessingMessage: boolean;
  setNetwork: React.Dispatch<React.SetStateAction<Network>>;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  setStatistics: React.Dispatch<React.SetStateAction<any>>;
  setHistoryData: React.Dispatch<React.SetStateAction<any[]>>;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setRunInterval: React.Dispatch<React.SetStateAction<number | null>>;
}

// Initialize Gemini when the module loads
initializeGemini();

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
}: StepHandlerProps) => {
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
    
    // Run one step of belief propagation
    const updatedNetwork = runBeliefPropagationStep(network);
    
    // Enhance messages with more diversity - make sure this runs
    // Note that enhanceNetworkMessages is now async
    const enhancedNetwork = await enhanceNetworkMessages(updatedNetwork);
    
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
  } catch (error) {
    console.error("Step error:", error);
    toast.error("Error during simulation step");
    setIsRunning(false);
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
  }
};

// Handle running the simulation continuously
export const handleRunContinuous = (
  stepInterval: number,
  handleStep: () => Promise<void>,
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>,
  setRunInterval: React.Dispatch<React.SetStateAction<number | null>>
) => {
  setIsRunning(true);
  // Start with one step immediately
  handleStep();
  
  const interval = window.setInterval(() => {
    handleStep();
  }, stepInterval);
  setRunInterval(interval);
};

// Handle pausing the simulation
export const handlePause = (
  runInterval: number | null,
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>,
  setRunInterval: React.Dispatch<React.SetStateAction<number | null>>
) => {
  setIsRunning(false);
  if (runInterval) {
    clearInterval(runInterval);
    setRunInterval(null);
  }
  toast.info("Simulation paused");
};

// Handle resetting the simulation
export const handleReset = (
  runInterval: number | null, 
  initializeSimulation: () => void,
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>,
  setRunInterval: React.Dispatch<React.SetStateAction<number | null>>
) => {
  setIsRunning(false);
  if (runInterval) {
    clearInterval(runInterval);
    setRunInterval(null);
  }
  // Cancel any ongoing speech
  cancelSpeech();
  initializeSimulation();
  toast.success("Simulation reset with a new discussion topic");
};
