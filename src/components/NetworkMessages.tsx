
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentMessages from "./AgentMessages";
import { Network, Message } from "@/lib/simulation";
import { MessageCircle } from "lucide-react";

interface NetworkMessagesProps {
  network: Network;
}

interface TypingIndicator {
  agentId: number;
  startTime: number;
  duration: number;
}

const NetworkMessages: React.FC<NetworkMessagesProps> = ({ network }) => {
  const [activeTab, setActiveTab] = useState<"all" | "recent">("all");
  const [typingAgents, setTypingAgents] = useState<TypingIndicator[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  
  // Get all messages from the network log
  const allMessages = network.messageLog;
  
  // Get only the most recent messages (last simulation step)
  const recentMessages = network.messageLog.slice(-20);
  
  // Effect to manage typing indicators and gradual message revealing
  useEffect(() => {
    const currentTabMessages = activeTab === "all" ? allMessages : recentMessages;
    const lastSeenCount = visibleMessages.length;
    const newMessages = currentTabMessages.slice(lastSeenCount);
    
    if (newMessages.length > 0) {
      // Clear old typing indicators
      setTypingAgents([]);
      
      // Create new typing indicators for new messages
      const newTypingIndicators: TypingIndicator[] = newMessages.map(msg => ({
        agentId: msg.senderId,
        startTime: Date.now(),
        duration: Math.random() * 1500 + 500 // Random typing time between 0.5-2 seconds
      }));
      
      setTypingAgents(newTypingIndicators);
      
      // Gradually reveal messages as typing completes
      newMessages.forEach((message, index) => {
        const typingTime = newTypingIndicators[index].duration;
        
        setTimeout(() => {
          setTypingAgents(current => 
            current.filter(t => t.agentId !== message.senderId)
          );
          
          setVisibleMessages(current => {
            // Find if this message is already there
            if (current.find(m => m.id === message.id)) {
              return current;
            }
            return [...current, message];
          });
        }, typingTime);
      });
    }
    
    // When network messages change completely (new simulation), reset visible messages
    if (currentTabMessages.length > 0 && 
        (visibleMessages.length === 0 || 
         currentTabMessages[0].id !== visibleMessages[0]?.id)) {
      setVisibleMessages([]);
    }
  }, [allMessages, recentMessages, activeTab]);
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as "all" | "recent")}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="recent">Recent Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          <AgentMessages 
            messages={visibleMessages}
            allAgents 
            currentTopic={network.currentTopic}
            typingAgents={typingAgents}
          />
        </TabsContent>
        <TabsContent value="recent" className="pt-4">
          <AgentMessages 
            messages={visibleMessages.slice(-20)} 
            allAgents 
            currentTopic={network.currentTopic}
            typingAgents={typingAgents}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkMessages;
