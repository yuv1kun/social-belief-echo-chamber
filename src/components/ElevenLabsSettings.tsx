
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { setApiKey, getApiKey, clearApiKey, isValidApiKey } from "@/lib/elevenLabsSpeech";
import { toast } from "sonner";
import { Key, Volume2, ExternalLink } from "lucide-react";

const ElevenLabsSettings: React.FC = () => {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if API key is already set
    const savedKey = getApiKey();
    if (savedKey) {
      setApiKeyState("••••••••••••••••"); // Masked for security
      setIsConfigured(true);
    }
  }, []);
  
  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    
    // Basic validation
    if (!isValidApiKey(apiKey.trim())) {
      toast.error("API key format appears invalid. Please check your ElevenLabs API key.");
      return;
    }
    
    setApiKey(apiKey.trim());
    setApiKeyState("••••••••••••••••"); // Mask the key
    setIsConfigured(true);
    toast.success("ElevenLabs API key saved");
  };
  
  const handleClearKey = () => {
    clearApiKey();
    setApiKeyState("");
    setIsConfigured(false);
    toast.info("ElevenLabs API key removed");
  };
  
  const handleTestVoice = () => {
    if (!getApiKey()) {
      toast.error("Please save an API key first");
      return;
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    setIsTestingVoice(true);
    
    // Create an audio element for testing
    const audioElement = new Audio();
    
    // Use a small test phrase
    fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL/stream', {
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
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      audioElement.src = url;
      audioElement.onended = () => {
        URL.revokeObjectURL(url);
        setIsTestingVoice(false);
      };
      audioElement.onerror = () => {
        setIsTestingVoice(false);
        toast.error("Failed to play test audio");
      };
      audioElement.play().catch(err => {
        console.error('Could not play audio:', err);
        setIsTestingVoice(false);
        toast.error("Failed to play test audio. Please check browser permissions.");
      });
    })
    .catch(error => {
      console.error('Test voice error:', error);
      setIsTestingVoice(false);
      toast.error("Failed to test voice. Please check your API key and try again.");
    });
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
                : "Get an API key from ElevenLabs website"}
            </p>
            
            {!isConfigured && (
              <div className="mt-2 text-sm">
                <a 
                  href="https://elevenlabs.io/speech-synthesis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Sign up for ElevenLabs API key
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
        <Button 
          variant="outline" 
          onClick={handleClearKey} 
          disabled={!isConfigured}
          className="w-full sm:w-auto"
        >
          Clear Key
        </Button>
        <div className="flex-1 flex gap-2 w-full">
          <Button 
            onClick={handleSaveKey}
            className="flex-1"
          >
            Save Key
          </Button>
          <Button 
            variant="secondary"
            className="gap-2"
            onClick={handleTestVoice}
            disabled={!isConfigured || isTestingVoice}
          >
            <Volume2 className="h-4 w-4" />
            {isTestingVoice ? "Testing..." : "Test Voice"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ElevenLabsSettings;
