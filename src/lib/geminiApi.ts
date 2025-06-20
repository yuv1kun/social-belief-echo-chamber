// Gemini API integration for generating more diverse agent conversations
import { toast } from "sonner";
import { Agent, Network, Message } from "@/lib/simulation";
import { MESSAGE_TEMPLATES, PERSONA_PHRASES } from "./messaging/messageTemplates";

// Local storage keys
const GEMINI_API_KEY_STORAGE_KEY = "gemini-api-key";
const GEMINI_ENABLED_STORAGE_KEY = "gemini-enabled";

// Initialize API variables
let geminiApiKey: string | null = null;
let isGeminiEnabled: boolean = false;

// Initialize the Gemini API
export function initializeGemini(): void {
  // Load API key from localStorage
  const storedApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
  if (storedApiKey) {
    geminiApiKey = storedApiKey;
    console.log("Gemini API key loaded from storage");
  } else {
    console.log("No Gemini API key found in storage");
  }
  
  // Check if Gemini is enabled
  const storedEnabled = localStorage.getItem(GEMINI_ENABLED_STORAGE_KEY);
  if (storedEnabled) {
    isGeminiEnabled = storedEnabled === 'true';
  }
  
  console.log(`Gemini initialized - enabled: ${isGeminiEnabled}, API key present: ${!!geminiApiKey}`);
}

// Get API key
export function getGeminiApiKey(): string | null {
  // Always check localStorage for the most recent value
  const storedApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
  if (storedApiKey) {
    geminiApiKey = storedApiKey.trim(); // Ensure no whitespace
  }
  return geminiApiKey;
}

// Set API key
export function setGeminiApiKey(apiKey: string): void {
  const trimmedKey = apiKey.trim(); // Remove any whitespace
  geminiApiKey = trimmedKey;
  localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmedKey);
  console.log("Gemini API key saved to storage");
  toast.success("Gemini API key saved");
}

// Set Gemini enabled state
export function setGeminiEnabled(enabled: boolean): void {
  isGeminiEnabled = enabled;
  localStorage.setItem(GEMINI_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  console.log(`Gemini enabled state set to: ${enabled}`);
}

// Get Gemini enabled state
export function getGeminiEnabled(): boolean {
  // Always check localStorage for the most recent value
  const storedEnabled = localStorage.getItem(GEMINI_ENABLED_STORAGE_KEY);
  if (storedEnabled) {
    isGeminiEnabled = storedEnabled === 'true';
  }
  return isGeminiEnabled;
}

// Helper function to describe an agent's personality based on their traits
function describeAgentPersonality(agent: Agent): string {
  const traits = [];
  
  if (agent.traits.openness > 0.7) traits.push("very open to new ideas");
  else if (agent.traits.openness < 0.3) traits.push("conservative and traditional");
  
  if (agent.traits.conscientiousness > 0.7) traits.push("highly organized and detail-oriented");
  else if (agent.traits.conscientiousness < 0.3) traits.push("spontaneous and disorganized");
  
  if (agent.traits.extraversion > 0.7) traits.push("very extraverted and outgoing");
  else if (agent.traits.extraversion < 0.3) traits.push("introverted and reserved");
  
  if (agent.traits.agreeableness > 0.7) traits.push("very agreeable and cooperative");
  else if (agent.traits.agreeableness < 0.3) traits.push("argumentative and critical");
  
  if (agent.traits.neuroticism > 0.7) traits.push("anxious and emotionally reactive");
  else if (agent.traits.neuroticism < 0.3) traits.push("emotionally stable and calm");
  
  return traits.join(", ");
}

// Cache for storing AI-generated messages to minimize API calls
const messageCache = new Map<string, string>();

// Test API key validity
export async function testGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    const trimmedKey = apiKey.trim();
    console.log(`Testing Gemini API key: ${trimmedKey.substring(0, 10)}...`);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${trimmedKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello, test message"
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });
    
    console.log(`API key test response status: ${response.status}`);
    
    if (response.ok) {
      console.log("API key is valid");
      return true;
    } else {
      const errorText = await response.text();
      console.error("API key test failed:", response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error("Error testing API key:", error);
    return false;
  }
}

