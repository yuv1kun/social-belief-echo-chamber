
import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  calculateStatistics,
  createNetwork,
  generateBeliefHistoryData,
  initializeAgents,
  getRandomTopic,
} from "@/lib/simulation";
import { initializeTTS, cancelSpeech, getApiKey } from "@/lib/elevenLabsSpeech";
import { initializeGemini } from "@/lib/geminiApi";

interface UseSimulationInitializationProps {
  config: any;
  setNetwork: any;
  setSelectedAgentId: any;
  setConfig: any;
  setStatistics: any;
  setHistoryData: any;
  setIsInitialized: any;
  setShowSettings: any;
  isInitialized: boolean;
}

export const useSimulationInitialization = ({
  config,
  setNetwork,
  setSelectedAgentId,
  setConfig,
  setStatistics,
  setHistoryData,
  setIsInitialized,
  setShowSettings,
  isInitialized,
}: UseSimulationInitializationProps) => {
  const initializeSimulation = useCallback(() => {
    try {
      cancelSpeech();
      
      const simulationTopic = getRandomTopic();
      toast.info(`New discussion topic: ${simulationTopic}`);
      
      const agents = initializeAgents(
        config.agentCount,
        config.initialBelieverPercentage
      );

      agents.forEach(agent => {
        if (!agent.traitHistory) {
          agent.traitHistory = [];
        }
        agent.traitHistory.push({...agent.traits});
      });

      const newNetwork = createNetwork(
        agents,
        config.networkType,
        config.networkDensity
      );

      newNetwork.currentTopic = simulationTopic;
      newNetwork.messageLog = [];

      setNetwork(newNetwork);
      setSelectedAgentId(null);
      setConfig((prev: any) => ({ ...prev, currentStep: 0 }));

      const stats = calculateStatistics(newNetwork);
      setStatistics(stats);

      const history = generateBeliefHistoryData(newNetwork);
      setHistoryData(history);

      setIsInitialized(true);
      toast.success("Simulation initialized");
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Failed to initialize simulation");
    }
  }, [config.agentCount, config.initialBelieverPercentage, config.networkDensity, config.networkType, setNetwork, setSelectedAgentId, setConfig, setStatistics, setHistoryData, setIsInitialized]);

  useEffect(() => {
    // Initialize both TTS and Gemini on app startup
    initializeTTS();
    initializeGemini();
    initializeSimulation();
    
    if (!getApiKey()) {
      setShowSettings(true);
    }
  }, [initializeSimulation, setShowSettings]);

  useEffect(() => {
    if (!isInitialized) {
      initializeSimulation();
    }
  }, [isInitialized, initializeSimulation]);

  return { initializeSimulation };
};
