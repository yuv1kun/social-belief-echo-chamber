
import React from 'react';

// Message templates for more diverse conversation patterns
export const MESSAGE_TEMPLATES = {
  OPINION: [
    "I strongly believe that {topic} is important because...",
    "In my opinion, {topic} has changed significantly over the years.",
    "I think {topic} is overrated. Here's why...",
    "My take on {topic} is quite different from most people.",
    "From my perspective, {topic} is actually beneficial when you consider..."
  ],
  QUESTION: [
    "What do you all think about {topic}? I'm curious.",
    "Has anyone here had personal experience with {topic}?",
    "I'm wondering, does {topic} really make a difference in practice?",
    "Could someone explain why {topic} is so controversial these days?",
    "What would happen if we all embraced {topic} completely?"
  ],
  AGREEMENT: [
    "I completely agree with what @{lastSpeaker} said about {topic}!",
    "That's exactly right @{lastSpeaker}, {topic} is definitely worth considering.",
    "Yes! @{lastSpeaker} makes a good point about {topic}.",
    "@{lastSpeaker} - 100% this. {topic} deserves more attention.",
    "Couldn't have said it better myself, @{lastSpeaker}!"
  ],
  DISAGREEMENT: [
    "I respectfully disagree with @{lastSpeaker}. {topic} isn't that simple.",
    "Actually @{lastSpeaker}, I see {topic} quite differently because...",
    "I'm not convinced that's true about {topic}, @{lastSpeaker}.",
    "That's an interesting perspective @{lastSpeaker}, but I think {topic} is more nuanced.",
    "I see where you're coming from @{lastSpeaker}, but have you considered this about {topic}..."
  ],
  JOKE: [
    "Why did {topic} cross the road? Because it was running from all these hot takes! 😂",
    "They say {topic} is serious business, but I'm just here for the memes 🤣",
    "Plot twist: {topic} was the real social media influencer all along! 😆",
    "My relationship with {topic} is complicated... like my coffee order at Starbucks! ☕️",
    "*Dramatic voice* In a world dominated by {topic}, one person dared to scroll past... 🎬"
  ],
  STORY: [
    "True story: last year I had a fascinating experience with {topic} that changed my view completely...",
    "This reminds me of when I first encountered {topic} in college. It was eye-opening!",
    "My friend actually works with {topic} and the stories they tell are incredible.",
    "I once read a book about {topic} that completely changed my perspective.",
    "Growing up, my family always emphasized {topic}. Now I understand why."
  ],
  OFFTOPIC: [
    "Slightly off-topic, but has anyone seen that new show everyone's talking about?",
    "Speaking of {topic}, did you all hear about that viral news story yesterday?",
    "This conversation is great! Anyone else enjoying these discussions as much as I am?",
    "Random thought: {topic} makes me think about how much society has changed.",
    "Sorry to interrupt the {topic} talk, but I just had the best food delivery arrive! 🍕"
  ]
};

// Diverse reactions and emojis for more human-like messages
export const REACTIONS = [
  "❤️", "👍", "👏", "🙌", "💯", "🔥", "😂", "🤔", "🙄", "😮", "🤦‍♀️", 
  "exactly!", "this.", "100%", "facts", "debatable", "interesting", 
  "wait what?", "mind blown", "I can't even", "same"
];
