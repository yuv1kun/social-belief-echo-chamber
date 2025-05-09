
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/lib/simulation";

interface AgentDetailsProps {
  agent: Agent | null;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({ agent }) => {
  if (!agent) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
          <CardDescription>Select an agent to view details</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Agent #{agent.id}
          <Badge variant={agent.believer ? "default" : "secondary"}>
            {agent.believer ? "Believer" : "Non-Believer"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Connected to {agent.neighbors.length} other agents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Personality Profile</h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Openness</span>
                <span>{(agent.traits.openness * 100).toFixed(0)}%</span>
              </div>
              <Progress value={agent.traits.openness * 100} />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Conscientiousness</span>
                <span>{(agent.traits.conscientiousness * 100).toFixed(0)}%</span>
              </div>
              <Progress value={agent.traits.conscientiousness * 100} />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Extraversion</span>
                <span>{(agent.traits.extraversion * 100).toFixed(0)}%</span>
              </div>
              <Progress value={agent.traits.extraversion * 100} />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Agreeableness</span>
                <span>{(agent.traits.agreeableness * 100).toFixed(0)}%</span>
              </div>
              <Progress value={agent.traits.agreeableness * 100} />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Neuroticism</span>
                <span>{(agent.traits.neuroticism * 100).toFixed(0)}%</span>
              </div>
              <Progress value={agent.traits.neuroticism * 100} />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Susceptibility to Influence</span>
                <span>{((agent.susceptibility || 0) * 100).toFixed(0)}%</span>
              </div>
              <Progress 
                value={(agent.susceptibility || 0) * 100} 
                className="bg-secondary" 
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Belief History</h3>
          <div className="flex gap-1 flex-wrap">
            {agent.beliefHistory.map((belief, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-sm ${
                  belief ? "bg-simulation-believer" : "bg-simulation-nonbeliever"
                }`}
                title={`Step ${index}: ${belief ? "Believer" : "Non-Believer"}`}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Connected Agents</h3>
          <div className="flex gap-1 flex-wrap">
            {agent.neighbors.map((neighborId) => (
              <Badge key={neighborId} variant="outline">
                #{neighborId}
              </Badge>
            ))}
            {agent.neighbors.length === 0 && (
              <span className="text-xs text-muted-foreground">No connections</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentDetails;
