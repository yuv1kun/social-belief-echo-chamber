/**
 * Simulation utility for social belief echo chamber
 * Handles agent creation, network generation, and belief propagation
 */

import { toast } from "sonner";

export type BigFiveTraits = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type Gender = "male" | "female";

export type Message = {
  id: string;
  senderId: number;
  receiverId: number | null; // null for broadcast messages
  timestamp: number;
  content: string;
  belief: boolean; // The belief state when the message was sent
  topic?: string; // The topic of discussion
  replyToId?: string; // ID of the message being replied to
};

export type Agent = {
  id: number;
  name: string;
  gender: Gender;
  traits: BigFiveTraits;
  believer: boolean;
  neighbors: number[];
  beliefHistory: boolean[];
  susceptibility?: number; // Calculated value based on traits
  thoughtState?: string; // Internal thought about current belief
  messages: Message[]; // Messages sent by this agent
  receivedMessages: Message[]; // Messages received by this agent
  currentTopic?: string; // Current topic the agent is discussing
  traitHistory?: BigFiveTraits[]; // History of trait changes over time
  messageContextMemory?: Message[]; // Keep track of recent messages for context
};

export type Network = {
  nodes: Agent[];
  links: { source: number; target: number }[];
  messageLog: Message[];
  currentTopic: string; // Changed from optional to required
};

export type SimulationConfig = {
  agentCount: number;
  initialBelieverPercentage: number;
  networkDensity: number;
  networkType: "random" | "scale-free" | "small-world";
  steps: number;
  currentStep: number;
};

// Adding the missing indianNames variable
export const indianNames = {
  male: [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", 
    "Reyansh", "Ayaan", "Atharva", "Ishaan", "Shaurya", 
    "Advik", "Rudra", "Kabir", "Dhruv", "Krishna", 
    "Krish", "Darsh", "Veer", "Aayan", "Yuvan"
  ],
  female: [
    "Aanya", "Aadhya", "Aaradhya", "Saanvi", "Myra", 
    "Ananya", "Pari", "Siya", "Diya", "Pihu", 
    "Sara", "Tara", "Aarna", "Riya", "Drishti", 
    "Kiara", "Navya", "Avni", "Neha", "Vanya"
  ]
};

// List of real-world topics for agents to discuss
export const discussionTopics = [
  "Climate change and its effects",
  "Vegetarianism vs. non-vegetarian diets",
  "Effectiveness of online education",
  "Cricket World Cup predictions",
  "Should mobile phones be allowed in schools?",
  "Benefits of yoga and meditation",
  "Bollywood vs. Hollywood movies",
  "Public transportation in Indian cities",
  "Traditional medicine vs. modern medicine",
  "Work from home vs. office work",
  "Social media's impact on society",
  "Arranged marriages in modern India",
  "Importance of learning multiple languages",
  "Indian street food safety",
  "Electric vehicles in India",
  "Future of artificial intelligence",
  "Online shopping vs. local markets",
  "Indian classical music popularity among youth",
  "Water conservation methods",
  "Traditional festivals in modern times"
];

