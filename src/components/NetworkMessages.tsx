
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentMessages from "./AgentMessages";
import { Network, Message } from "@/lib/simulation";
import { MessageCircle } from "lucide-react";
import { queueSpeech, cancelSpeech, initializeVoices } from "@/lib/speech";

interface NetworkMessagesProps {
  network: Network;
  isRunning: boolean;
}

const NetworkMessages: React.FC<NetworkMessagesProps> = ({ network, isRunning }) => {
  const [activeTab, setActiveTab] = useState<"all" | "recent">("all");
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  
  // Get all messages from the network log
  const allMessages = network.messageLog;
  
  // Get only the most recent messages (last 20)
  const recentMessages = network.messageLog.slice(-20);

  // Initialize speech voices when component mounts
  useEffect(() => {
    initializeVoices();
  }, []);
  
  // Reset when simulation resets
  useEffect(() => {
    if (network.messageLog.length === 0) {
      setVisibleMessages([]);
      lastMessageCountRef.current = 0;
      cancelSpeech();
      
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    }
  }, [network.messageLog.length]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    };
  }, []);
  
  // Process messages with speech when simulation is running
  useEffect(() => {
    const messages = activeTab === "all" ? allMessages : recentMessages;
    
    // Clear any existing timer when simulation pauses
    if (!isRunning) {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
      return;
    }
    
    // Reset message display if network has changed completely
    if (allMessages.length > 0 && lastMessageCountRef.current === 0) {
      setVisibleMessages([]);
    }
    
    // Process new messages that haven't been shown yet
    const processNextMessage = () => {
      if (!isRunning) return; // Don't continue if simulation stopped
      
      const nextMessageIndex = lastMessageCountRef.current;
      
      if (nextMessageIndex < messages.length) {
        const nextMessage = messages[nextMessageIndex];
        
        // Add next message to visible messages
        setVisibleMessages(prev => [...prev, nextMessage]);
        lastMessageCountRef.current = nextMessageIndex + 1;
        
        // Get agent gender information from network nodes
        const agent = network.nodes.find(a => a.id === nextMessage.senderId);
        const gender = agent?.gender || 'male';
        
        // Queue speech for this message
        queueSpeech(
          nextMessage.content, 
          gender, 
          () => setSpeakingMessageId(nextMessage.id),
          () => {
            setSpeakingMessageId(null);
            // Schedule next message after speech is complete
            messageTimerRef.current = setTimeout(() => {
              processNextMessage();
            }, 500); // Small delay between messages
          }
        );
      }
    };
    
    // Start processing if there are unprocessed messages and no timer running
    if (lastMessageCountRef.current < messages.length && !messageTimerRef.current) {
      processNextMessage();
    }
    
  }, [allMessages, recentMessages, activeTab, isRunning, network.nodes]);
  
  // When switching tabs, reset the message display
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "recent");
    // Reset message processing for the new tab
    lastMessageCountRef.current = 0;
    setVisibleMessages([]);
    cancelSpeech();
    
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
  };
  
  const currentMessages = activeTab === "all" ? visibleMessages : visibleMessages.slice(-20);
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="recent">Recent Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          <AgentMessages 
            messages={currentMessages}
            allAgents 
            currentTopic={network.currentTopic}
            speakingMessageId={speakingMessageId}
          />
        </TabsContent>
        <TabsContent value="recent" className="pt-4">
          <AgentMessages 
            messages={currentMessages.slice(-20)} 
            allAgents 
            currentTopic={network.currentTopic}
            speakingMessageId={speakingMessageId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkMessages;
