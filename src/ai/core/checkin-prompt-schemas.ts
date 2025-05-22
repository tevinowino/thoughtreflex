
// src/ai/core/checkin-prompt-schemas.ts
// This file does NOT use 'use server'. It contains reusable schema definitions.
import {z} from 'genkit';

export const GenerateCheckinPromptInputSchema = z.object({
  userName: z.string().optional().describe("The user's display name, if available."),
  userActiveGoal: z.string().optional().describe("The user's current primary active goal, if set."),
  userMbtiType: z.string().optional().describe("The user's MBTI personality type, if recorded."),
  daysSinceLastEntry: z.number().optional().describe("Number of days since the user's last journal entry. 0 if today, 1 if yesterday, etc. Can be undefined if no prior entries."),
});

export const GenerateCheckinPromptOutputSchema = z.object({
  checkInPrompt: z.string().describe("A personalized and thoughtful opening prompt for a new journal session from Mira."),
});
