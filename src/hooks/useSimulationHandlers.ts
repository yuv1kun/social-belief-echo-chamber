
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { generateExportData, downloadCSV } from "@/lib/simulation";
import { handleStep, handleRunContinuous, handlePause, handleReset } from "@/components/SimulationStep";
import { cancelSpeech } from "@/lib/elevenLabsSpeech";

const STEP_INTERVAL = 10000;

interface UseSimulationHandlersProps {
  network: any;
  config: any;
  runInterval: number | null;
  selectedAgentId: number | null;
  isProcessingMessage: boolean;
  setNetwork: any;
  setConfig: any;
  setStatistics: any;
  setHistoryData: any;
  setIsRunning: any;
  setRunInterval: any;
  initializeSimulation: () => void;
}

export const useSimulationHandlers = ({
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
  setRunInterval,
  initializeSimulation,
}: UseSimulationHandlersProps) => {
  const handleSimulationStep = useCallback(async () => {
    await handleStep({
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
    });
  }, [config, network, runInterval, selectedAgentId, isProcessingMessage, setNetwork, setConfig, setStatistics, setHistoryData, setIsRunning, setRunInterval]);

  const handleSimulationContinuous = useCallback(() => {
    handleRunContinuous(
      STEP_INTERVAL,
      handleSimulationStep,
      setIsRunning,
      setRunInterval
    );
  }, [handleSimulationStep, setIsRunning, setRunInterval]);

  const handleSimulationPause = useCallback(() => {
    handlePause(runInterval, setIsRunning, setRunInterval);
  }, [runInterval, setIsRunning, setRunInterval]);

  const handleSimulationReset = useCallback(async () => {
    await handleReset(runInterval, initializeSimulation, setIsRunning, setRunInterval);
  }, [initializeSimulation, runInterval, setIsRunning, setRunInterval]);

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

  useEffect(() => {
    return () => {
      cancelSpeech();
      if (runInterval) {
        clearInterval(runInterval);
      }
    };
  }, [runInterval]);

  return {
    handleSimulationStep,
    handleSimulationContinuous,
    handleSimulationPause,
    handleSimulationReset,
    handleExport,
  };
};