// Personality-based communication styles for more diverse messages
const communicationStyles = {
  humorous: {
    intros: [
      "LOL! ", 
      "Guys, I can't even 😂 ", 
      "This is gonna sound ridiculous but ", 
      "No joke, ", 
      "Wait wait wait, haha, "
    ],
    replies: [
      "Haha, @{name}, that's hilarious! Actually though, ",
      "@{name} I'm dying 😂 But seriously, ",
      "Okay @{name}, I see what you did there. But listen, ",
      "LMAO @{name} just made my day! Though I think ",
      "@{name} always brings the jokes! Speaking of {topic} though, "
    ],
    templates: [
      "Is it just me, or is {topic} basically the {random_comparison}? 😂",
      "My grandma has stronger opinions about {topic} than all of us combined!",
      "Plot twist: {topic} was invented by people who just wanted more Instagram content.",
      "I showed my cat an article about {topic} and even she rolled her eyes.",
      "If {topic} was a person, it would definitely be that friend who never splits the bill fairly."
    ],
    disagreements: [
      "@{name} Wait wait wait... you actually believe that? Let me get this straight...",
      "Umm @{name}, no offense but that's the funniest take on {topic} I've heard all day 😂",
      "I love you @{name}, but that's just so wrong it's actually funny 🤣",
      "Okay I can't be the only one who thinks @{name}'s take is completely wild, right?",
      "@{name} I'm gonna pretend I didn't hear that absolutely ridiculous opinion 😅"
    ],
    agreements: [
      "THIS! @{name} gets it! I've been saying the same thing about {topic} forever!",
      "Haha @{name} you took the words right out of my mouth, but you said it funnier",
      "@{name} high-five for being the only other sane person in this chat 😂",
      "Exactly @{name}! Finally someone who doesn't have bizarre opinions about {topic} 🙌",
      "@{name} 👆 This person understands! Listen to them people!"
    ],
    endings: [
      " 🤣🤣🤣",
      " I'll see myself out now.",
      " Don't @ me!",
      " *drops mic*",
      " This is why I shouldn't be allowed on the internet after midnight."
    ]
  },
  intellectual: {
    intros: [
      "I've been reflecting on ", 
      "Studies suggest that ", 
      "Interestingly, ", 
      "From an analytical perspective, ", 
      "If we examine "
    ],
    replies: [
      "I appreciate your thoughts @{name}, though I would add that ",
      "Building on what @{name} said, we should also consider ",
      "@{name} raises valid points, however the research also indicates ",
      "I find @{name}'s perspective fascinating. In addition, ",
      "While @{name} is correct in many ways, it's worth noting that "
    ],
    templates: [
      "There are multiple facets to consider regarding {topic}, particularly from a sociocultural lens.",
      "The discourse surrounding {topic} often neglects historical context and systemic factors.",
      "When we analyze {topic} through comparative frameworks, we see fascinating patterns emerge.",
      "The literature on {topic} presents compelling arguments both for and against mainstream positions.",
      "{topic} represents a complex intersection of policy, culture, and individual choice worthy of nuanced discussion."
    ],
    disagreements: [
      "@{name} While I respect your viewpoint, the evidence suggests a different conclusion about {topic}.",
      "I must respectfully challenge @{name}'s assertion, as current research indicates that...",
      "@{name} That's an interesting perspective, though I believe it overlooks several critical factors.",
      "I appreciate @{name}'s contribution, but there are important counterpoints we should examine.",
      "What @{name} suggests is thought-provoking, however the empirical data points toward..."
    ],
    agreements: [
      "@{name} has articulated exactly what the research demonstrates about {topic}.",
      "I concur with @{name}'s analysis and would further add that...",
      "@{name} makes an excellent point that aligns with the scholarly consensus on this issue.",
      "As @{name} correctly noted, the evidence strongly supports this perspective on {topic}.",
      "@{name}'s reasoning is sound and consistent with the findings of several recent studies."
    ],
    endings: [
      " What do you think of this analysis?",
      " I'd be curious to hear other perspectives.",
      " The research in this area continues to evolve.",
      " This is just one framework to consider, of course.",
      " I've been reading extensively about this lately."
    ]
  },
  skeptical: {
    intros: [
      "I'm not buying that ", 
      "Am I the only one who thinks ", 
      "Let's be real though, ", 
      "Call me skeptical, but ", 
      "I need receipts on "
    ],
    replies: [
      "Sorry @{name} but I'm going to need some actual evidence for that claim about {topic}.",
      "@{name} That's exactly what they want you to think. The reality is ",
      "I hear what @{name} is saying, but honestly? I'm not convinced because ",
      "@{name} Where did you get that information? Because my research shows ",
      "With all due respect to @{name}, I've looked into this and found "
    ],
    templates: [
      "Everyone's talking about {topic} like it's revolutionary, but where's the actual evidence?",
      "I've yet to see convincing proof that {topic} is anything but overblown hype.",
      "My brother-in-law works in this field and says most of what we hear about {topic} is massively exaggerated.",
      "I've been researching {topic} for weeks and honestly, the data doesn't support these wild claims.",
      "I was initially on board with all this {topic} talk until I actually fact-checked it."
    ],
    disagreements: [
      "@{name} I've heard that argument before, but it falls apart when you look at the actual facts.",
      "Yeah, @{name} that's what mainstream sources say, but if you dig deeper you'll find...",
      "@{name} I used to believe that too until I did my own research on {topic}.",
      "Sorry @{name}, but that's just not accurate. The real story about {topic} is...",
      "I have to challenge what @{name} is saying here. If you follow the money on this {topic} issue..."
    ],
    agreements: [
      "Finally! @{name} is the only one here speaking sense about {topic}.",
      "Exactly @{name}, I've been saying this all along but nobody listens.",
      "@{name} gets it. Most people aren't ready for the truth about {topic}.",
      "This is why I respect @{name} - not afraid to question the popular narrative on {topic}.",
      "@{name} is right to be cautious. There's so much misinformation about {topic} going around."
    ],
    endings: [
      " Just saying what everyone's afraid to say.",
      " Anyone else feel this way?",
      " Show me the data or I'm not convinced.",
      " Maybe I'm wrong, but I doubt it.",
      " Sorry not sorry."
    ]
  },
  enthusiastic: {
    intros: [
      "OMG GUYS!!! ", 
      "I'm OBSESSED with ", 
      "You won't believe how amazing ", 
      "I've literally never been more excited about ", 
      "STOP EVERYTHING and let's talk about "
    ],
    replies: [
      "YES @{name}!!! I couldn't agree more! And also did you know that ",
      "Omg @{name} you just reminded me about this AMAZING thing about {topic} - ",
      "@{name} EXACTLY!!! And it gets even better because ",
      "I'm freaking out @{name} because that's EXACTLY what I was thinking about {topic}!",
      "@{name} YES YES YES!!! And we should also talk about how "
    ],
    templates: [
      "{topic} is literally THE MOST important thing we should all be focused on right now!!!",
      "I just found this INCREDIBLE article about {topic} and it's changed my entire perspective!!!",
      "My life completely transformed once I started taking {topic} seriously! Best decision ever!",
      "I've been telling EVERYONE about {topic} and you should too! It's a game-changer!",
      "{topic} is not just important, it's REVOLUTIONARY and we need to spread the word!"
    ],
    disagreements: [
      "@{name} WHAT?! No way! That's so not true about {topic}! Actually...",
      "I have to disagree STRONGLY with @{name}! The truth about {topic} is so much more exciting!",
      "Ohhh @{name} I used to think that too but then I discovered this MIND-BLOWING fact about {topic}:",
      "@{name} I respect you but I'm PASSIONATE about this and your take on {topic} is missing some KEY points!",
      "Nooo @{name}! You've got it all wrong about {topic}! Let me explain why it's actually AMAZING:"
    ],
    agreements: [
      "YESSSS @{name}!!! THIS! ALL OF THIS! {topic} is literally everything you just said!!",
      "@{name} I'M SO GLAD SOMEONE FINALLY SAID IT!! {topic} deserves ALL this enthusiasm!",
      "I'M SCREAMING @{name} because you just perfectly explained why {topic} is so incredible!!",
      "@{name} is speaking nothing but FACTS about {topic}! I couldn't have said it better!!",
      "THIS THIS THIS @{name}!! You're 100% right about {topic} and I'm here for it!!"
    ],
    endings: [
      " WHO'S WITH ME?! 🙌",
      " Like if you agree!!! ❤️",
      " Can't believe more people aren't talking about this!",
      " Changed. My. Life. Period.",
      " #obsessed #lifechanging"
    ]
  },
  casual: {
    intros: [
      "So... ", 
      "Hey y'all, ", 
      "Random thought, but ", 
      "Was just thinking, ", 
      "Not to change the subject, but "
    ],
    replies: [
      "Yeah @{name}, I get what you're saying. I was thinking about that and ",
      "Hmm @{name} that's interesting. I was chatting with my friend about {topic} and ",
      "@{name} good point. I also noticed that ",
      "That reminds me @{name}, I saw something similar about {topic} where ",
      "True @{name}. Also did anyone else see that thing about {topic} where "
    ],
    templates: [
      "Anyone else been following that stuff about {topic}? My cousin was telling me about it.",
      "I saw something on Instagram about {topic} yesterday. Kinda interesting I guess.",
      "My friend and I were talking about {topic} over coffee. Still not sure what to think.",
      "Been seeing {topic} everywhere lately. Is it actually a big deal or just trending?",
      "So what's the deal with {topic} anyway? I feel like I'm missing something."
    ],
    disagreements: [
      "Idk @{name}, I heard different things about {topic} actually...",
      "@{name} that's one way to look at it I guess, but I think {topic} is more about...",
      "Not sure if I agree with @{name} tbh. From what I've seen about {topic}...",
      "Hmm @{name}, my cousin works in that field and says {topic} is actually more like...",
      "@{name} interesting... but didn't they just find out that {topic} is actually...?"
    ],
    agreements: [
      "Yeah @{name} that's what I heard about {topic} too.",
      "Same @{name}, my thoughts exactly about this whole {topic} thing.",
      "@{name} makes a good point about {topic}. I was telling my roommate the same thing.",
      "That's what I was thinking too @{name}. {topic} is basically just like you said.",
      "@{name} yeah, exactly. That's pretty much what I understand about {topic} too."
    ],
    endings: [
      " Anyway, just curious.",
      " No strong opinions yet tbh.",
      " What do you guys think?",
      " Maybe it's just my algorithm though.",
      " Sorry if that was off-topic lol."
    ]
  },
  contrarian: {
    intros: [
      "Unpopular opinion: ", 
      "Everyone's going to disagree, but ", 
      "I know I'll get flamed for this, but ", 
      "Going against the grain here - ", 
      "Hot take incoming: "
    ],
    replies: [
      "See, this is exactly where @{name} and most people get {topic} completely wrong.",
      "Unlike what @{name} thinks, the reality about {topic} is actually the opposite.",
      "That's the conventional wisdom @{name}, but if you think more deeply about {topic}...",
      "@{name} represents the mainstream view, but the contrarian truth about {topic} is...",
      "While everyone agrees with @{name}, I'm going to argue that {topic} is actually..."
    ],
    templates: [
      "Actually, {topic} is the exact opposite of what most people think, and here's why.",
      "Everyone's approaching {topic} completely backwards. The conventional wisdom is dead wrong.",
      "I've held the minority view on {topic} for years, and I'm finally being proven right.",
      "If you think {topic} is straightforward, you're missing the counterintuitive reality.",
      "The mainstream narrative about {topic} completely misses the point, which is actually [contrarian point]."
    ],
    disagreements: [
      "@{name} That's such a predictable take. The more interesting angle on {topic} is...",
      "Unlike @{name} and the sheep, I've actually thought critically about {topic} and realized...",
      "This is why discussions on {topic} get nowhere - @{name} just repeats what everyone says.",
      "@{name} is just following the crowd on this one. The truth about {topic} that nobody wants to admit is...",
      "While @{name} takes the safe position, I'll say what needs to be said: {topic} is actually..."
    ],
    agreements: [
      "Wow, @{name} is actually one of the few people who gets it about {topic}. I'm impressed.",
      "@{name} Finally someone else willing to challenge the status quo on {topic}!",
      "Exactly @{name}. You and I see what everyone else misses about {topic}.",
      "@{name} I rarely agree with anyone on {topic}, but you've nailed it.",
      "I thought I was the only one who saw through the nonsense about {topic}, but @{name} gets it too."
    ],
    endings: [
      " Debate me.",
      " You can disagree, but history will prove me right.",
      " Downvote me if you want, I stand by this.",
      " Facts don't care about consensus.",
      " Just pointing out what nobody wants to admit."
    ]
  },
  supportive: {
    intros: [
      "I just want to say ", 
      "Guys, I appreciate ", 
      "I love how we're all ", 
      "It makes me happy that ", 
      "This is such a safe space to "
    ],
    replies: [
      "@{name} thank you so much for sharing that perspective on {topic}! I also feel that ",
      "What @{name} said about {topic} resonates with me so much. I'd add that ",
      "I really value @{name}'s thoughts here. My experience with {topic} has been ",
      "@{name} brings up such important points about {topic}. It reminds me of ",
      "I so appreciate @{name}'s vulnerability in sharing about {topic}. My thoughts are "
    ],
    templates: [
      "It's so important we can all respectfully discuss {topic} even when we have different views! ❤️",
      "Everyone's perspective on {topic} is valid and I'm learning so much from all of you.",
      "What I love about this group is how we can share thoughts on {topic} without judgment.",
      "However you feel about {topic}, I support your journey and appreciate your sharing.",
      "{topic} affects us all differently, and that's what makes this conversation so valuable."
    ],
    disagreements: [
      "I see where @{name} is coming from about {topic}, and while I have a different perspective...",
      "While I understand @{name}'s view on {topic}, my experience has shown me that...",
      "@{name} makes good points, though I've found that {topic} can also be viewed as...",
      "I respect @{name}'s thoughts on this! My own journey with {topic} has led me to believe...",
      "Everyone's experience is valid - @{name} sees {topic} one way, and I've found that..."
    ],
    agreements: [
      "@{name} YES! Thank you for expressing that so beautifully about {topic} 💕",
      "I completely agree with @{name} and appreciate you sharing those thoughts on {topic}.",
      "@{name} has expressed exactly what I believe about {topic}, but never could put into words.",
      "This is why I value @{name}'s perspective so much - such wisdom about {topic}!",
      "Standing with @{name} on this. These insights about {topic} are so important."
    ],
    endings: [
      " Thank you all for being so open!",
      " Group hug! 🤗",
      " I'm here if anyone wants to talk more.",
      " You're all amazing people.",
      " Sending positive vibes to everyone!"
    ]
  },
  storyteller: {
    intros: [
      "So there I was, ", 
      "This reminds me of the time ", 
      "You won't believe what happened when ", 
      "Funny story related to this - ", 
      "This takes me back to when "
    ],
    replies: [
      "What @{name} just said about {topic} reminds me of this crazy story...",
      "@{name}'s experience with {topic} is so similar to what happened to me last year when...",
      "Listening to @{name} talk about {topic} brings back this memory from my childhood when...",
      "That's so interesting @{name}! It's like what happened to my uncle who...",
      "@{name}'s point about {topic} is spot on. It reminds me of this situation where..."
    ],
    templates: [
      "I was talking to my uncle about {topic} at a wedding last month, and he told me this crazy story about...",
      "Last year, I had a firsthand experience with {topic} that completely changed my perspective. It all started when...",
      "My grandmother always had strong opinions about {topic}. She used to tell us how back in her day...",
      "I actually witnessed the effects of {topic} during my trip to Jaipur. We were at this local market when suddenly...",
      "My college roommate was an expert on {topic} and once demonstrated why it matters by showing me..."
    ],
    disagreements: [
      "That's interesting @{name}, but it reminds me of a very different experience I had with {topic} where...",
      "I respect @{name}'s perspective, though my own story with {topic} took a different turn when...",
      "What @{name} describes isn't what I've seen. Let me tell you what actually happened when I encountered {topic}...",
      "@{name}'s take makes me think of my cousin's experience, which was completely opposite because...",
      "I hear what @{name} is saying, but my grandfather always told this story about {topic} that shows..."
    ],
    agreements: [
      "Yes! What @{name} said about {topic} is exactly like what happened to me when...",
      "@{name}'s experience mirrors my own story perfectly! I remember when...",
      "That's so true @{name}! It's like that time I was dealing with {topic} and...",
      "Exactly what @{name} said! It reminds me of this incredible moment when...",
      "@{name} you took the words right out of my mouth. This one time with {topic}..."
    ],
    endings: [
      " And that's why I never look at {topic} the same way again.",
      " Long story short, I learned my lesson!",
      " True story, I swear!",
      " I still think about that whenever this topic comes up.",
      " Sorry for the tangent, but I thought it was relevant!"
    ]
  },
  reactionary: {
    intros: [
      "Wait WHAT?! ", 
      "I can't believe nobody's mentioned ", 
      "How is everyone ignoring ", 
      "Are we seriously not talking about ", 
      "Excuse me, but "
    ],
    replies: [
      "Hold up @{name} - are you serious about what you just said regarding {topic}?!",
      "@{name} did you see the BREAKING news about what you just mentioned?!",
      "I can't believe @{name} brought this up - have you all seen the latest about {topic}?!",
      "Whoa @{name} - your point about {topic} just reminded me of that shocking update from yesterday!",
      "@{name} mentioned {topic} and nobody's reacting to the HUGE news about this?!"
    ],
    templates: [
      "Did you all see that breaking news about {topic}? This changes EVERYTHING we've been discussing!",
      "I'm shocked that nobody's addressing the recent developments in {topic}! Have you all seen this?",
      "Am I the only one who got that notification about {topic} just now? This is huge!",
      "Sorry to interrupt but there's new information about {topic} that completely contradicts what we thought!",
      "Hold up - the latest update on {topic} just dropped and it proves my point entirely!"
    ],
    disagreements: [
      "@{name} WHAT?! That is SO outdated information about {topic}! The latest reports show...",
      "I CANNOT believe @{name} just said that about {topic} when we LITERALLY just found out that...",
      "Ummm @{name}? Did you miss the BOMBSHELL news about {topic} that completely disproves that?",
      "@{name} that might have been true YESTERDAY but have you seen what just came out about {topic}??",
      "Is @{name} seriously ignoring the MASSIVE revelation about {topic} from this morning?!"
    ],
    agreements: [
      "YES! Finally @{name} is addressing what I've been SCREAMING about {topic}!!",
      "@{name} EXACTLY! I was about to post that SAME breaking news about {topic}!!",
      "THANK YOU @{name}!! I thought I was the only one who saw that update about {topic}!!",
      "THIS!! @{name} is the only one paying attention to what's ACTUALLY happening with {topic}!",
      "@{name} gets it! That news alert about {topic} changed EVERYTHING!"
    ],
    endings: [
      " Check your news feeds people!",
      " This is kind of a big deal???",
      " How are y'all so calm about this?",
      " This conversation aged poorly REAL quick!",
      " *sends link* READ THIS NOW!"
    ]
  }
};

