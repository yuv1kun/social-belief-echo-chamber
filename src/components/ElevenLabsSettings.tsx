
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { setApiKey, getApiKey, clearApiKey } from "@/lib/elevenLabsSpeech";
import { toast } from "sonner";
import { Key } from "lucide-react";

const ElevenLabsSettings: React.FC = () => {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if API key is already set
    const savedKey = getApiKey();
    if (savedKey) {
      setApiKeyState("••••••••••••••••"); // Masked for security
      setIsConfigured(true);
    }
  }, []);
  
  const handleSaveKey = () => {
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      setApiKeyState("••••••••••••••••"); // Mask the key
      setIsConfigured(true);
      toast.success("ElevenLabs API key saved");
    } else {
      toast.error("Please enter a valid API key");
    }
  };
  
  const handleClearKey = () => {
    clearApiKey();
    setApiKeyState("");
    setIsConfigured(false);
    toast.info("ElevenLabs API key removed");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          ElevenLabs Voice Settings
        </CardTitle>
        <CardDescription>
          Configure ultra-realistic voice synthesis by providing your ElevenLabs API key
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
            <Input
              id="elevenlabs-key"
              type="password"
              placeholder={isConfigured ? "••••••••••••••••" : "Enter your ElevenLabs API key"}
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {isConfigured 
                ? "Your API key is configured. You can change it or clear it below."
                : "Get an API key from https://elevenlabs.io/"}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={handleClearKey} disabled={!isConfigured}>
          Clear Key
        </Button>
        <Button onClick={handleSaveKey}>Save Key</Button>
      </CardFooter>
    </Card>
  );
};

export default ElevenLabsSettings;
