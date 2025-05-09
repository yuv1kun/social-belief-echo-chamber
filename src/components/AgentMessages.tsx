
import React from "react";
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

interface AgentMessagesProps {
  messages: Message[];
  agentId?: number;
  allAgents?: boolean;
  currentTopic?: string;
}

const AgentMessages: React.FC<AgentMessagesProps> = ({ 
  messages, 
  agentId, 
  allAgents = false,
  currentTopic
}) => {
  // Sort messages by timestamp, newest first
  const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);
  
  // Limit to 10 most recent messages
  const recentMessages = sortedMessages.slice(0, 10);

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

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
              <Badge variant="outline" className="bg-slate-100">Topic: {currentTopic}</Badge>
            </div>
          )}
          {messages.length > 0 
            ? `Showing ${Math.min(10, messages.length)} of ${messages.length} messages` 
            : "No messages yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-4">
          {recentMessages.length > 0 ? (
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex flex-col space-y-1 border-l-2 pl-4 border-muted-foreground/20 hover:bg-muted/50 rounded p-2 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {message.senderId !== agentId ? (
                          <>From Agent #{message.senderId}</>
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
                  <p className="text-sm font-medium">{message.content}</p>
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
