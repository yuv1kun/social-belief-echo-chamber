
import React, { useState } from "react";
import { Message } from "@/lib/simulation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCSV, generateMessageLogExport } from "@/lib/simulation";
import { Network } from "@/lib/simulation";
import AgentMessages from "./AgentMessages";

interface NetworkMessagesProps {
  network: Network;
}

const NetworkMessages: React.FC<NetworkMessagesProps> = ({ network }) => {
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleExportMessages = () => {
    const csv = generateMessageLogExport(network);
    downloadCSV(csv, `message_log_${Date.now()}.csv`);
  };

  // Get only believer messages
  const believerMessages = network.messageLog.filter(m => m.belief);
  
  // Get only non-believer messages
  const nonBelieverMessages = network.messageLog.filter(m => !m.belief);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Network Messages</CardTitle>
        <CardDescription>
          Communication between agents in the network ({network.messageLog.length} total messages)
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="believers">Believers</TabsTrigger>
            <TabsTrigger value="nonbelievers">Non-Believers</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="m-0">
          <CardContent className="pt-4">
            <AgentMessages 
              messages={network.messageLog} 
              allAgents={true} 
            />
          </CardContent>
        </TabsContent>

        <TabsContent value="believers" className="m-0">
          <CardContent className="pt-4">
            <AgentMessages 
              messages={believerMessages} 
              allAgents={true} 
            />
          </CardContent>
        </TabsContent>

        <TabsContent value="nonbelievers" className="m-0">
          <CardContent className="pt-4">
            <AgentMessages 
              messages={nonBelieverMessages} 
              allAgents={true} 
            />
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportMessages}
          disabled={network.messageLog.length === 0}
        >
          Export Message Log
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NetworkMessages;
