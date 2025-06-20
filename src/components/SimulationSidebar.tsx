
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import SimulationControls from "./SimulationControls";
import ElevenLabsSettings from "./ElevenLabsSettings";
import GeminiSettings from "./GeminiSettings";
import AgentSelector from "./AgentSelector";
import AgentDetails from "./AgentDetails";
import { Agent, SimulationConfig } from "@/lib/simulation";

interface SimulationSidebarProps {
  config: SimulationConfig;
  agents: Agent[];
  selectedAgent: Agent | null;
  selectedAgentId: number | null;
  isRunning: boolean;
  isComplete: boolean;
  isProcessingMessage: boolean;
  showSettings: boolean;
  settingsTab: string;
  onUpdateConfig: (config: Partial<SimulationConfig>) => void;
  onReset: () => void;
  onStep: () => void;
  onRunContinuous: () => void;
  onPause: () => void;
  onExport: () => void;
  onSelectAgent: (id: number) => void;
  setShowSettings: (show: boolean) => void;
  setSettingsTab: (tab: string) => void;
}

const SimulationSidebar: React.FC<SimulationSidebarProps> = ({
  config,
  agents,
  selectedAgent,
  selectedAgentId,
  isRunning,
  isComplete,
  isProcessingMessage,
  showSettings,
  settingsTab,
  onUpdateConfig,
  onReset,
  onStep,
  onRunContinuous,
  onPause,
  onExport,
  onSelectAgent,
  setShowSettings,
  setSettingsTab,
}) => {
  return (
    <div className="md:col-span-3 space-y-6">
      <SimulationControls
        config={config}
        onUpdateConfig={onUpdateConfig}
        onReset={onReset}
        onStep={onStep}
        onRunContinuous={onRunContinuous}
        onPause={onPause}
        onExport={onExport}
        isRunning={isRunning}
        isComplete={isComplete}
        isProcessing={isProcessingMessage}
      />
      
      <Button
        variant="outline"
        className="w-full flex gap-2 items-center"
        onClick={() => setShowSettings(!showSettings)}
      >
        <Settings className="h-4 w-4" />
        {showSettings ? 'Hide Settings' : 'Show Settings'}
      </Button>
      
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
      
      <AgentSelector
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={onSelectAgent}
      />
      
      <AgentDetails agent={selectedAgent} />
    </div>
  );
};

export default SimulationSidebar;