// Generate a conversation message using the Gemini API
export async function generateMessage(
  agent: Agent,
  network: Network,
  messageType: string,
  recentMessages: Message[],
  lastSpeaker: string = ""
): Promise<string | null> {
  // Get the current API key and enabled state
  const currentApiKey = getGeminiApiKey();
  const currentEnabled = getGeminiEnabled();
  
  console.log(`Generating message - API key present: ${!!currentApiKey}, enabled: ${currentEnabled}`);
  
  if (!currentApiKey || !currentEnabled) {
    console.log("Gemini not available for message generation");
    return null;
  }
  
  // Extract recent conversation context
  const conversationContext = recentMessages
    .slice(-3)
    .map(msg => msg.content)
    .join("\n");
  
  // Build prompt based on message type and context
  let prompt = `You are ${agent.name}, a person who is ${describeAgentPersonality(agent)}. `;
  prompt += `You are in a group chat discussing the topic: "${network.currentTopic}". `;
  
  if (conversationContext) {
    prompt += `Here's the recent conversation:\n${conversationContext}\n\n`;
  }
  
  switch (messageType) {
    case "OPINION":
      prompt += "Share your opinion on this topic based on your personality traits.";
      break;
    case "QUESTION":
      prompt += "Ask a thought-provoking question about this topic.";
      break;
    case "JOKE":
      prompt += "Make a lighthearted joke or humorous observation related to this topic.";
      break;
    case "STORY":
      prompt += "Share a brief personal anecdote or story related to this topic.";
      break;
    case "AGREEMENT":
      if (lastSpeaker) {
        prompt += `Respond to ${lastSpeaker} by agreeing with their point and adding your perspective.`;
      } else {
        prompt += "Express agreement with a general point about the topic.";
      }
      break;
    case "DISAGREEMENT":
      if (lastSpeaker) {
        prompt += `Respond to ${lastSpeaker} by politely disagreeing and explaining your viewpoint.`;
      } else {
        prompt += "Express disagreement with a common view on this topic.";
      }
      break;
    case "OFFTOPIC":
      prompt += "Make a slightly off-topic but related comment about this subject.";
      break;
    default:
      prompt += "Contribute something interesting to the conversation about this topic.";
  }
  
  prompt += "\nKeep your message brief (1-3 sentences). Don't include any prefixes like 'Agent1:' - just the message content.";
  
  try {
    console.log(`Making Gemini API request for Agent #${agent.id} with prompt type: ${messageType}`);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${currentApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 128,
          topP: 0.95
        }
      })
    });
    
    console.log(`Gemini API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 400 || response.status === 401) {
        toast.error("Invalid Gemini API key. Please check your API key in settings.");
      } else {
        toast.error(`Gemini API error: ${response.statusText}`);
      }
      return null;
    }
    
    const data = await response.json();
    console.log("Gemini API response received successfully");
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error("No response candidates from Gemini API");
      return null;
    }
    
    const generatedText = data.candidates[0].content.parts[0].text.trim();
    console.log(`Generated message for Agent #${agent.id}: "${generatedText}"`);
    
    return generatedText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    toast.error("Failed to connect to Gemini API");
    return null;
  }
}

// Helper function to get content from templates (kept for backwards compatibility but not used when Gemini is enabled)
function getTemplateContent(messageType: string, topic: string, lastSpeaker: string = ""): string {
  // Get templates for the selected message type
  let templates;
  let template;
  
  // For persona-specific phrases
  if (["INTELLECTUAL", "CASUAL", "ENTHUSIASTIC", "SKEPTICAL", "SUPPORTIVE"].includes(messageType)) {
    templates = PERSONA_PHRASES[messageType as keyof typeof PERSONA_PHRASES];
    template = templates[Math.floor(Math.random() * templates.length)];
  } else {
    // Normal message templates
    templates = MESSAGE_TEMPLATES[messageType as keyof typeof MESSAGE_TEMPLATES];
    template = templates[Math.floor(Math.random() * templates.length)];
  }
  
  // Generate the content
  return template
    .replace("{topic}", topic)
    .replace("{lastSpeaker}", lastSpeaker);
}
