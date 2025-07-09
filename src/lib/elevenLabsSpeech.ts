
/**
 * ElevenLabs Text-to-Speech Service
 */

import { toast } from "sonner";

// Queue for managing speech in sequence
type SpeechQueueItem = {
  text: string;
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
};

// Default voices
const DEFAULT_MALE_VOICE = "Charlie"; // IKne3meq5aSn9XLyUdCD
const DEFAULT_FEMALE_VOICE = "Sarah"; // EXAVITQu4vr4xnSDxMaL
const DEFAULT_VOICE_ID = "Sarah"; // Default voice ID

// Voice mapping
const VOICE_IDS: Record<string, string> = {
  "Charlie": "IKne3meq5aSn9XLyUdCD", // Male
  "Sarah": "EXAVITQu4vr4xnSDxMaL",   // Female
  "Roger": "CwhRBWXzGAHq8TQ4Fs17",   // Male
  "Aria": "9BWtsMINqrJLrRacOk9x",    // Female
  "George": "JBFqnCBsd6RMkjVDRZzb",  // Male
  "Alice": "Xb7hH8MSUJpSbSDYk0k2"    // Female
};

// State variables
let apiKey: string | null = null;
let speechQueue: SpeechQueueItem[] = [];
let isSpeaking = false;
let audioElement: HTMLAudioElement | null = null;

// Set the API key for ElevenLabs
export const setApiKey = (key: string): void => {
  const cleanKey = key.trim();
  apiKey = cleanKey;
  localStorage.setItem('elevenlabs_api_key', cleanKey);
  console.log("API key saved to local storage");
  console.log("API key length:", cleanKey.length);
  console.log("API key starts with sk_:", cleanKey.startsWith('sk_'));
  console.log("API key (first 20 chars):", cleanKey.substring(0, 20));
  toast.success("ElevenLabs API key saved");
};

// Get the API key from localStorage if available
export const getApiKey = (): string | null => {
  if (!apiKey) {
    apiKey = localStorage.getItem('elevenlabs_api_key');
    console.log("Retrieved API key from local storage:", apiKey ? "Found key" : "No key found");
  }
  return apiKey;
};

// Clear the API key
export const clearApiKey = (): void => {
  apiKey = null;
  localStorage.removeItem('elevenlabs_api_key');
  console.log("API key cleared from local storage");
};

// Validate API key format - relaxed validation
export const isValidApiKey = (key: string): boolean => {
  // ElevenLabs API keys can have different formats
  // Allow keys that are at least 10 characters long (very relaxed validation)
  if (key && key.trim().length >= 10) {
    console.log("API key format validation passed");
    return true;
  } 
  console.log("API key format validation failed");
  return false;
};

// Test API key with ElevenLabs API
export const testApiKey = async (): Promise<boolean> => {
  const key = getApiKey();
  if (!key) return false;
  
  try {
    console.log("Testing API key with ElevenLabs API...");
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': key
      }
    });
    
    const isValid = response.ok;
    console.log("API key test result:", isValid ? "Valid" : "Invalid", "Status:", response.status);
    
    if (!isValid) {
      console.error("API validation error:", response.status, response.statusText);
    }
    
    return isValid;
  } catch (error) {
    console.error("API key test failed:", error);
    return false;
  }
};

// Initialize the TTS service
export const initializeTTS = (): void => {
  // Check for saved API key
  if (!apiKey) {
    getApiKey();
  }
  
  // Clear any existing audio and queues
  cancelSpeech();
};

// Process the speech queue
const processSpeechQueue = async (): Promise<void> => {
  if (speechQueue.length === 0 || isSpeaking) return;
  
  isSpeaking = true;
  const item = speechQueue[0];
  
  try {
    await speak(item.text, item.voiceId, item.onStart, item.onEnd);
  } catch (error) {
    console.error("Speech error:", error);
    if (item.onEnd) item.onEnd();
  } finally {
    // Remove spoken item from queue
    speechQueue.shift();
    isSpeaking = false;
    
    // Process next item if available
    processSpeechQueue();
  }
};

// Direct speech function using ElevenLabs API
const speak = async (
  text: string, 
  voiceId?: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> => {
  if (!apiKey) {
    console.warn('ElevenLabs API key not set');
    toast.error("ElevenLabs API key not set. Please add your API key in settings.");
    if (onEnd) onEnd();
    return;
  }
  
  // Clean up text for speech
  // Remove agent prefix and parenthetical thoughts
  let cleanText = text
    .replace(/^.*?:\s+/, '')  // Remove "Agent Name: " prefix
    .replace(/\(.*?\)/g, ''); // Remove (parenthetical thoughts)
  
  // Use the specified voice or default
  const voice = voiceId || DEFAULT_VOICE_ID;
  const actualVoiceId = VOICE_IDS[voice] || voice;
  
  try {
    console.log("Starting TTS request with ElevenLabs API...");
    console.log("Using voice ID:", actualVoiceId);
    console.log("Text to speak:", cleanText.substring(0, 50) + "...");
    
    // Create a new audio element
    if (audioElement) {
      audioElement.pause();
      audioElement.remove();
    }
    
    audioElement = new Audio();
    
    // Call the ElevenLabs API to generate audio
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    });

    console.log("ElevenLabs API response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      
      // Show appropriate error based on status code
      if (response.status === 401) {
        toast.error("Invalid ElevenLabs API key. Please check your settings.");
      } else if (response.status === 429) {
        toast.error("ElevenLabs rate limit exceeded. Please try again later.");
      } else {
        toast.error(`ElevenLabs API error: ${response.status}`);
      }
      
      throw new Error(errorMessage);
    }

    console.log("ElevenLabs API response received successfully");

    // Convert the response to a blob
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    // Set up the audio element
    audioElement.src = audioUrl;
    
    // Set event handlers
    audioElement.onplay = () => {
      console.log("Audio playback started");
      if (onStart) onStart();
    };
    
    audioElement.onended = () => {
      console.log("Audio playback finished");
      if (onEnd) onEnd();
      URL.revokeObjectURL(audioUrl);
    };
    
    audioElement.onerror = (event) => {
      console.error('Audio playback error:', event);
      if (onEnd) onEnd();
      URL.revokeObjectURL(audioUrl);
    };
    
    // Start playing
    console.log("Starting audio playback");
    await audioElement.play();
    console.log("Audio playback started successfully");
    
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    toast.error("Failed to generate speech. Please check console for details.");
    if (onEnd) onEnd();
  }
};

// Queue a speech item
export const queueSpeech = (
  text: string, 
  gender?: 'male' | 'female',
  onStart?: () => void,
  onEnd?: () => void
): void => {
  console.log("Queueing speech:", text.substring(0, 50) + "...");
  
  // Select voice based on gender
  const voiceId = gender === 'male' ? DEFAULT_MALE_VOICE : DEFAULT_FEMALE_VOICE;
  
  speechQueue.push({ text, voiceId, onStart, onEnd });
  processSpeechQueue();
};

// Cancel all speech
export const cancelSpeech = (): void => {
  if (audioElement) {
    audioElement.pause();
    audioElement = null;
  }
  speechQueue = [];
  isSpeaking = false;
  console.log("Speech cancelled, queue cleared");
};
