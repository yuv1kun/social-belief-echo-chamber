// Main simulation orchestration file
export * from "./agents/agentTypes";
export * from "./agents/agentGeneration";
export * from "./agents/agentBehavior";
export * from "./network/networkTypes";
export * from "./network/networkGeneration";
export * from "./network/networkAnalysis";
export * from "./data/topics";
export * from "./export/exportUtils";

// Re-export everything for backwards compatibility
import { initializeAgents } from "./agents/agentGeneration";
import { createNetwork } from "./network/networkGeneration";
import { calculateStatistics, generateBeliefHistoryData } from "./network/networkAnalysis";
import { simulateMessageExchange } from "./messaging/messageGeneration";
import { getRandomTopic } from "./data/topics";
import { generateExportData, downloadCSV } from "./export/exportUtils";

// Keep the main simulation functions here for easy access
export {
  initializeAgents,
  createNetwork,
  calculateStatistics,
  generateBeliefHistoryData,
  simulateMessageExchange,
  getRandomTopic,
  generateExportData,
  downloadCSV
};
