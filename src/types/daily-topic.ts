// src/types/daily-topic.ts

export interface DailyTopicScoreRangeResponse {
  miraResponse: string;
  journalPrompt: string;
  resourceSuggestion?: string; // Optional text suggestion for a resource
}

export interface DailyTopic {
  id: string; // e.g., "monday-self-compassion"
  dayOfWeek: string; // e.g., "Monday", "Tuesday"
  topicName: string; // e.g., "Cultivating Self-Compassion"
  introduction: string; // A brief intro to the topic by Mira
  scaleQuestions: Array<{ id: string; text: string; reverseScore?: boolean }>;
  scoreRanges: {
    low: DailyTopicScoreRangeResponse; // e.g., for scores 3-7
    medium: DailyTopicScoreRangeResponse; // e.g., for scores 8-12
    high: DailyTopicScoreRangeResponse; // e.g., for scores 13-15
  };
  // Optional: A general resource link or tip for the topic
  generalResource?: { text: string; link?: string }; 
}