// Random comparisons for humor
const randomComparisons = [
  "trying to teach your grandparents to use TikTok",
  "a pizza with pineapple - controversial but secretly loved",
  "that one relative who forwards every WhatsApp message",
  "trying to find matching socks in the morning",
  "explaining memes to your parents",
  "auto-correct fails in professional emails",
  "trying to take a nice photo of your pet",
  "that friend who's always 40 minutes late",
  "a buffet with only healthy options - disappointing",
  "replying 'ok' to a long message"
];

// Topic-specific response templates for more diverse conversations
// These add variety by having different takes based on the actual topic
const topicSpecificTemplates = {
  "Climate change and its effects": {
    believer: [
      "I was at the beach last summer and the water level was definitely higher. Climate change is real.",
      "My plants are blooming at weird times now. Anyone else notice seasons getting all mixed up?",
      "Can't believe we're still debating climate change in 2025. My AC bills are proof enough!",
      "My cousin in Kerala said the monsoons are completely unpredictable now compared to 10 years ago.",
      "Just invested in solar panels for my house. Might as well adapt while we can."
    ],
    skeptic: [
      "It was literally freezing yesterday. Some 'global warming' we're having lol.",
      "My grandfather says the weather has always been unpredictable. Nothing new.",
      "These climate models keep changing their predictions. Make up your minds already!",
      "I'm all for clean energy but these climate alarmists are just fearmongering.",
      "Natural climate cycles have been happening for millions of years. This is nothing special."
    ]
  },
  "Social media's impact on society": {
    believer: [
      "Notice how nobody makes eye contact on the Metro anymore? Everyone's just scrolling.",
      "My screen time report last week was horrifying. We're all addicted and it's not healthy.",
      "My cousin's 7-year-old has an Instagram already. I didn't even have a PHONE at that age.",
      "Social media is literally rewiring our brains. I feel my attention span shrinking daily.",
      "Started a digital detox last month. Best decision ever for my mental health."
    ],
    skeptic: [
      "People blamed novels, then TV, now social media. Same moral panic, different decade.",
      "Social media helped me find my community when I moved cities. It's not all bad.",
      "My grandmother learns recipes on YouTube and talks to us on WhatsApp. It's enriched her life.",
      "Social media literally enabled major social movements. It's a powerful democratizing force.",
      "We're not 'addicted' - we're adapting to new communication tools like humans always have."
    ]
  },
  "Traditional medicine vs. modern medicine": {
    believer: [
      "My grandmother's turmeric remedy for colds works better than any medicine I've tried.",
      "Traditional medicine treats the whole person, not just symptoms like Western medicine does.",
      "These practices survived thousands of years for a reason. They clearly work.",
      "I was skeptical until my chronic pain was cured by acupuncture after years of pills failing.",
      "Ayurveda helped balance my body in ways my doctor couldn't explain or achieve."
    ],
    skeptic: [
      "Show me the peer-reviewed studies on your grandmother's turmeric remedy...",
      "Traditional medicine is fine for minor issues, but I want antibiotics when I'm really sick.",
      "People romanticize traditional medicine while forgetting modern medicine doubled our lifespans.",
      "The 'natural' argument makes no sense. Arsenic is natural too, doesn't mean it's good for you.",
      "If traditional medicine worked consistently, it would just be called 'medicine'."
    ]
  },
  "generic": {
    believer: [
      "I've done extensive research on this topic and the evidence is clear.",
      "Once you understand the underlying mechanisms, it's obvious why this matters.",
      "This has affected my life personally, so I know firsthand how significant it is.",
      "The data speaks for itself - this is something we need to take seriously.",
      "I was skeptical at first too, but after looking into it, I'm convinced."
    ],
    skeptic: [
      "Everyone's jumping on this bandwagon without questioning the basic assumptions.",
      "I need to see more evidence before I buy into what everyone's claiming.",
      "This feels like the same hysteria we saw with [previous trend] all over again.",
      "Let's take a step back and look at this critically before making judgments.",
      "I've heard these claims before and they rarely hold up to scrutiny."
    ]
  }
};

