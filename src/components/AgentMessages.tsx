
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
import { MessageCircle, Volume2, Reply } from "lucide-react";

interface AgentMessagesProps {
  messages: Message[];
  agentId?: number;
  allAgents?: boolean;
  currentTopic?: string;
  speakingMessageId?: string | null;
}

const AgentMessages: React.FC<AgentMessagesProps> = ({ 
  messages, 
  agentId, 
  allAgents = false,
  currentTopic,
  speakingMessageId = null
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
  }, [messages]);

  // Find the message being replied to
  const findReplyToMessage = (replyToId?: string): Message | undefined => {
    if (!replyToId) return undefined;
    return messages.find(msg => msg.id === replyToId);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {allAgents ? "Recent Network Messages" : agentId !== undefined ? `Messages from Agent #${agentId}` : "Messages"}
        </CardTitle>
        <CardDescription>
          <div className="flex flex-col gap-1">
            {currentTopic && (
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-sm">
                  Topic: {currentTopic}
                </span>
              </div>
            )}
            <div>
              {messages.length > 0 
                ? `${messages.length} messages` 
                : "No messages yet"}
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-4" ref={scrollAreaRef}>
          {sortedMessages.length > 0 ? (
            <div className="space-y-4 pb-2">
              {sortedMessages.map((message) => {
                const replyToMessage = findReplyToMessage(message.replyToId);
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex flex-col space-y-1 ${message.senderId !== agentId ? 'border-l-2 pl-4 border-muted-foreground/20' : 'border-r-2 pr-4 border-primary/20 ml-auto'} 
                      hover:bg-muted/50 rounded p-2 transition-colors max-w-[85%] animate-fade-in
                      ${speakingMessageId === message.id ? 'bg-muted/60 border-primary/50' : ''}`}
                  >
                    {replyToMessage && (
                      <div className="flex items-center text-xs text-muted-foreground gap-1 mb-1 border-l-2 border-muted pl-2 py-1">
                        <Reply className="h-3 w-3" />
                        <span>Replying to: </span>
                        <span className="font-medium">Agent #{replyToMessage.senderId}</span>
                      </div>
                    )}
                    
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
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-medium break-words flex-1">{message.content}</p>
                      {speakingMessageId === message.id && (
                        <Volume2 className="h-4 w-4 text-primary animate-pulse flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
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
