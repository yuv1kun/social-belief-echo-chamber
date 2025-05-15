
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
      
      // Process new messages with consistent timing
      const processNextMessage = (index: number) => {
        if (index >= newMessages.length) return;
        
        const message = newMessages[index];
        
        // Add typing indicator
        setTypingAgents(current => [
          ...current, 
          { 
            agentId: message.senderId,
            startTime: Date.now(),
            duration: 5000 // Fixed 5 seconds typing time
          }
        ]);
        
        // After 5 seconds, reveal the message and remove typing indicator
        setTimeout(() => {
          setTypingAgents(current => 
            current.filter(t => t.agentId !== message.senderId || t.startTime !== current.find(i => i.agentId === message.senderId)?.startTime)
          );
          
          setVisibleMessages(current => {
            // Find if this message is already there
            if (current.find(m => m.id === message.id)) {
              return current;
            }
            return [...current, message];
          });
          
          // Process next message
          processNextMessage(index + 1);
        }, 5000); // 5 seconds between messages
      };
      
      // Start processing the first message
      processNextMessage(0);
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