// Select a random topic from the list
export const getRandomTopic = (): string => {
  const index = Math.floor(Math.random() * discussionTopics.length);
  return discussionTopics[index];
};

// Find a conversation starter for the given topic
const getConversationStarter = (topic: string): string => {
  const topicKey = topic as keyof typeof conversationStarters;
  
  if (conversationStarters[topicKey]) {
    const starters = conversationStarters[topicKey];
    return starters[Math.floor(Math.random() * starters.length)];
  } else {
    const genericStarters = conversationStarters.generic;
    let starter = genericStarters[Math.floor(Math.random() * genericStarters.length)];
    return starter.replace("this topic", topic).replace("this", topic);
  }
};

/**
 * Generate a random Indian name based on gender
 * @param gender The gender to generate a name for
 * @returns A random Indian name
 */
export const generateRandomIndianName = (gender: Gender): string => {
  const nameList = indianNames[gender];
  return nameList[Math.floor(Math.random() * nameList.length)];
};

/**
 * Generate random Big Five personality traits
 * @returns Object containing the Big Five traits with values between 0 and 1
 */
export const generateRandomTraits = (): BigFiveTraits => ({
  openness: Math.random(),
  conscientiousness: Math.random(),
  extraversion: Math.random(),
  agreeableness: Math.random(),
  neuroticism: Math.random(),
});

/**
 * Calculate agent's susceptibility to influence based on their traits
 * @param traits Agent's Big Five traits
 * @returns Susceptibility score between 0 and 1
 */
export const calculateSusceptibility = (traits: BigFiveTraits): number => {
  return (
    0.4 * traits.agreeableness +
    0.3 * traits.neuroticism +
    0.2 * traits.openness -
    0.3 * traits.conscientiousness +
    0.1 * traits.extraversion +
    0.3 // Base susceptibility
  );
};

/**
 * Generate a thought state for an agent based on their personality and belief
 * @param agent The agent to generate a thought for
 * @returns A string representing the agent's internal thought
 */
