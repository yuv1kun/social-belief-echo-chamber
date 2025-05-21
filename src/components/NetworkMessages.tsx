
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentMessages from "./AgentMessages";
import { Network, Message } from "@/lib/simulation";
import { MessageCircle } from "lucide-react";
import { queueSpeech, cancelSpeech, initializeTTS, getApiKey } from "@/lib/elevenLabsSpeech";
import { toast } from "sonner";

interface NetworkMessagesProps {
  network: Network;
  isRunning: boolean;
  onProcessingMessage?: (isProcessing: boolean) => void;
}

const NetworkMessages: React.FC<NetworkMessagesProps> = ({ 
  network, 
  isRunning,
  onProcessingMessage 
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "recent">("all");
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);
  const networkMessageIdsRef = useRef<Set<string>>(new Set());
  
  // Get all messages from the network log
  const allMessages = network.messageLog;
  
  // Get only the most recent messages (last 20)
  const recentMessages = network.messageLog.slice(-20);

  // Initialize TTS when component mounts
  useEffect(() => {
    initializeTTS();
  }, []);
  
  // Update visible messages when network messageLog changes
  useEffect(() => {
    // If messageLog is reset (simulation restart)
    if (network.messageLog.length === 0) {
      setVisibleMessages([]);
      lastMessageCountRef.current = 0;
      processingRef.current = false;
      networkMessageIdsRef.current.clear();
      cancelSpeech();
      
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
      
      // Notify parent component that we're not processing
      if (onProcessingMessage) {
        onProcessingMessage(false);
      }
      return;
    }

    // Check for new messages in the network log
    const newMessages = network.messageLog.filter(msg => !networkMessageIdsRef.current.has(msg.id));
    
    if (newMessages.length > 0) {
      console.log(`Found ${newMessages.length} new messages to process`);
      
      // If no messages are currently visible or processing, display the first message immediately
      if (visibleMessages.length === 0 && !processingRef.current) {
        const firstMessage = newMessages[0];
        setVisibleMessages([firstMessage]);
        networkMessageIdsRef.current.add(firstMessage.id);
        lastMessageCountRef.current = 1;
        
        // If there are more new messages and we're running, schedule processing
        if (newMessages.length > 1 && isRunning) {
          processNextMessage();
        }
      } 
      // If we're not currently processing messages, start processing now
      else if (!processingRef.current && isRunning) {
        processNextMessage();
      }
    }
  }, [network.messageLog, isRunning]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
      
      // Ensure parent component knows we're not processing
      if (onProcessingMessage) {
        onProcessingMessage(false);
      }
    };
  }, [onProcessingMessage]);
  
  // Process messages with speech when simulation is running
  const processNextMessage = () => {
    if (processingRef.current || !isRunning) return;

    // Find unprocessed messages
    const unprocessedMessages = network.messageLog.filter(msg => !networkMessageIdsRef.current.has(msg.id));
    
    if (unprocessedMessages.length === 0) {
      console.log("No unprocessed messages to display");
      return;
    }
    
    const nextMessage = unprocessedMessages[0];
    console.log(`Processing message: ${nextMessage.id} from agent ${nextMessage.senderId}`);
    
    processingRef.current = true;
    
    // Notify parent that we're processing a message
    if (onProcessingMessage) {
      onProcessingMessage(true);
    }
    
    // Add next message to visible messages
    setVisibleMessages(prev => {
      // Check if message already exists to avoid duplicates
      if (!prev.some(m => m.id === nextMessage.id)) {
        return [...prev, nextMessage];
      }
      return prev;
    });
    
    // Mark this message as processed
    networkMessageIdsRef.current.add(nextMessage.id);
    lastMessageCountRef.current = network.messageLog.findIndex(m => m.id === nextMessage.id) + 1;
    
    // Get agent gender information from network nodes
    const agent = network.nodes.find(a => a.id === nextMessage.senderId);
    const gender = agent?.gender || 'male';
    
    // Check if ElevenLabs API key is set
    if (!getApiKey()) {
      console.log("No ElevenLabs API key, skipping speech");
      processingRef.current = false;
      
      // Schedule next message immediately without speech
      messageTimerRef.current = setTimeout(() => {
        if (onProcessingMessage) {
          onProcessingMessage(false);
        }
        processNextMessage();
      }, 1000); // Short delay between messages
      
      return;
    }
    
    // Queue speech for this message
    queueSpeech(
      nextMessage.content, 
      gender, 
      () => setSpeakingMessageId(nextMessage.id),
      () => {
        setSpeakingMessageId(null);
        processingRef.current = false;
        
        // Notify parent that we're done processing this message
        if (onProcessingMessage) {
          onProcessingMessage(false);
        }
        
        // Schedule next message after speech is complete
        messageTimerRef.current = setTimeout(() => {
          processNextMessage();
        }, 500); // Small delay between messages
      }
    );
  };
  
  // When switching tabs, reset the message display
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "recent");
    // Reset message processing for the new tab
    lastMessageCountRef.current = 0;
    setVisibleMessages([]);
    cancelSpeech();
    processingRef.current = false;
    
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
    
    // Notify parent that we're not processing
    if (onProcessingMessage) {
      onProcessingMessage(false);
    }
  };
  
  const currentMessages = activeTab === "all" ? visibleMessages : visibleMessages.slice(-20);
  
  // Force update of visible messages when simulation starts running
  useEffect(() => {
    if (isRunning && !processingRef.current && network.messageLog.length > 0) {
      // Check if there are unprocessed messages
      const unprocessedMessages = network.messageLog.filter(msg => !networkMessageIdsRef.current.has(msg.id));
      if (unprocessedMessages.length > 0) {
        processNextMessage();
      }
    }
  }, [isRunning, network.messageLog]);
  
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
