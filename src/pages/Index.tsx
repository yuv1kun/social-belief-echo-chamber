import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import SimulationHeader from "@/components/SimulationHeader";
import NetworkVisualization from "@/components/NetworkVisualization";
import SimulationControls from "@/components/SimulationControls";
import AgentDetails from "@/components/AgentDetails";
import SimulationStats from "@/components/SimulationStats";
import NetworkMessages from "@/components/NetworkMessages";
import AgentSelector from "@/components/AgentSelector";
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
import { MessageCircle } from "lucide-react";

// Simulation step interval in milliseconds (5 seconds)
const STEP_INTERVAL = 5000;

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
    currentTopic: getRandomTopic() // Add the required currentTopic property with a random topic
  });
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [runInterval, setRunInterval] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
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
      // Generate a single topic for this simulation run
      const simulationTopic = getRandomTopic();
      toast.info(`New discussion topic: ${simulationTopic}`);
      
      // Create agents
      const agents = initializeAgents(
        config.agentCount,
        config.initialBelieverPercentage
      );

      // Create network
      const newNetwork = createNetwork(
        agents,
        config.networkType,
        config.networkDensity
      );

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

  // Initialize on first load
  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  // Handle simulation step
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

    try {
      // Run one step of belief propagation
      const updatedNetwork = runBeliefPropagationStep(network);
      setNetwork(updatedNetwork);
      setConfig((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));

      // Update stats
      const stats = calculateStatistics(updatedNetwork);
      setStatistics(stats);

      // Update history data
      const history = generateBeliefHistoryData(updatedNetwork);
      setHistoryData(history);

      // If selected agent exists, update the selection to reflect new data
      if (selectedAgentId !== null) {
        const updatedAgent = updatedNetwork.nodes.find(
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
  }, [config, network, runInterval, selectedAgentId]);

  // Handle running the simulation continuously
  const handleRunContinuous = useCallback(() => {
    setIsRunning(true);
    const interval = window.setInterval(() => {
      handleStep();
    }, STEP_INTERVAL); // Using the constant for 5-second interval
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

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
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
          />
          
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
              <NetworkMessages network={network} />
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
                  <NetworkMessages network={network} />
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