export const generateThought = (agent: Agent): string => {
  const { traits, believer, currentTopic } = agent;
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = traits;

  // Topic-specific thoughts
  if (currentTopic) {
    if (believer) {
      const topicThoughts = [
        `I think this ${currentTopic} discussion is really important.`,
        `Everyone should be talking about ${currentTopic} more.`,
        `I'm glad we're discussing ${currentTopic}, it matters a lot.`,
        `I have strong opinions about ${currentTopic}.`,
        `I've read a lot about ${currentTopic} recently.`
      ];
      return topicThoughts[Math.floor(Math.random() * topicThoughts.length)];
    } else {
      const topicThoughts = [
        `I'm not sure what to think about ${currentTopic} yet.`,
        `People seem to overreact about ${currentTopic}.`,
        `I need more information before forming an opinion on ${currentTopic}.`,
        `I'm skeptical about what people are saying regarding ${currentTopic}.`,
        `I wonder if ${currentTopic} is really as important as people think.`
      ];
      return topicThoughts[Math.floor(Math.random() * topicThoughts.length)];
    }
  }

  // Fall back to general thoughts if no topic
  const thoughts = {
    believer: [
      "This belief makes so much sense to me.",
      "I'm convinced this is correct.",
      "The evidence for this is compelling.",
      "I'm certain this is the right position.",
      "This position aligns with my values."
    ],
    nonBeliever: [
      "I'm not convinced by this belief.",
      "I need more evidence before accepting this.",
      "This doesn't seem right to me.",
      "I'm skeptical about this claim.",
      "I don't think this position is correct."
    ]
  };

  // Adjust thought based on personality traits
  let thoughtBase = believer ? thoughts.believer : thoughts.nonBeliever;
  let thoughtIndex = Math.floor(Math.random() * thoughtBase.length);
  
  return thoughtBase[thoughtIndex];
};

/**
 * Get a communication style for an agent based on their personality traits
 * @param agent The agent to determine communication style for
 * @returns A communication style object with templates
 */
const getCommunicationStyle = (agent: Agent) => {
  const { traits } = agent;
  
  // Determine primary personality characteristics
  const traitValues = [
    { trait: 'openness', value: traits.openness },
    { trait: 'conscientiousness', value: traits.conscientiousness },
    { trait: 'extraversion', value: traits.extraversion },
    { trait: 'agreeableness', value: traits.agreeableness },
    { trait: 'neuroticism', value: traits.neuroticism }
  ];
  
  // Sort traits from highest to lowest
  traitValues.sort((a, b) => b.value - a.value);
  
  // Map dominant traits to communication styles with some randomness
  let styles = [];
  
  // Primary trait influence
  if (traitValues[0].value > 0.7) {
    switch(traitValues[0].trait) {
      case 'openness':
        styles.push('intellectual', 'storyteller');
        break;
      case 'conscientiousness':
        styles.push('intellectual', 'skeptical');
        break;
      case 'extraversion':
        styles.push('humorous', 'enthusiastic', 'storyteller');
        break;
      case 'agreeableness':
        styles.push('supportive', 'casual');
        break;
      case 'neuroticism':
        styles.push('reactionary', 'contrarian');
        break;
    }
  }
  
  // Secondary trait influence
  if (traitValues[1].value > 0.6) {
    switch(traitValues[1].trait) {
      case 'openness':
        styles.push('intellectual');
        break;
      case 'conscientiousness':
        styles.push('skeptical');
        break;
      case 'extraversion':
        styles.push('humorous', 'enthusiastic');
        break;
      case 'agreeableness':
        styles.push('supportive');
        break;
      case 'neuroticism':
        styles.push('reactionary');
        break;
    }
  }
  
  // Add randomness - sometimes people communicate in unexpected ways
  if (Math.random() > 0.7) {
    const allStyles = Object.keys(communicationStyles);
    styles.push(allStyles[Math.floor(Math.random() * allStyles.length)]);
  }
  
  // Ensure we have at least one style
  if (styles.length === 0) {
    styles.push('casual');
  }
  
  // Select a random style from the agent's possible styles
  const styleKey = styles[Math.floor(Math.random() * styles.length)] as keyof typeof communicationStyles;
  return communicationStyles[styleKey];
};

/**
 * Find the name of a specific agent
 */
const getAgentName = (id: number, network: Network): string => {
  const agent = network.nodes.find(a => a.id === id);
  return agent ? agent.name : `Agent #${id}`;
};

/**
 * Generate a message from an agent based on their personality, beliefs, thought, and current topic
 * This enhanced version creates more conversational, responsive messages
 * @param agent The agent sending the message
 * @param receiverId The recipient agent id (null for broadcast)
 * @param network Current network state for context
 * @param isFirstMessage Whether this is the first message in a conversation
 * @returns A message object
 */
