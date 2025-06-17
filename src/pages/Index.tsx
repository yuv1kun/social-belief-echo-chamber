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
import GeminiSettings from "@/components/GeminiSettings";
import SystemDiagnostics from "@/components/SystemDiagnostics";
import NetworkAnalytics from "@/components/NetworkAnalytics";
import PredictiveAnalytics from "@/components/PredictiveAnalytics";
import MetricsOverview from "@/components/MetricsOverview";
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
  getRandomTopic,
} from "@/lib/simulation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle, Settings } from "lucide-react";
import { initializeTTS, cancelSpeech, getApiKey } from "@/lib/elevenLabsSpeech";
import { handleStep, handleRunContinuous, handlePause, handleReset } from "@/components/SimulationStep";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Simulation step interval in milliseconds (adjusted to 10 seconds to allow time for message processing)
const STEP_INTERVAL = 10000;

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
  const [settingsTab, setSettingsTab] = useState<string>("voice"); // Default tab
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

  // Simulation step handler
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
  }, [config, network, runInterval, selectedAgentId, isProcessingMessage]);

  // Continuous run handler
  const handleSimulationContinuous = useCallback(() => {
    handleRunContinuous(
      STEP_INTERVAL,
      handleSimulationStep,
      setIsRunning,
      setRunInterval
    );
  }, [handleSimulationStep]);

  // Pause handler
  const handleSimulationPause = useCallback(() => {
    handlePause(runInterval, setIsRunning, setRunInterval);
  }, [runInterval]);

  // Reset handler
  const handleSimulationReset = useCallback(async () => {
    await handleReset(runInterval, initializeSimulation, setIsRunning, setRunInterval);
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
            onReset={handleSimulationReset}
            onStep={handleSimulationStep}
            onRunContinuous={handleSimulationContinuous}
            onPause={handleSimulationPause}
            onExport={handleExport}
            isRunning={isRunning}
            isComplete={isComplete}
            isProcessing={isProcessingMessage}
          />
          
          {/* Settings button */}
          <Button
            variant="outline"
            className="w-full flex gap-2 items-center"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </Button>
          
          {/* Settings Tabs */}
          {showSettings && (
            <Tabs defaultValue={settingsTab} onValueChange={setSettingsTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="gemini">Gemini</TabsTrigger>
              </TabsList>
              <TabsContent value="voice" className="mt-4">
                <ElevenLabsSettings />
              </TabsContent>
              <TabsContent value="gemini" className="mt-4">
                <GeminiSettings />
              </TabsContent>
            </Tabs>
          )}
          
          {/* Agent Selector component */}
          <AgentSelector
            agents={network.nodes}
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleSelectAgent}
          />
          
          <AgentDetails agent={selectedAgent} />
        </div>
        
        {/* Center and Right columns - Enhanced with Futuristic Analytics */}
        <div className="md:col-span-9 space-y-6">
          {/* System Diagnostics - Iron Man Style */}
          <SystemDiagnostics />
          
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
          
          {/* Advanced Metrics Overview */}
          <MetricsOverview network={network} statistics={statistics} />
          
          {/* Advanced Analytics Tabs */}
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analytics">Network Analytics</TabsTrigger>
              <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
              <TabsTrigger value="classic">Classic Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="mt-6">
              <NetworkAnalytics network={network} />
            </TabsContent>
            
            <TabsContent value="predictions" className="mt-6">
              <PredictiveAnalytics network={network} historyData={historyData} />
            </TabsContent>
            
            <TabsContent value="classic" className="mt-6">
              <SimulationStats
                network={network}
                historyData={historyData}
                statistics={statistics}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
