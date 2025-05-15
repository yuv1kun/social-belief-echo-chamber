
import React from "react";
import { Agent } from "@/lib/simulation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentSelectorProps {
  agents: Agent[];
  onSelectAgent: (agentId: number) => void;
  selectedAgentId: number | null;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  onSelectAgent,
  selectedAgentId,
}) => {
  // Group agents by belief status
  const believers = agents.filter((agent) => agent.believer);
  const nonBelievers = agents.filter((agent) => !agent.believer);

  // Handle selection change
  const handleSelectionChange = (value: string) => {
    onSelectAgent(parseInt(value, 10));
  };

  // Handle radio selection
  const handleRadioChange = (agentId: string) => {
    onSelectAgent(parseInt(agentId, 10));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Agent Selection
        </CardTitle>
        <CardDescription>
          Select an agent to view their details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mobile view - Select dropdown */}
          <div className="block md:hidden">
            <Select onValueChange={handleSelectionChange} value={selectedAgentId?.toString() || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      Agent #{agent.id} - {agent.believer ? "Believer" : "Non-Believer"}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop view - Radio groups */}
          <div className="hidden md:block">
            <ScrollArea className="h-[200px] pr-4">
              <RadioGroup value={selectedAgentId?.toString() || ""} onValueChange={handleRadioChange}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Believers</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {believers.map((agent) => (
                        <div key={agent.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={agent.id.toString()} id={`agent-${agent.id}`} />
                          <label 
                            htmlFor={`agent-${agent.id}`} 
                            className="text-sm cursor-pointer hover:text-primary"
                          >
                            Agent #{agent.id}
                          </label>
                        </div>
                      ))}
                      {believers.length === 0 && (
                        <span className="text-xs text-muted-foreground">No believers</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Non-Believers</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {nonBelievers.map((agent) => (
                        <div key={agent.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={agent.id.toString()} id={`agent-${agent.id}`} />
                          <label 
                            htmlFor={`agent-${agent.id}`} 
                            className="text-sm cursor-pointer hover:text-primary"
                          >
                            Agent #{agent.id}
                          </label>
                        </div>
                      ))}
                      {nonBelievers.length === 0 && (
                        <span className="text-xs text-muted-foreground">No non-believers</span>
                      )}
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentSelector;
