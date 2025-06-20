
import React from "react";
import SimulationHeader from "@/components/SimulationHeader";
import SimulationSidebar from "@/components/SimulationSidebar";
import SimulationMainContent from "@/components/SimulationMainContent";
import { useSimulationState } from "@/hooks/useSimulationState";
import { useSimulationInitialization } from "@/hooks/useSimulationInitialization";
import { useSimulationHandlers } from "@/hooks/useSimulationHandlers";

const Index = () => {
  const {
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
    setNetwork,
    setSelectedAgentId,
    setConfig,
    setStatistics,
    setHistoryData,
    setIsRunning,
    setRunInterval,
    setIsInitialized,
    setShowSettings,
    setSettingsTab,
    handleSelectAgent,
    handleMessageProcessing,
    handleUpdateConfig,
  } = useSimulationState();

  const { initializeSimulation } = useSimulationInitialization({
    config,
    setNetwork,
    setSelectedAgentId,
    setConfig,
    setStatistics,
    setHistoryData,
    setIsInitialized,
    setShowSettings,
    isInitialized,
  });

  const {
    handleSimulationStep,
    handleSimulationContinuous,
    handleSimulationPause,
    handleSimulationReset,
    handleExport,
  } = useSimulationHandlers({
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
  });

  const selectedAgent =
    selectedAgentId !== null
      ? network.nodes.find((agent) => agent.id === selectedAgentId) || null
      : null;

  const isComplete = config.currentStep >= config.steps;

  return (
    <div className="container py-8">
      <SimulationHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        <SimulationSidebar
          config={config}
          agents={network.nodes}
          selectedAgent={selectedAgent}
          selectedAgentId={selectedAgentId}
          isRunning={isRunning}
          isComplete={isComplete}
          isProcessingMessage={isProcessingMessage}
          showSettings={showSettings}
          settingsTab={settingsTab}
          onUpdateConfig={handleUpdateConfig}
          onReset={handleSimulationReset}
          onStep={handleSimulationStep}
          onRunContinuous={handleSimulationContinuous}
          onPause={handleSimulationPause}
          onExport={handleExport}
          onSelectAgent={handleSelectAgent}
          setShowSettings={setShowSettings}
          setSettingsTab={setSettingsTab}
        />
        
        <SimulationMainContent
          network={network}
          selectedAgentId={selectedAgentId}
          isRunning={isRunning}
          historyData={historyData}
          statistics={statistics}
          onSelectAgent={handleSelectAgent}
          onProcessingMessage={handleMessageProcessing}
        />
      </div>
    </div>
  );
};

export default Index;
