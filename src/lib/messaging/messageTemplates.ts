
// Message templates for more diverse conversation patterns
export const MESSAGE_TEMPLATES = {
  OPINION: [
    "I strongly believe that {topic} is important because it impacts how we live our daily lives.",
    "In my opinion, {topic} has changed significantly over the years. It used to be so different!",
    "I think {topic} is overrated. Here's why: it doesn't actually solve the core problems we face.",
    "My take on {topic} is quite different from most people. I see it more as an opportunity than a challenge.",
    "From my perspective, {topic} is actually beneficial when you consider the long-term implications.",
    "Hot take: {topic} isn't what most people think it is. The reality is more complex.",
    "Unpopular opinion maybe, but {topic} deserves more credit than it gets.",
    "After researching {topic} extensively, I've concluded that conventional wisdom about it is wrong."
  ],
  QUESTION: [
    "What do you all think about {topic}? I'm curious about different perspectives.",
    "Has anyone here had personal experience with {topic}? Would love to hear stories!",
    "I'm wondering, does {topic} really make a difference in practice, or is it just theoretical?",
    "Could someone explain why {topic} is so controversial these days? I'm trying to understand.",
    "What would happen if we all embraced {topic} completely? Better or worse world?",
    "Is {topic} worth investing time in? Or is it just a passing trend?",
    "How did you first learn about {topic}? Was it through school, work, or social media?",
    "Serious question: how does {topic} affect your daily decisions?"
  ],
  AGREEMENT: [
    "I completely agree with what @{lastSpeaker} said about {topic}! You nailed it.",
    "That's exactly right @{lastSpeaker}, {topic} is definitely worth considering for the reasons you mentioned.",
    "Yes! @{lastSpeaker} makes a good point about {topic}. I've seen this firsthand too.",
    "@{lastSpeaker} - 100% this. {topic} deserves more attention for exactly those reasons.",
    "Couldn't have said it better myself, @{lastSpeaker}! Your take on {topic} is spot on.",
    "Vibing with @{lastSpeaker}'s thoughts on {topic}. Especially that part about the impact.",
    "Totally with you @{lastSpeaker} - {topic} changed my perspective too when I realized that.",
    "@{lastSpeaker} gets it! This is exactly what I was thinking about {topic} but couldn't articulate."
  ],
  DISAGREEMENT: [
    "I respectfully disagree with @{lastSpeaker}. {topic} isn't that simple from my experience.",
    "Actually @{lastSpeaker}, I see {topic} quite differently because of what happened in my industry.",
    "I'm not convinced that's true about {topic}, @{lastSpeaker}. Have you considered the other side?",
    "That's an interesting perspective @{lastSpeaker}, but I think {topic} is more nuanced than that.",
    "I see where you're coming from @{lastSpeaker}, but have you considered this about {topic}... it changes everything.",
    "Hmm, @{lastSpeaker} I have to push back on that. {topic} has worked differently in my experience.",
    "With all due respect @{lastSpeaker}, the research on {topic} actually suggests otherwise.",
    "I hear you @{lastSpeaker}, but I've found {topic} to be the opposite in practice. Let me explain..."
  ],
  JOKE: [
    "Why did {topic} cross the road? Because it was running from all these hot takes! 😂",
    "They say {topic} is serious business, but I'm just here for the memes 🤣",
    "Plot twist: {topic} was the real social media influencer all along! 😆",
    "My relationship with {topic} is complicated... like my coffee order at Starbucks! ☕️",
    "*Dramatic voice* In a world dominated by {topic}, one person dared to scroll past... 🎬",
    "If {topic} was a person, it would definitely be that friend who never replies to group chats 📱",
    "{topic} is like pizza - even when it's bad, it's still pretty good! 🍕",
    "My therapist said I need to stop talking about {topic} so much, but here we are again 💁‍♀️"
  ],
  STORY: [
    "True story: last year I had a fascinating experience with {topic} that changed my view completely...",
    "This reminds me of when I first encountered {topic} in college. It was eye-opening because no one had prepared me for it.",
    "My friend actually works with {topic} and the stories they tell are incredible. Just last week they told me...",
    "I once read a book about {topic} that completely changed my perspective. It argued that we've been thinking about it all wrong.",
    "Growing up, my family always emphasized {topic}. Now I understand why - it shaped so much of my worldview.",
    "So last weekend I was dealing with {topic} and let me tell you, it did NOT go as expected...",
    "Back in 2019, before everything changed, I was heavily involved with {topic}. Those were simpler times.",
    "The first time I experienced {topic} was on a trip abroad. It's fascinating how different cultures approach it."
  ],
  OFFTOPIC: [
    "Slightly off-topic, but has anyone seen that new show everyone's talking about?",
    "Speaking of {topic}, did you all hear about that viral news story yesterday? My timeline was full of it.",
    "This conversation is great! Anyone else enjoying these discussions as much as I am?",
    "Random thought: {topic} makes me think about how much society has changed since we were kids.",
    "Sorry to interrupt the {topic} talk, but I just had the best food delivery arrive! 🍕",
    "Not to change the subject from {topic}, but did anyone catch the game last night?",
    "My cat just walked across my keyboard while I was reading about {topic}. She has opinions too! 🐱",
    "I should be working right now instead of discussing {topic}, but this is way more interesting!"
  ]
};

// Diverse reactions and emojis for more human-like messages
export const REACTIONS = [
  "❤️", "👍", "👏", "🙌", "💯", "🔥", "😂", "🤔", "🙄", "😮", "🤦‍♀️", 
  "exactly!", "this.", "100%", "facts", "debatable", "interesting", 
  "wait what?", "mind blown", "I can't even", "same", "lol", "nailed it",
  "truth", "big mood", "vibes", "totally", "yessss", "no way", "omg",
  "hot take", "fair point", "^^ this", "spot on", "ikr?", "brilliant",
  "👀", "✨", "💪", "🙏", "🤯", "🧠", "✅", "💭", "⭐", "☝️", "🤝"
];

// Add persona-specific phrase templates for more realistic conversations
export const PERSONA_PHRASES = {
  INTELLECTUAL: [
    "From a theoretical perspective...",
    "Research suggests that...",
    "When analyzing {topic} critically...",
    "The philosophical implications of {topic} are vast..."
  ],
  CASUAL: [
    "Yo, so about {topic}...",
    "Not gonna lie, {topic} is kinda...",
    "TBH {topic} just makes me think...",
    "Soooo... {topic}, am I right?"
  ],
  ENTHUSIASTIC: [
    "OMG {topic} is literally THE BEST!!",
    "I'm OBSESSED with everything about {topic}!!!",
    "Can we just appreciate {topic} for a sec?? AMAZING!",
    "{topic} CHANGED MY LIFE and I'm not even exaggerating!"
  ],
  SKEPTICAL: [
    "I'm not convinced {topic} is all it's cracked up to be...",
    "Does anyone else question the hype around {topic}?",
    "Call me cynical, but {topic} seems overblown...",
    "I need more evidence before I buy into {topic}..."
  ],
  SUPPORTIVE: [
    "Whatever your thoughts on {topic}, your perspective matters!",
    "I appreciate everyone sharing their thoughts on {topic}.",
    "This is such a thoughtful discussion about {topic}!",
    "You all make such good points about {topic}!"
  ]
};
