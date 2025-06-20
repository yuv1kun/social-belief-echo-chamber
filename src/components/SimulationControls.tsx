
import React from "react";
import { Button } from "@/components/ui/button";
import { SimulationConfig } from "@/lib/simulation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Play, Pause, ChevronRight, Download } from "lucide-react";

interface SimulationControlsProps {
  config: SimulationConfig;
  isRunning: boolean;
  isComplete: boolean;
  isProcessing?: boolean; // Added for message processing
  onUpdateConfig: (config: Partial<SimulationConfig>) => void;
  onReset: () => void;
  onStep: () => void;
  onRunContinuous: () => void;
  onPause: () => void;
  onExport: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  config,
  isRunning,
  isComplete,
  isProcessing = false,
  onUpdateConfig,
  onReset,
  onStep,
  onRunContinuous,
  onPause,
  onExport,
}) => {
  // Handle changes to number inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof SimulationConfig) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      onUpdateConfig({ [key]: value });
    }
  };

  // Handle changes to the network type
  const handleNetworkTypeChange = (value: string) => {
    onUpdateConfig({ networkType: value as "random" | "scale-free" | "small-world" });
  };

  // Handle changes to the network density slider
  const handleDensityChange = (value: number[]) => {
    onUpdateConfig({ networkDensity: value[0] });
  };

  // Determine if buttons should be disabled
  const isDisabled = isRunning || isProcessing; // Disable when running or processing messages
  const isStepDisabled = isRunning || isComplete || isProcessing; // Disable step button when running, complete, or processing

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Controls</CardTitle>
        <CardDescription>Configure and run the belief propagation simulation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Agent Count */}
          <div className="space-y-2">
            <Label htmlFor="agent-count">Number of Agents</Label>
            <Input
              id="agent-count"
              type="number"
              min={5}
              max={200}
              value={config.agentCount}
              onChange={(e) => handleNumberChange(e, "agentCount")}
              disabled={isDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 10-100 agents for optimal performance
            </p>
          </div>

          {/* Initial Believer Percentage */}
          <div className="space-y-2">
            <Label htmlFor="believer-percentage">Initial Believer %</Label>
            <Input
              id="believer-percentage"
              type="number"
              min={0}
              max={100}
              value={config.initialBelieverPercentage}
              onChange={(e) => handleNumberChange(e, "initialBelieverPercentage")}
              disabled={isDisabled}
            />
          </div>

          {/* Network Type */}
          <div className="space-y-2">
            <Label htmlFor="network-type">Network Type</Label>
            <Select
              value={config.networkType}
              onValueChange={handleNetworkTypeChange}
              disabled={isDisabled}
            >
              <SelectTrigger id="network-type">
                <SelectValue placeholder="Select network type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="scale-free">Scale-Free</SelectItem>
                <SelectItem value="small-world">Small-World</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Determines how agents are connected in the network
            </p>
          </div>

          {/* Network Density */}
          <div className="space-y-2">
            <Label>
              Network Density: {(config.networkDensity * 100).toFixed(0)}%
            </Label>
            <Slider
              defaultValue={[config.networkDensity]}
              min={0.01}
              max={0.5}
              step={0.01}
              onValueChange={handleDensityChange}
              disabled={isDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Higher density means more connections between agents
            </p>
          </div>

          {/* Simulation Steps */}
          <div className="space-y-2">
            <Label htmlFor="steps">Simulation Steps</Label>
            <Input
              id="steps"
              type="number"
              min={1}
              max={100}
              value={config.steps}
              onChange={(e) => handleNumberChange(e, "steps")}
              disabled={isDisabled}
            />
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Label>
              Progress: {config.currentStep} / {config.steps} steps
              {isProcessing && " (processing messages...)"}
            </Label>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${(config.currentStep / config.steps) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 p-6">
        <div className="grid grid-cols-2 gap-2 w-full">
          {isRunning ? (
            <Button onClick={onPause} className="col-span-2" variant="outline">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          ) : (
            <Button 
              onClick={onRunContinuous} 
              className="col-span-2" 
              disabled={isComplete || isProcessing}
            >
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
          )}
          <Button 
            onClick={onStep} 
            variant="outline" 
            disabled={isStepDisabled}
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Step
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            disabled={isDisabled}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
        <Button
          onClick={onExport}
          variant="secondary"
          className="w-full"
          disabled={!config.currentStep}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SimulationControls;
