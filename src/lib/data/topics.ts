
export const DISCUSSION_TOPICS = [
  "remote work flexibility",
  "social media influence on mental health",
  "sustainable living practices",
  "artificial intelligence in education",
  "work-life balance in modern society",
  "renewable energy adoption",
  "digital privacy rights",
  "universal basic income",
  "plant-based diets",
  "electric vehicle transition",
  "mindfulness and meditation",
  "online learning effectiveness",
  "cryptocurrency adoption",
  "space exploration funding",
  "mental health awareness",
  "gender equality in workplaces",
  "climate change action",
  "affordable healthcare access",
  "public transportation development",
  "digital minimalism lifestyle"
];

export const CONVERSATION_STARTERS = [
  "This has been on my mind recently:",
  "Let's discuss something interesting:",
  "What do you think about",
  "I have an opinion on",
  "What does everyone think about",
  "Curious what you all think about",
  "Been hearing a lot about",
  "Has anyone considered",
  "I've been reflecting on",
  "Something worth discussing:"
];

export function getRandomTopic(): string {
  return DISCUSSION_TOPICS[Math.floor(Math.random() * DISCUSSION_TOPICS.length)];
}
