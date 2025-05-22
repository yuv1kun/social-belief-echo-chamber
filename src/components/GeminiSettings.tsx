
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  setGeminiApiKey, 
  getGeminiApiKey, 
  setGeminiEnabled, 
  getGeminiEnabled 
} from "@/lib/geminiApi";

const GeminiSettings = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Load saved API key and enabled state on component mount
    const savedApiKey = getGeminiApiKey();
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    setIsEnabled(getGeminiEnabled());
    setIsLoading(false);
  }, []);
  
  const handleSaveApiKey = () => {
    if (apiKey && apiKey.trim() !== "") {
      setGeminiApiKey(apiKey.trim());
    }
  };
  
  const handleToggleEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    setGeminiEnabled(enabled);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gemini API Settings</CardTitle>
        <CardDescription>
          Configure Gemini AI to generate more diverse agent conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gemini-api-key">Gemini API Key</Label>
          <Input
            id="gemini-api-key"
            type="password"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your API key is stored in your browser's local storage.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="use-gemini">Use Gemini for messaging</Label>
            <p className="text-xs text-muted-foreground">
              Enable AI-generated messages instead of templates
            </p>
          </div>
          <Switch
            id="use-gemini"
            checked={isEnabled}
            onCheckedChange={handleToggleEnabled}
            disabled={!apiKey}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveApiKey} disabled={!apiKey || apiKey.trim() === ""}>
          Save API Key
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GeminiSettings;
