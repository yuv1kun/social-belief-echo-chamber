
import React from "react";
import { Info } from "lucide-react";

const SimulationHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">Social Belief Echo Chamber</h1>
      <p className="text-muted-foreground mt-2">
        An interactive simulation of peer influence and belief adoption in social networks
      </p>
      
      <div className="flex items-start gap-2 mt-4 p-4 bg-muted/30 rounded-lg">
        <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            This simulation models how beliefs spread through a network of agents, each with a unique psychological profile based on the Big Five personality traits.
            Agents communicate with each other through messages that reflect their personality and current beliefs.
          </p>
          <p>
            <strong>How to use:</strong> Adjust the simulation parameters, then run the simulation step-by-step or continuously. 
            Click on an agent in the network visualization to view their details, thoughts, and messages. Export results when done.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimulationHeader;
