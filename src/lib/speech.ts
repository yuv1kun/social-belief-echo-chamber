
/**
 * Browser native speech synthesis utility
 */

// Map of voices by gender for realistic TTS
let maleVoice: SpeechSynthesisVoice | null = null;
let femaleVoice: SpeechSynthesisVoice | null = null;
let defaultVoice: SpeechSynthesisVoice | null = null;

// Queue for managing speech in sequence
type SpeechQueueItem = {
  text: string;
  gender?: 'male' | 'female';
  onStart?: () => void;
  onEnd?: () => void;
};

let speechQueue: SpeechQueueItem[] = [];
let isSpeaking = false;

// Initialize voices when they become available
export const initializeVoices = (): void => {
  // Check if speech synthesis is supported
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  // Function to find and set appropriate voices by gender
  const setVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;

    // Try to find English voices first
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en-')
    );
    
    const availableVoices = englishVoices.length > 0 ? englishVoices : voices;
    
    // Set default voice
    defaultVoice = availableVoices[0];
    
    // Find male and female voices by description (many browsers label them)
    maleVoice = availableVoices.find(voice => 
      voice.name.toLowerCase().includes('male') || 
      voice.name.includes('Daniel') || 
      voice.name.includes('David') || 
      voice.name.includes('Thomas')
    ) || defaultVoice;
    
    femaleVoice = availableVoices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.includes('Samantha') || 
      voice.name.includes('Karen') || 
      voice.name.includes('Victoria')
    ) || defaultVoice;
    
    console.log('Speech voices initialized:', { 
      default: defaultVoice?.name,
      male: maleVoice?.name, 
      female: femaleVoice?.name, 
      available: availableVoices.map(v => v.name)
    });
  };

  // Set voices if already available or wait for the voiceschanged event
  if (window.speechSynthesis.getVoices().length > 0) {
    setVoices();
  }
  
  window.speechSynthesis.onvoiceschanged = setVoices;
};

// Process the speech queue
const processSpeechQueue = (): void => {
  if (speechQueue.length === 0 || isSpeaking) return;
  
  isSpeaking = true;
  const item = speechQueue[0];
  
  speak(item.text, item.gender, item.onStart, () => {
    // Remove spoken item from queue
    speechQueue.shift();
    isSpeaking = false;
    
    if (item.onEnd) item.onEnd();
    
    // Process next item if available
    processSpeechQueue();
  });
};

// Direct speech function (used by queue processor)
const speak = (
  text: string, 
  gender?: 'male' | 'female',
  onStart?: () => void,
  onEnd?: () => void
): void => {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported');
    if (onEnd) onEnd();
    return;
  }
  
  // Clean up text for speech
  // Remove agent prefix and parenthetical thoughts
  let cleanText = text
    .replace(/^.*?:\s+/, '')  // Remove "Agent Name: " prefix
    .replace(/\(.*?\)/g, ''); // Remove (parenthetical thoughts)
  
  // Create utterance
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Set voice based on gender
  if (gender === 'male') {
    utterance.voice = maleVoice;
  } else if (gender === 'female') {
    utterance.voice = femaleVoice;
  } else {
    utterance.voice = defaultVoice;
  }
  
  // Set speech properties
  utterance.rate = 1.1;  // Slightly faster than default
  utterance.pitch = gender === 'female' ? 1.1 : 0.9;
  
  // Set event handlers
  utterance.onstart = () => {
    if (onStart) onStart();
  };
  
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    if (onEnd) onEnd();
  };
  
  // Start speaking
  window.speechSynthesis.speak(utterance);
};

// Queue a speech item (public API)
export const queueSpeech = (
  text: string, 
  gender?: 'male' | 'female',
  onStart?: () => void,
  onEnd?: () => void
): void => {
  speechQueue.push({ text, gender, onStart, onEnd });
  processSpeechQueue();
};

// Cancel all speech
export const cancelSpeech = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  speechQueue = [];
  isSpeaking = false;
};
