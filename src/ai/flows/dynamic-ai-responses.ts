// 'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating dynamic AI responses in a therapy app.
 *
 * The flow takes user input from a journaling session and uses the Gemini API to:
 *   - Generate emotionally intelligent follow-up questions.
 *   - Identify recurring themes (e.g., anxiety, burnout).
 *   - Suggest relevant affirmations.
 *
 * @fileOverview
 * - generateDynamicAIResponse - The function to generate dynamic AI responses.
 * - DynamicAIResponseInput - The input type for the generateDynamicAIResponse function.
 * - DynamicAIResponseOutput - The output type for the generateDynamicAIResponse function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DynamicAIResponseInputSchema = z.object({
  journalEntry: z
    .string()
    .describe('The user journal entry to be processed.'),
  therapyMode: z
    .enum(['Therapist', 'Coach', 'Friend'])
    .describe('The tone and style of the AI responses.'),
  healingGoals: z
    .string()
    .optional()
    .describe('The user defined healing goals.'),
});

export type DynamicAIResponseInput = z.infer<typeof DynamicAIResponseInputSchema>;

const DynamicAIResponseOutputSchema = z.object({
  followUpQuestion: z
    .string()
    .describe('An emotionally intelligent follow-up question for the user.'),
  identifiedThemes: z
    .string()
    .describe('Recurring themes identified in the journal entry.'),
  suggestedAffirmations: z
    .string()
    .describe('Suggested affirmations based on identified themes.'),
});

export type DynamicAIResponseOutput = z.infer<typeof DynamicAIResponseOutputSchema>;

export async function generateDynamicAIResponse(
  input: DynamicAIResponseInput
): Promise<DynamicAIResponseOutput> {
  return dynamicAIResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicAIResponsePrompt',
  input: {schema: DynamicAIResponseInputSchema},
  output: {schema: DynamicAIResponseOutputSchema},
  prompt: `You are an AI therapist. Your role is to provide thoughtful and supportive responses to user journal entries.

  The user is currently in "{{therapyMode}}" mode, formulate your responses in that tone.

  Consider their healing goals: "{{healingGoals}}".

  Based on the following journal entry:
  {{journalEntry}}

  Identify recurring themes and suggest affirmations to support their emotional well-being.
  Ask one follow-up question to encourage further reflection. Return the question, the identified themes, and suggested affirmations as a string.
  `,
});

const dynamicAIResponseFlow = ai.defineFlow(
  {
    name: 'dynamicAIResponseFlow',
    inputSchema: DynamicAIResponseInputSchema,
    outputSchema: DynamicAIResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
