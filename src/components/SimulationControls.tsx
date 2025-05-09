
import { useState } from "react";
import { SimulationConfig } from "@/lib/simulation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlayCircle, 
  PauseCircle, 
  SkipForward, 
  RefreshCw, 
  Download,
  BarChart3
} from "lucide-react";

interface SimulationControlsProps {
  config: SimulationConfig;
  onUpdateConfig: (config: Partial<SimulationConfig>) => void;
  onReset: () => void;
  onStep: () => void;
  onRunContinuous: () => void;
  onPause: () => void;
  onExport: () => void;
  isRunning: boolean;
  isComplete: boolean;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  config,
  onUpdateConfig,
  onReset,
  onStep,
  onRunContinuous,
  onPause,
  onExport,
  isRunning,
  isComplete,
}) => {
  // Local state for sliders
  const [agentCount, setAgentCount] = useState(config.agentCount);
  const [initialBelieverPercentage, setInitialBelieverPercentage] = useState(
    config.initialBelieverPercentage
  );
  const [networkDensity, setNetworkDensity] = useState(config.networkDensity);
  const [steps, setSteps] = useState(config.steps);

  // Handle slider and select changes
  const handleUpdateConfig = () => {
    onUpdateConfig({
      agentCount,
      initialBelieverPercentage,
      networkDensity,
      steps,
    });
    toast.success("Simulation settings updated");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Simulation Controls</span>
          <span className="text-sm font-normal">
            Step: {config.currentStep}/{config.steps}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          Each simulation step takes 2 seconds to process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Number of Agents</span>
              <span>{agentCount}</span>
            </div>
            <Slider
              value={[agentCount]}
              min={10}
              max={100}
              step={1}
              onValueChange={(values) => setAgentCount(values[0])}
              disabled={isRunning || isComplete}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Initial Believers (%)</span>
              <span>{initialBelieverPercentage}%</span>
            </div>
            <Slider
              value={[initialBelieverPercentage]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values) => setInitialBelieverPercentage(values[0])}
              disabled={isRunning || isComplete}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Network Density</span>
              <span>{networkDensity.toFixed(2)}</span>
            </div>
            <Slider
              value={[networkDensity * 100]}
              min={1}
              max={50}
              step={1}
              onValueChange={(values) => setNetworkDensity(values[0] / 100)}
              disabled={isRunning || isComplete}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Simulation Steps</span>
              <span>{steps}</span>
            </div>
            <Slider
              value={[steps]}
              min={5}
              max={50}
              step={1}
              onValueChange={(values) => setSteps(values[0])}
              disabled={isRunning || isComplete}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm">Network Type</div>
            <Select
              value={config.networkType}
              onValueChange={(value) =>
                onUpdateConfig({
                  networkType: value as "random" | "scale-free" | "small-world",
                })
              }
              disabled={isRunning || isComplete}
            >
              <SelectTrigger>
                <SelectValue placeholder="Network Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="scale-free">Scale-Free (Power Law)</SelectItem>
                <SelectItem value="small-world">Small-World</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button
              className="w-full"
              variant="secondary"
              disabled={isRunning || isComplete}
              onClick={handleUpdateConfig}
            >
              Apply Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!isRunning && !isComplete && (
            <Button onClick={onStep} disabled={isComplete}>
              <SkipForward className="mr-1 h-4 w-4" /> Step
            </Button>
          )}

          {!isRunning && !isComplete && (
            <Button onClick={onRunContinuous} disabled={isComplete} variant="default">
              <PlayCircle className="mr-1 h-4 w-4" /> Run
            </Button>
          )}

          {isRunning && (
            <Button onClick={onPause} variant="secondary" className="col-span-2">
              <PauseCircle className="mr-1 h-4 w-4" /> Pause
            </Button>
          )}

          {(isComplete || config.currentStep > 0) && (
            <Button onClick={onReset} variant="destructive">
              <RefreshCw className="mr-1 h-4 w-4" /> Reset
            </Button>
          )}

          {(isComplete || config.currentStep > 0) && (
            <Button onClick={onExport} variant="secondary">
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationControls;
