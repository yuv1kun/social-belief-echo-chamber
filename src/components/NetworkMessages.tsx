
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentMessages from "./AgentMessages";
import { Network, Message } from "@/lib/simulation";
import { MessageCircle } from "lucide-react";

interface NetworkMessagesProps {
  network: Network;
  isRunning: boolean;
}

const NetworkMessages: React.FC<NetworkMessagesProps> = ({ network, isRunning }) => {
  const [activeTab, setActiveTab] = useState<"all" | "recent">("all");
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const messageProcessorRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get all messages from the network log
  const allMessages = network.messageLog;
  
  // Get only the most recent messages (last 20)
  const recentMessages = network.messageLog.slice(-20);
  
  // Reset messages when simulation is reset
  useEffect(() => {
    if (network.messageLog.length === 0) {
      setVisibleMessages([]);
      setProcessedCount(0);
      
      if (messageProcessorRef.current) {
        clearTimeout(messageProcessorRef.current);
        messageProcessorRef.current = null;
      }
    }
  }, [network.messageLog.length]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (messageProcessorRef.current) {
        clearTimeout(messageProcessorRef.current);
        messageProcessorRef.current = null;
      }
    };
  }, []);
  
  // Process messages only when simulation is running
  useEffect(() => {
    const currentTabMessages = activeTab === "all" ? allMessages : recentMessages;
    
    // Stop processing messages if simulation is paused
    if (!isRunning) {
      if (messageProcessorRef.current) {
        clearTimeout(messageProcessorRef.current);
        messageProcessorRef.current = null;
      }
      return;
    }
    
    // Get messages that still need to be processed
    const unprocessedMessages = currentTabMessages.slice(processedCount);
    
    if (unprocessedMessages.length > 0) {
      // Process one message at a time
      const processNextMessage = () => {
        if (!isRunning) return; // Exit if simulation is stopped
        
        const message = unprocessedMessages[0];
        
        if (!message) return; // Exit if no message to process
        
        // After 5 seconds, reveal the message
        messageProcessorRef.current = setTimeout(() => {
          if (!isRunning) return; // Don't update state if simulation is stopped
          
          setVisibleMessages(current => {
            // Find if this message is already there
            if (current.find(m => m.id === message.id)) {
              return current;
            }
            return [...current, message];
          });
          
          // Update processed count
          setProcessedCount(current => current + 1);
          
          // Process next message in the queue
          if (unprocessedMessages.length > 1) {
            processNextMessage();
          }
        }, 5000); // Exactly 5 seconds between messages
      };
      
      // Start processing the first message
      processNextMessage();
    }
    
    // When network changes completely (new simulation), reset visible messages
    if (currentTabMessages.length > 0 && 
        (visibleMessages.length === 0 || 
         currentTabMessages[0].id !== visibleMessages[0]?.id)) {
      setVisibleMessages([]);
      setProcessedCount(0);
    }
  }, [allMessages, recentMessages, activeTab, isRunning, processedCount]);
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={(value) => {
        setActiveTab(value as "all" | "recent");
        // Reset message processing when changing tabs
        setProcessedCount(0);
        setVisibleMessages([]);
      }}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="recent">Recent Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          <AgentMessages 
            messages={visibleMessages}
            allAgents 
            currentTopic={network.currentTopic}
          />
        </TabsContent>
        <TabsContent value="recent" className="pt-4">
          <AgentMessages 
            messages={visibleMessages.slice(-20)} 
            allAgents 
            currentTopic={network.currentTopic}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkMessages;
