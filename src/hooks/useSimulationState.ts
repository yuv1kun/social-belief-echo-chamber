
import { useState, useCallback } from "react";
import { Network, SimulationConfig, getRandomTopic } from "@/lib/simulation";

export const useSimulationState = () => {
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
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>("voice");
  
  const [statistics, setStatistics] = useState({
    totalAgents: 0,
    believers: 0,
    nonBelievers: 0,
    believerPercentage: 0,
    averageSusceptibility: 0,
    averageDegree: 0,
  });

  const handleSelectAgent = useCallback((id: number) => {
    setSelectedAgentId(id);
  }, []);

  const handleMessageProcessing = useCallback((isProcessing: boolean) => {
    console.log("Message processing status changed:", isProcessing);
    setIsProcessingMessage(isProcessing);
  }, []);

  const handleUpdateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    setIsRunning(false);
    if (runInterval) {
      clearInterval(runInterval);
      setRunInterval(null);
    }
    setIsInitialized(false);
  }, [runInterval]);

  return {
    config,
    network,
    selectedAgentId,
    isRunning,
    isInitialized,
    runInterval,
    historyData,
    showSettings,
    isProcessingMessage,
    settingsTab,
    statistics,
    setConfig,
    setNetwork,
    setSelectedAgentId,
    setIsRunning,
    setIsInitialized,
    setRunInterval,
    setHistoryData,
    setShowSettings,
    setIsProcessingMessage,
    setSettingsTab,
    setStatistics,
    handleSelectAgent,
    handleMessageProcessing,
    handleUpdateConfig,
  };
};
