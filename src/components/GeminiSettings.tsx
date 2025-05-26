
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  setGeminiApiKey, 
  getGeminiApiKey, 
  setGeminiEnabled, 
  getGeminiEnabled,
  testGeminiApiKey
} from "@/lib/geminiApi";
import { toast } from "sonner";

const GeminiSettings = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiKeyValid, setApiKeyValid] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  
  useEffect(() => {
    // Load saved API key and enabled state on component mount
    const savedApiKey = getGeminiApiKey();
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setApiKeyValid(true);
    }
    
    setIsEnabled(getGeminiEnabled());
    setIsLoading(false);
  }, []);
  
  const handleSaveApiKey = async () => {
    if (apiKey && apiKey.trim() !== "") {
      setIsTesting(true);
      const trimmedKey = apiKey.trim();
      
      // Test the API key first
      const isValid = await testGeminiApiKey(trimmedKey);
      
      if (isValid) {
        setGeminiApiKey(trimmedKey);
        setApiKeyValid(true);
        toast.success("Gemini API key is valid and saved!");
        
        // If key is valid, auto-enable Gemini
        if (!isEnabled) {
          setIsEnabled(true);
          setGeminiEnabled(true);
        }
      } else {
        setApiKeyValid(false);
        toast.error("Invalid Gemini API key. Please check your key and try again.");
      }
      
      setIsTesting(false);
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
        <CardTitle className="flex items-center gap-2">
          Gemini API Settings
          {isEnabled && apiKeyValid && (
            <Badge variant="secondary" className="bg-green-500 text-white">Active</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure Gemini AI to generate more diverse agent conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Get your free API key from{" "}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google AI Studio
            </a>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="gemini-api-key">Gemini API Key</Label>
          <Input
            id="gemini-api-key"
            type="password"
            placeholder="Enter your Gemini API key (starts with 'AI...')"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your API key is stored in your browser's local storage and will be tested for validity.
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
            disabled={!apiKeyValid}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveApiKey} 
          disabled={!apiKey || apiKey.trim() === "" || isTesting}
        >
          {isTesting ? "Testing..." : "Test & Save API Key"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GeminiSettings;
