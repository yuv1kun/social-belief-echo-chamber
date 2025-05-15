
import React, { useRef, useEffect } from "react";
import { Message } from "@/lib/simulation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

interface TypingIndicator {
  agentId: number;
  startTime: number;
  duration: number;
}

interface AgentMessagesProps {
  messages: Message[];
  agentId?: number;
  allAgents?: boolean;
  currentTopic?: string;
  typingAgents?: TypingIndicator[];
}

const AgentMessages: React.FC<AgentMessagesProps> = ({ 
  messages, 
  agentId, 
  allAgents = false,
  currentTopic,
  typingAgents = []
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Sort messages by timestamp, newest last (for chat-like experience)
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  
  // Format timestamp
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, typingAgents]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {allAgents ? "Recent Network Messages" : agentId !== undefined ? `Messages from Agent #${agentId}` : "Messages"}
        </CardTitle>
        <CardDescription className="flex flex-col gap-1">
          {currentTopic && (
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-slate-100">
                <span className="text-black">Topic: {currentTopic}</span>
              </Badge>
            </div>
          )}
          {messages.length > 0 
            ? `${messages.length} messages` 
            : "No messages yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-4" ref={scrollAreaRef}>
          {sortedMessages.length > 0 || typingAgents.length > 0 ? (
            <div className="space-y-4 pb-2">
              {sortedMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex flex-col space-y-1 ${message.senderId !== agentId ? 'border-l-2 pl-4 border-muted-foreground/20' : 'border-r-2 pr-4 border-primary/20 ml-auto'} 
                    hover:bg-muted/50 rounded p-2 transition-colors max-w-[85%] animate-fade-in`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {message.senderId !== agentId ? (
                          <>Agent #{message.senderId}</>
                        ) : (
                          <>To {message.receiverId !== null ? `Agent #${message.receiverId}` : "Everyone"}</>
                        )}
                      </span>
                      <Badge variant={message.belief ? "default" : "secondary"} className="text-xs">
                        {message.belief ? "Believer" : "Skeptic"}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="text-sm font-medium break-words">{message.content}</p>
                </div>
              ))}
              
              {/* Typing indicators with smooth animations */}
              {typingAgents.map((typing) => (
                <div 
                  key={`typing-${typing.agentId}-${typing.startTime}`}
                  className="flex flex-col space-y-1 border-l-2 pl-4 border-muted-foreground/20 rounded p-2 max-w-[85%] animate-fade-in"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Agent #{typing.agentId}</span>
                  </div>
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No messages to display</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AgentMessages;
