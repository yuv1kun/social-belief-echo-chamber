
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/lib/simulation";
import AgentMessages from "./AgentMessages";

interface AgentDetailsProps {
  agent: Agent | null;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({ agent }) => {
  const [activeTab, setActiveTab] = useState<string>("profile");

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
      
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="thoughts">Thoughts</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="profile" className="m-0">
          <CardContent className="space-y-4 pt-4">
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
        </TabsContent>

        <TabsContent value="thoughts" className="m-0">
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Current Thought</h3>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm italic">"{agent.thoughtState || "No thoughts yet"}"</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Belief Pattern</h3>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    {agent.believer 
                      ? "Currently believes the proposition." 
                      : "Currently does not believe the proposition."}
                  </p>
                  <p className="text-sm mt-2">
                    {agent.beliefHistory.filter(b => b).length === agent.beliefHistory.length
                      ? "Has always been a believer."
                      : agent.beliefHistory.filter(b => !b).length === agent.beliefHistory.length
                      ? "Has never been a believer."
                      : `Has changed belief ${agent.beliefHistory.slice(1).filter((b, i) => b !== agent.beliefHistory[i]).length} time(s).`
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="messages" className="m-0">
          <CardContent className="pt-4">
            <AgentMessages 
              messages={[
                ...(agent.messages || []), 
                ...(agent.receivedMessages || [])
              ]}
              agentId={agent.id}
            />
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="text-xs text-muted-foreground">
        Agent ID: {agent.id}
      </CardFooter>
    </Card>
  );
};

export default AgentDetails;
