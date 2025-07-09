
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { setApiKey, getApiKey, clearApiKey, isValidApiKey, testApiKey } from "@/lib/elevenLabsSpeech";
import { toast } from "sonner";
import { Key, Volume2, ExternalLink, Loader2 } from "lucide-react";

const ElevenLabsSettings: React.FC = () => {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if API key is already set
    const savedKey = getApiKey();
    if (savedKey) {
      if (isKeyVisible) {
        setApiKeyState(savedKey);
      } else {
        setApiKeyState("••••••••••••••••"); // Masked for security
      }
      setIsConfigured(true);
    }
  }, [isKeyVisible]);
  
  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Basic validation
      if (!isValidApiKey(apiKey.trim())) {
        toast.error("API key format appears invalid. ElevenLabs API keys typically start with 'sk_'.");
        setIsSaving(false);
        return;
      }
      
      // Save the key first
      setApiKey(apiKey.trim());
      
      // Test the key with the API
      const isValid = await testApiKey();
      
      if (!isValid) {
        toast.error("Invalid API key. Please check your ElevenLabs API key.");
        setIsSaving(false);
        return;
      }
      
      // If we get here, the key is valid
      setIsKeyVisible(false);
      setApiKeyState("••••••••••••••••"); // Mask the key
      setIsConfigured(true);
      toast.success("ElevenLabs API key validated and saved");
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("An error occurred while saving your API key");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleClearKey = () => {
    clearApiKey();
    setApiKeyState("");
    setIsConfigured(false);
    toast.info("ElevenLabs API key removed");
  };
  
  const toggleKeyVisibility = () => {
    setIsKeyVisible(!isKeyVisible);
  };
  
  const handleTestVoice = async () => {
    if (!getApiKey()) {
      toast.error("Please save an API key first");
      return;
    }
    
    setIsTestingVoice(true);
    
    try {
      // Test with the same method used in the speech library
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': getApiKey() as string
        },
        body: JSON.stringify({
          text: "Hello, I'm your virtual assistant. Your ElevenLabs integration is working correctly.",
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const blob = await response.blob();
      const audioElement = new Audio();
      const url = URL.createObjectURL(blob);
      
      audioElement.src = url;
      audioElement.onended = () => {
        URL.revokeObjectURL(url);
        setIsTestingVoice(false);
        toast.success("Voice test completed successfully!");
      };
      audioElement.onerror = () => {
        setIsTestingVoice(false);
        toast.error("Failed to play test audio");
        URL.revokeObjectURL(url);
      };
      
      await audioElement.play();
      
    } catch (error) {
      console.error('Test voice error:', error);
      setIsTestingVoice(false);
      
      // Provide more specific error messages based on error type
      if (error instanceof Error && error.message.includes("401")) {
        toast.error("API key validation failed. Please check your API key.");
      } else if (error instanceof Error && error.message.includes("429")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else {
        toast.error("Failed to test voice. Please check your API key and try again.");
      }
    }
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
            <div className="flex gap-2">
              <Input
                id="elevenlabs-key"
                type={isKeyVisible ? "text" : "password"}
                placeholder={isConfigured && !isKeyVisible ? "••••••••••••••••" : "Enter your ElevenLabs API key (starts with 'sk_')"}
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                className="flex-1 min-w-0"
              />
              {isConfigured && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={toggleKeyVisibility} 
                  className="shrink-0"
                  size="sm"
                >
                  {isKeyVisible ? "Hide" : "Show"}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isConfigured 
                ? "Your API key is configured. You can change it or clear it below."
                : "Get an API key from ElevenLabs website"}
            </p>
            
            {!isConfigured && (
              <div className="mt-2 text-sm">
                <a 
                  href="https://elevenlabs.io/app/settings/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Get your ElevenLabs API key
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t pt-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button 
            variant="outline" 
            onClick={handleClearKey} 
            disabled={!isConfigured || isSaving}
            className="w-full sm:w-auto order-2 sm:order-1"
            size="sm"
          >
            Clear Key
          </Button>
          <Button 
            onClick={handleSaveKey}
            disabled={isSaving}
            className="flex-1 order-1 sm:order-2"
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Save Key"
            )}
          </Button>
        </div>
        <Button 
          variant="secondary"
          className="w-full gap-2"
          onClick={handleTestVoice}
          disabled={!isConfigured || isTestingVoice}
          size="sm"
        >
          {isTestingVoice ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4" />
              Test Voice
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ElevenLabsSettings;
