
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
  
  // Get all messages from the network log
  const allMessages = network.messageLog;
  
  // Get only the most recent messages (last 20)
  const recentMessages = network.messageLog.slice(-20);

  // Initialize TTS when component mounts
  useEffect(() => {
    initializeTTS();
  }, []);
  
  // Reset when simulation resets
  useEffect(() => {
    if (network.messageLog.length === 0) {
      setVisibleMessages([]);
      lastMessageCountRef.current = 0;
      processingRef.current = false;
      cancelSpeech();
      
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
      
      // Notify parent component that we're not processing
      if (onProcessingMessage) {
        onProcessingMessage(false);
      }
    }
  }, [network.messageLog.length, onProcessingMessage]);
  
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
  useEffect(() => {
    const messages = activeTab === "all" ? allMessages : recentMessages;
    
    // Clear any existing timer when simulation pauses
    if (!isRunning) {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
      processingRef.current = false;
      if (onProcessingMessage) {
        onProcessingMessage(false);
      }
      return;
    }
    
    // Reset message display if network has changed completely
    if (allMessages.length > 0 && lastMessageCountRef.current === 0) {
      setVisibleMessages([]);
    }
    
    // Process new messages that haven't been shown yet
    const processNextMessage = () => {
      if (!isRunning || processingRef.current) return; // Don't continue if simulation stopped or already processing
      
      const nextMessageIndex = lastMessageCountRef.current;
      
      if (nextMessageIndex < messages.length) {
        processingRef.current = true;
        
        // Notify parent that we're processing a message
        if (onProcessingMessage) {
          onProcessingMessage(true);
        }
        
        const nextMessage = messages[nextMessageIndex];
        
        // Add next message to visible messages
        setVisibleMessages(prev => [...prev, nextMessage]);
        lastMessageCountRef.current = nextMessageIndex + 1;
        
        // Get agent gender information from network nodes
        const agent = network.nodes.find(a => a.id === nextMessage.senderId);
        const gender = agent?.gender || 'male';
        
        // Check if ElevenLabs API key is set
        if (!getApiKey()) {
          toast.warning("ElevenLabs API key not set. Using browser speech instead.");
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
      }
    };
    
    // Start processing if there are unprocessed messages and no timer running
    if (lastMessageCountRef.current < messages.length && !messageTimerRef.current && !processingRef.current) {
      processNextMessage();
    }
    
  }, [allMessages, recentMessages, activeTab, isRunning, network.nodes, onProcessingMessage]);
  
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
