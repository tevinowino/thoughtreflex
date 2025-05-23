
// src/ai/core/daily-topic-content-schemas.ts
// This file does NOT use 'use server'. It contains reusable schema definitions for daily topic content.
import {z} from 'genkit';
import type { Timestamp } from 'firebase/firestore';

export const DailyTopicScaleQuestionSchema = z.object({
  id: z.string().describe("A unique identifier for the question, e.g., 'q1', 'q2'."),
  text: z.string().describe("The text of the scale-based question."),
  reverseScore: z.boolean().optional().describe("Set to true if a lower score indicates a more positive response for this question."),
});
export type DailyTopicScaleQuestion = z.infer<typeof DailyTopicScaleQuestionSchema>;

export const DailyTopicScoreRangeResponseSchema = z.object({
  miraResponse: z.string().describe("Mira's personalized reflection based on the user's score range for the topic."),
  journalPrompt: z.string().describe("A specific journal prompt to help the user explore the topic further based on their score range."),
  resourceSuggestion: z.string().optional().describe("An optional brief suggestion for an external resource or activity."),
});
export type DailyTopicScoreRangeResponse = z.infer<typeof DailyTopicScoreRangeResponseSchema>;

export const GenerateDailyTopicContentInputSchema = z.object({
  userName: z.string().optional().describe("The user's display name, for personalization."),
  detectedUserIssues: z.array(z.string()).optional().describe("A list of emotional issues or themes previously detected for the user, e.g., ['anxiety', 'self-doubt']. Helps in tailoring the topic."),
  userReportedStruggles: z.array(z.string()).optional().describe("A list of user-reported struggles or focus areas to help tailor the topic.")
});
export type GenerateDailyTopicContentInput = z.infer<typeof GenerateDailyTopicContentInputSchema>;

export const GenerateDailyTopicContentOutputSchema = z.object({
  topicName: z.string().describe("The name or title of the daily guided topic."),
  introduction: z.string().describe("An empathetic introduction to the topic from Mira."),
  scaleQuestions: z.array(DailyTopicScaleQuestionSchema).min(3).max(5).describe("An array of 3 to 5 unique scale-based questions for the user to answer (1-5)."),
  scoreRanges: z.object({
    low: DailyTopicScoreRangeResponseSchema.describe("Response for users scoring in the low range."),
    medium: DailyTopicScoreRangeResponseSchema.describe("Response for users scoring in the medium range."),
    high: DailyTopicScoreRangeResponseSchema.describe("Response for users scoring in the high range."),
  }).describe("Personalized responses based on aggregated scores from scale questions."),
  generalResource: z.object({
    text: z.string().describe("Descriptive text for a general resource related to the topic."),
    link: z.string().url().optional().describe("An optional URL to an external resource. Should be a valid web address if provided."),
  }).optional().describe("An optional general resource suggestion relevant to the topic."),
});
export type GenerateDailyTopicContentOutput = z.infer<typeof GenerateDailyTopicContentOutputSchema>;

// For storing user answers in Firestore
export interface DailyTopicUserAnswers {
  topicName: string;
  scores: number[];
  miraResponse: string;
  journalPrompt: string;
  userEntry: string | null;
  completedAt: Timestamp;
}
    