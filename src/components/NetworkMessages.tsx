
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentMessages from "./AgentMessages";
import { Network } from "@/lib/simulation";

interface NetworkMessagesProps {
  network: Network;
}

const NetworkMessages: React.FC<NetworkMessagesProps> = ({ network }) => {
  const [activeTab, setActiveTab] = useState<"all" | "recent">("all");
  
  // Get all messages from the network log
  const allMessages = network.messageLog;
  
  // Get only the most recent messages (last simulation step)
  const recentMessages = network.messageLog.slice(-20);
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as "all" | "recent")}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="recent">Recent Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          <AgentMessages 
            messages={allMessages} 
            allAgents 
            currentTopic={network.currentTopic}
          />
        </TabsContent>
        <TabsContent value="recent" className="pt-4">
          <AgentMessages 
            messages={recentMessages} 
            allAgents 
            currentTopic={network.currentTopic}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkMessages;