export const generateMessage = (
  agent: Agent, 
  receiverId: number | null = null,
  network?: Network,
  isReplyTo?: Message
): Message => {
  const { traits, believer, id, thoughtState, name, gender, currentTopic } = agent;
  
  // Get communication style based on agent's personality
  const communicationStyle = getCommunicationStyle(agent);
  
  let messageContent = "";
  const replyToSender = isReplyTo ? isReplyTo.senderId : null;
  const replyToSenderName = replyToSender !== null && network 
    ? getAgentName(replyToSender, network) 
    : null;
    
  // If this is a reply and we have the other message to reference
  if (isReplyTo && replyToSenderName) {
    // Choose between agreement and disagreement
    const isAgreeing = (
      // More likely to agree if same belief
      (isReplyTo.belief === agent.believer && Math.random() > 0.3) || 
      // Less likely to agree if different belief
      (isReplyTo.belief !== agent.believer && Math.random() > 0.7) ||
      // Most agreeable people are more likely to agree regardless
      (agent.traits.agreeableness > 0.8 && Math.random() > 0.5)
    );
    
    // Get the appropriate reply template
    let replyTemplates = isAgreeing 
      ? communicationStyle.agreements 
      : communicationStyle.disagreements;
      
    // Select and format reply
    if (replyTemplates && replyTemplates.length > 0) {
      const templateIndex = Math.floor(Math.random() * replyTemplates.length);
      let template = replyTemplates[templateIndex];
      
      // Replace placeholders
      template = template
        .replace(/\{name\}/g, replyToSenderName)
        .replace(/\{topic\}/g, currentTopic || "this topic");
        
      messageContent = template;
    } else {
      // Fall back to a generic reply
      messageContent = `@${replyToSenderName} ${isAgreeing ? "I agree. " : "I'm not sure about that. "}`;
    }
  } else {
    // This is either a new conversation or a general message
    
    // Determine message content based on topic and belief
    let templates = [];
    
    if (currentTopic) {
      // Get topic-specific templates if available
      const topicKey = currentTopic as keyof typeof topicSpecificTemplates;
      if (topicSpecificTemplates[topicKey]) {
        templates = believer 
          ? topicSpecificTemplates[topicKey].believer 
          : topicSpecificTemplates[topicKey].skeptic;
      } else {
        // Fall back to generic templates
        templates = believer 
          ? topicSpecificTemplates.generic.believer 
          : topicSpecificTemplates.generic.skeptic;
      }
    } else {
      // Fall back to style-specific templates
      templates = communicationStyle.templates;
    }
    
    // For the very first message in a conversation, use a conversation starter
    if (!isReplyTo && network && network.messageLog.length === 0) {
      messageContent = getConversationStarter(currentTopic || "");
    } else {
      // Select a random template
      let templateIndex = Math.floor(Math.random() * templates.length);
      let messageTemplate = templates[templateIndex];
      
      // Replace {topic} placeholder with actual topic
      messageTemplate = messageTemplate.replace(/\{topic\}/g, currentTopic || "this topic");
      
      // Replace {random_comparison} if present
      if (messageTemplate.includes("{random_comparison}")) {
        const comparison = randomComparisons[Math.floor(Math.random() * randomComparisons.length)];
        messageTemplate = messageTemplate.replace(/\{random_comparison\}/g, comparison);
      }
      
      // Add communication style elements
      const intro = communicationStyle.intros[Math.floor(Math.random() * communicationStyle.intros.length)];
      messageContent = intro + messageTemplate;
    }
  }
  
  // Add ending occasionally
  if (Math.random() > 0.5) {
    const ending = communicationStyle.endings[Math.floor(Math.random() * communicationStyle.endings.length)];
    messageContent += ending;
  }
  
  // Add emojis occasionally based on communication style
  if (Math.random() > 0.6) {
    const emojis = {
      humorous: ["😂", "🤣", "😅", "🙈", "💀"],
      intellectual: ["🤔", "📚", "💭", "🧐", "🔍"],
      skeptical: ["🤨", "🧐", "👀", "🙄", "🤷‍♀️"],
      enthusiastic: ["✨", "🙌", "💯", "🤩", "🔥"],
      casual: ["👍", "😊", "👋", "🙂", "✌️"],
      contrarian: ["😏", "🤐", "⚠️", "🚫", "👊"],
      supportive: ["❤️", "🤗", "🥰", "💪", "✨"],
      storyteller: ["📖", "🗣️", "✨", "👴", "👵"],
      reactionary: ["😱", "😮", "⚡", "❗", "⁉️"]
    };
    
    // Get emojis for the selected style or default to casual
    const styleKey = Object.keys(emojis).find(key => key === communicationStyle) || "casual";
    const emojiList = emojis[styleKey as keyof typeof emojis];
    const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    
    // Add emoji at a natural location
    if (Math.random() > 0.5 && messageContent.includes(".")) {
      // Add after a sentence
      const sentences = messageContent.split(".");
      if (sentences.length > 1) {
        const randomSentenceIndex = Math.floor(Math.random() * (sentences.length - 1));
        sentences[randomSentenceIndex] += emoji;
        messageContent = sentences.join(".");
      } else {
        messageContent += " " + emoji;
      }
    } else {
      // Add at the end
      messageContent += " " + emoji;
    }
  }
  
  // Construct complete message
  let content = `${name}: ${messageContent}`;
  
  // Add thought if available (with low probability to make it more natural)
  if (thoughtState && Math.random() > 0.85) {
    content = `${content} (Thinking to myself: "${thoughtState}")`;
  }
  
  // For lengthy conversation, occasionally reference previous context
  if (network && 
      network.messageLog.length > 5 && 
      Math.random() > 0.85 && 
      !isReplyTo && 
      network.messageLog.length > 0) {
    
    // Get a random earlier message to reference
    const earlierMessages = network.messageLog.slice(0, -3); // Exclude very recent messages
    if (earlierMessages.length > 0) {
      const randomEarlierMsg = earlierMessages[Math.floor(Math.random() * earlierMessages.length)];
      const randomMsgSenderId = randomEarlierMsg.senderId;
      
      // Only reference if it's not the current agent
      if (randomMsgSenderId !== id) {
        const randomSenderName = getAgentName(randomMsgSenderId, network);
        const referenceComments = [
          `Going back to what @${randomSenderName} said earlier...`,
          `@${randomSenderName} mentioned something related a while ago.`,
          `This reminds me of @${randomSenderName}'s point from before.`,
          `Like @${randomSenderName} was saying earlier...`,
          `To build on what @${randomSenderName} said...`
        ];
        
        const referenceComment = referenceComments[Math.floor(Math.random() * referenceComments.length)];
        content = `${content}\n\n${referenceComment}`;
      }
    }
  }

  return {
    id: `msg_${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    senderId: id,
    receiverId,
    timestamp: Date.now(),
    content,
    belief: believer,
    topic: currentTopic,
    replyToId: isReplyTo?.id
  };
};

/**
 * Update agent traits based on interactions and influence
 * @param agent The agent to update
 * @param messages Recent messages received
 * @returns Updated traits
 */
export const updateAgentTraits = (agent: Agent, messages: Message[]): BigFiveTraits => {
  if (!messages.length) return agent.traits;
  
  // Clone current traits to avoid direct mutation
  const newTraits = { ...agent.traits };

  // Calculate trait changes based on recent interactions
  messages.forEach(message => {
    const influenceFactor = 0.01; // Small incremental changes
    
    if (message.belief === agent.believer) {
      // Reinforcement from like-minded agents
      newTraits.openness = Math.max(0, Math.min(1, newTraits.openness - influenceFactor * 0.5)); // Become less open to new ideas
      newTraits.conscientiousness = Math.max(0, Math.min(1, newTraits.conscientiousness + influenceFactor)); // More confident in current beliefs
      
      // Agreeable people become more agreeable in echo chambers
      if (agent.traits.agreeableness > 0.5) {
        newTraits.agreeableness = Math.max(0, Math.min(1, newTraits.agreeableness + influenceFactor));
      }
    } else {
      // Challenged by opposing views
      newTraits.neuroticism = Math.max(0, Math.min(1, newTraits.neuroticism + influenceFactor * 0.8)); // Increase stress when challenged
      
      if (agent.susceptibility && agent.susceptibility > 0.6) {
        // More susceptible agents become more open when challenged
        newTraits.openness = Math.max(0, Math.min(1, newTraits.openness + influenceFactor));
      } else {
        // Less susceptible agents might become more closed-minded when challenged
        newTraits.openness = Math.max(0, Math.min(1, newTraits.openness - influenceFactor));
      }
      
      // Extroverts may become more extroverted when debating
      if (agent.traits.extraversion > 0.6) {
        newTraits.extraversion = Math.max(0, Math.min(1, newTraits.extraversion + influenceFactor * 0.5));
      }
    }
  });
  
  return newTraits;
};

/**
 * Initialize agents with random traits and assign initial believers
 * @param count Number of agents to create
 * @param initialBelieverPercentage Percentage of agents that start as believers
 * @returns Array of initialized agents
 */
export const initializeAgents = (
  count: number,
  initialBelieverPercentage: number
): Agent[] => {
  const agents: Agent[] = [];
  
  // Generate a single topic for this simulation run
  const simulationTopic = getRandomTopic();

  for (let i = 0; i < count; i++) {
    const traits = generateRandomTraits();
    const susceptibility = calculateSusceptibility(traits);
    const gender: Gender = Math.random() > 0.5 ? "male" : "female";
    const name = generateRandomIndianName(gender);
    
    agents.push({
      id: i,
      name,
      gender,
      traits,
      believer: false, // Will be set later for some agents
      neighbors: [],
      beliefHistory: [],
      susceptibility,
      messages: [],
      receivedMessages: [],
      currentTopic: simulationTopic, // Set the same topic for all agents
      traitHistory: [], // Initialize as empty array
      messageContextMemory: [] // Initialize context memory
    });
  }

  // Assign initial believers randomly
  const initialBelieverCount = Math.floor(
    (count * initialBelieverPercentage) / 100
  );
  
  const shuffledIndices = [...Array(count).keys()].sort(
    () => Math.random() - 0.5
  );
  
  for (let i = 0; i < initialBelieverCount; i++) {
    const index = shuffledIndices[i];
    agents[index].believer = true;
    agents[index].beliefHistory = [true];
  }
  
  // Initialize belief history for non-believers
  agents.forEach((agent) => {
    if (agent.beliefHistory.length === 0) {
      agent.beliefHistory = [false];
    }
    
    // Generate initial thought
    agent.thoughtState = generateThought(agent);
  });

  return agents;
};

/**
 * Create a random network connecting the agents
 * @param agents Array of agents
 * @param density Connection density (0-1)
 * @returns Network object with nodes and links
 */
export const createRandomNetwork = (
  agents: Agent[],
  density: number
): Network => {
  const nodes = [...agents];
  const links: { source: number; target: number }[] = [];
  const agentCount = agents.length;

  // For each pair of agents, create a link with probability = density
  for (let i = 0; i < agentCount; i++) {
    for (let j = i + 1; j < agentCount; j++) {
      if (Math.random() < density) {
        // Add bidirectional connection
        nodes[i].neighbors.push(j);
        nodes[j].neighbors.push(i);
        
        // Add link for visualization
        links.push({ source: i, target: j });
      }
    }
  }

  // Get the topic from the first agent (all agents have the same topic in a run)
  const currentTopic = agents[0]?.currentTopic || getRandomTopic();

  return { 
    nodes, 
    links,
    messageLog: [],
    currentTopic
  };
};

/**
 * Create a scale-free network using preferential attachment (Barabási–Albert model)
 * @param agents Array of agents
 * @param m Number of connections per new node
 * @returns Network object with nodes and links
 */
export const createScaleFreeNetwork = (
  agents: Agent[],
  m: number
): Network => {
  const nodes = [...agents];
  const links: { source: number; target: number }[] = [];
  const agentCount = agents.length;
  
  if (agentCount < m + 1) {
    toast.error("Need more agents for scale-free network");
    return createRandomNetwork(agents, 0.1);
  }

  // Initialize with m fully connected nodes
  for (let i = 0; i < m; i++) {
    for (let j = i + 1; j < m; j++) {
      nodes[i].neighbors.push(j);
      nodes[j].neighbors.push(i);
      links.push({ source: i, target: j });
    }
  }

  // Add remaining nodes with preferential attachment
  for (let i = m; i < agentCount; i++) {
    // Calculate probability distribution based on current degree
    const degreeSum = links.length * 2;
    const probabilities: number[] = [];
    
    for (let j = 0; j < i; j++) {
      probabilities.push(nodes[j].neighbors.length / degreeSum);
    }
    
    // Add m connections for this new node
    const connected: Set<number> = new Set();
    while (connected.size < m) {
      // Select node based on probability (preferential attachment)
      let r = Math.random();
      let j = 0;
      
      while (r > 0 && j < i) {
        r -= probabilities[j];
        j++;
      }
      j = Math.max(0, j - 1);
      
      if (!connected.has(j)) {
        connected.add(j);
        nodes[i].neighbors.push(j);
        nodes[j].neighbors.push(i);
        links.push({ source: i, target: j });
      }
    }
  }

  // Get the topic from the first agent (all agents have the same topic in a run)
  const currentTopic = agents[0]?.currentTopic || getRandomTopic();

  return { 
    nodes, 
    links,
    messageLog: [],
    currentTopic
  };
};

/**
 * Create a small-world network (Watts-Strogatz model)
 * @param agents Array of agents
 * @param k Each node is connected to k nearest neighbors
 * @param beta Rewiring probability
 * @returns Network object with nodes and links
 */
export const createSmallWorldNetwork = (
  agents: Agent[],
  k: number = 4,
  beta: number = 0.1
): Network => {
  const nodes = [...agents];
  const links: { source: number; target: number }[] = [];
  const agentCount = agents.length;

  if (k >= agentCount || k % 2 !== 0) {
    toast.error("Invalid k value for small-world network");
    return createRandomNetwork(agents, 0.1);
  }

  // Create ring lattice
  for (let i = 0; i < agentCount; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const neighbor = (i + j) % agentCount;
      nodes[i].neighbors.push(neighbor);
      nodes[neighbor].neighbors.push(i);
      links.push({ source: i, target: neighbor });
    }
  }

  // Rewire edges with probability beta
  for (let i = 0; i < agentCount; i++) {
    for (let j = 1; j <= k / 2; j++) {
      if (Math.random() < beta) {
        // Remove current edge
        const oldNeighbor = (i + j) % agentCount;
        const indexInOld = nodes[oldNeighbor].neighbors.indexOf(i);
        const indexInCurrent = nodes[i].neighbors.indexOf(oldNeighbor);
        
        if (indexInOld !== -1) {
          nodes[oldNeighbor].neighbors.splice(indexInOld, 1);
        }
        
        if (indexInCurrent !== -1) {
          nodes[i].neighbors.splice(indexInCurrent, 1);
        }
        
        // Find link to remove
        const linkIndex = links.findIndex(
          (link) =>
            (link.source === i && link.target === oldNeighbor) ||
            (link.source === oldNeighbor && link.target === i)
        );
        
        if (linkIndex !== -1) {
          links.splice(linkIndex, 1);
        }

        // Add new random edge
        let newNeighbor;
        do {
          newNeighbor = Math.floor(Math.random() * agentCount);
        } while (
          newNeighbor === i ||
          nodes[i].neighbors.includes(newNeighbor)
        );
        
        nodes[i].neighbors.push(newNeighbor);
        nodes[newNeighbor].neighbors.push(i);
        links.push({ source: i, target: newNeighbor });
      }
    }
  }

  // Get the topic from the first agent (all agents have the same topic in a run)
  const currentTopic = agents[0]?.currentTopic || getRandomTopic();

  return { 
    nodes, 
    links,
    messageLog: [],
    currentTopic
  };
};

/**
 * Create a network based on the specified type
 * @param agents Array of agents
 * @param type Network type (random, scale-free, small-world)
 * @param density Connection density for random networks
 * @returns Network object with nodes and links
 */
export const createNetwork = (
  agents: Agent[],
  type: "random" | "scale-free" | "small-world",
  density: number
): Network => {
  let result: Network;
  
  switch (type) {
    case "random":
      result = createRandomNetwork(agents, density);
      break;
    case "scale-free":
      const m = Math.max(2, Math.floor(density * 10)); // Convert density to connections
      result = createScaleFreeNetwork(agents, m);
      break;
    case "small-world":
      const k = Math.max(4, Math.floor(density * 10)); // Convert density to nearest neighbors
      result = createSmallWorldNetwork(agents, k % 2 === 0 ? k : k + 1);
      break;
    default:
      result = createRandomNetwork(agents, density);
  }
  
  return result;
};

/**
 * Exchange messages between agents in the network with more realistic conversation patterns
 * @param network Current network state
 * @returns Updated network with exchanged messages
 */
export const exchangeMessages = (network: Network): Network => {
  const updatedNetwork = { ...network };
  const newMessages: Message[] = [];
  
  // If this is a new conversation, have someone start with a conversation starter
  if (network.messageLog.length === 0) {
    // Choose a random agent to start the conversation
    const randomAgentIndex = Math.floor(Math.random() * network.nodes.length);
    const startingAgent = updatedNetwork.nodes[randomAgentIndex];
    
    // Generate and send opening message
    const message = generateMessage(startingAgent, null, updatedNetwork);
    startingAgent.messages.push(message);
    newMessages.push(message);
    
    // Add message to everyone's inbox (broadcast)
    updatedNetwork.nodes.forEach(agent => {
      if (agent.id !== startingAgent.id) {
        agent.receivedMessages.push(message);
      }
    });
  } else {
    // Continuing conversation - some agents will respond to previous messages
    
    // Get recent messages to respond to
    const recentMessages = network.messageLog.slice(Math.max(0, network.messageLog.length - 5));
    
    // Each agent might generate a reply or a new message
    updatedNetwork.nodes.forEach((agent) => {
      // Generate a new thought state
      agent.thoughtState = generateThought(agent);
      
      // Chance to participate based on extraversion and randomness
      const participationChance = 0.2 + agent.traits.extraversion * 0.4;
      
      if (Math.random() < participationChance) {
        // Decide whether to reply to an existing message or post a new one
        const willReply = recentMessages.length > 0 && Math.random() < 0.7;
        
        if (willReply) {
          // Pick a message to reply to
          const messageToReplyTo = recentMessages[Math.floor(Math.random() * recentMessages.length)];
          
          // Don't reply to your own message (usually)
          if (messageToReplyTo.senderId !== agent.id || Math.random() < 0.1) {
            // Generate and send reply
            const message = generateMessage(agent, null, updatedNetwork, messageToReplyTo);
            agent.messages.push(message);
            newMessages.push(message);
            
            // Add message to everyone's inbox (broadcast)
            updatedNetwork.nodes.forEach(otherAgent => {
              if (otherAgent.id !== agent.id) {
                otherAgent.receivedMessages.push(message);
              }
            });
          }
        } else {
          // Generate and send a new message
          const message = generateMessage(agent, null, updatedNetwork);
          agent.messages.push(message);
          newMessages.push(message);
          
          // Add message to everyone's inbox (broadcast)
          updatedNetwork.nodes.forEach(otherAgent => {
            if (otherAgent.id !== agent.id) {
              otherAgent.receivedMessages.push(message);
            }
          });
        }
      }
    });
  }
  
  // Limit the number of new messages per step for readability
  const maxMessagesPerStep = 3;
  const selectedMessages = newMessages.length <= maxMessagesPerStep 
    ? newMessages 
    : newMessages.sort(() => Math.random() - 0.5).slice(0, maxMessagesPerStep);
  
  // Add selected messages to the log
  updatedNetwork.messageLog = [...updatedNetwork.messageLog, ...selectedMessages];
  
  return updatedNetwork;
};

/**
 * Run a single step of belief propagation in the network
 * @param network Current network state
 * @returns Updated network after one step of belief propagation
 */
export const runBeliefPropagationStep = (network: Network): Network => {
  // Use the same topic throughout the simulation run
  const currentTopic = network.currentTopic;
  
  // Deep clone network to avoid reference issues
  let newNetwork = { 
    ...network,
    currentTopic,
    nodes: JSON.parse(JSON.stringify(network.nodes)),
    links: [...network.links],
    messageLog: [...network.messageLog]
  };
  
  // Ensure all agents have the same topic
  newNetwork.nodes.forEach(agent => {
    agent.currentTopic = currentTopic;
  });

  // Exchange messages with the consistent topic
  newNetwork = exchangeMessages(newNetwork);

  // For each agent, check neighbors' beliefs and received messages
  newNetwork.nodes.forEach((agent) => {
    const neighbors = agent.neighbors;
    
    if (neighbors.length === 0) {
      // Isolated agent, belief doesn't change
      agent.beliefHistory.push(agent.believer);
      return;
    }

    // Count believing neighbors
    const believingNeighborsCount = neighbors.filter(
      (neighborId) => network.nodes[neighborId].believer
    ).length;

    // Get recent messages from neighbors
    const recentMessages = agent.receivedMessages.slice(-5);
    const believerMessageCount = recentMessages.filter(m => m.belief).length;
    
    // Adjust belief threshold based on message content (weighted by agreeableness)
    const messageInfluence = recentMessages.length > 0 
      ? (believerMessageCount / recentMessages.length - 0.5) * agent.traits.agreeableness * 0.2
      : 0;

    // Simple majority rule with susceptibility and message adjustments
    const thresholdBase = 0.5; // Default threshold is 50%
    const threshold = thresholdBase - (agent.susceptibility || 0) * 0.2 - messageInfluence;
    const majorityBelieve = believingNeighborsCount / neighbors.length > threshold;

    // Update belief
    agent.believer = majorityBelieve;
    agent.beliefHistory.push(majorityBelieve);
    
    // Update thought state based on new belief
    agent.thoughtState = generateThought(agent);
  });

  return newNetwork;
};

/**
 * Calculate statistics for the current simulation state
 * @param network Current network state
 * @returns Object with statistics
 */
export const calculateStatistics = (network: Network) => {
  const totalAgents = network.nodes.length;
  const believers = network.nodes.filter((agent) => agent.believer).length;
  
  return {
    totalAgents,
    believers,
    nonBelievers: totalAgents - believers,
    believerPercentage: (believers / totalAgents) * 100,
    averageSusceptibility: 
      network.nodes.reduce((sum, agent) => sum + (agent.susceptibility || 0), 0) / totalAgents,
    averageDegree: 
      network.nodes.reduce((sum, agent) => sum + agent.neighbors.length, 0) / totalAgents,
  };
};

/**
 * Generate data for belief adoption over time chart
 * @param network Current network state
 * @returns Array of data points for chart
 */
export const generateBeliefHistoryData = (network: Network) => {
  const historyLength = network.nodes[0]?.beliefHistory.length || 0;
  const data = [];

  for (let step = 0; step < historyLength; step++) {
    const believers = network.nodes.filter(
      (agent) => agent.beliefHistory[step]
    ).length;
    
    data.push({
      step,
      believers,
      nonBelievers: network.nodes.length - believers,
      believerPercentage: (believers / network.nodes.length) * 100,
    });
  }

  return data;
};

/**
 * Generate a CSV export of the simulation results including messages
 * @param network Current network state
 * @returns CSV string of simulation data
 */
export const generateExportData = (network: Network): string => {
  // CSV header
  let csv = "agent_id,name,gender,openness,conscientiousness,extraversion,agreeableness,neuroticism,susceptibility,final_belief,neighbors,belief_history\n";
  
  // Add data for each agent
  network.nodes.forEach((agent) => {
    csv += `${agent.id},${agent.name},${agent.gender},${agent.traits.openness.toFixed(3)},${agent.traits.conscientiousness.toFixed(3)},${agent.traits.extraversion.toFixed(3)},${agent.traits.agreeableness.toFixed(3)},${agent.traits.neuroticism.toFixed(3)},${(agent.susceptibility || 0).toFixed(3)},${agent.believer},${agent.neighbors.join("|")},${agent.beliefHistory.map(b => b ? 1 : 0).join("|")}\n`;
  });
  
  return csv;
};

/**
 * Generate a CSV export of the message log
 * @param network Current network state
 * @returns CSV string of message data
 */
export const generateMessageLogExport = (network: Network): string => {
  // CSV header
  let csv = "message_id,sender_id,receiver_id,timestamp,belief_state,content,reply_to_id\n";
  
  // Add data for each message
  network.messageLog.forEach((message) => {
    // Escape quotes in content
    const safeContent = message.content.replace(/"/g, '""');
    
    csv += `${message.id},${message.senderId},${message.receiverId || "broadcast"},${message.timestamp},${message.belief ? 1 : 0},"${safeContent}",${message.replyToId || ""}\n`;
  });
  
  return csv;
};

/**
 * Download data as a CSV file
 * @param data CSV string data
 * @param filename Name of the file to download
 */
export const downloadCSV = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
