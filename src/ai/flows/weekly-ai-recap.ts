
// src/ai/flows/weekly-ai-recap.ts
'use server';
/**
 * @fileOverview Generates a weekly AI recap summarizing emotional trends, victories, and struggles
 * based on a user's journal entries from the past week.
 *
 * - generateWeeklyRecap - A function that generates the weekly recap.
 * - WeeklyRecapInput - The input type for the generateWeeklyRecap function.
 * - WeeklyRecapOutput - The return type for the generateWeeklyRecap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeeklyRecapInputSchema = z.object({
  journalEntriesText: z
    .string()
    .describe('Concatenated text of all user journal entries from the past week.'),
  userName: z
    .string()
    .optional()
    .describe("The user's name, for personalization."),
});

export type WeeklyRecapInput = z.infer<typeof WeeklyRecapInputSchema>;

const WeeklyRecapOutputSchema = z.object({
  recap: z.string().describe('A comprehensive weekly recap encouraging growth and self-awareness, including identified emotional trends, victories, and struggles.'),
  // Optional: For more structured AI output, we could add these back
  // emotionalHigh: z.string().optional().describe('Identified emotional high for the week based on entries.'),
  // struggleOfTheWeek: z.string().optional().describe('Identified struggle of the week based on entries.'),
  // growthMoment: z.string().optional().describe('Identified growth moment based on entries.'),
});

export type WeeklyRecapOutput = z.infer<typeof WeeklyRecapOutputSchema>;

export async function generateWeeklyRecap(input: WeeklyRecapInput): Promise<WeeklyRecapOutput> {
  return weeklyRecapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklyRecapPrompt',
  input: {schema: WeeklyRecapInputSchema},
  output: {schema: WeeklyRecapOutputSchema},
  prompt: `You are an AI therapist specializing in providing insightful and encouraging weekly recaps.
{{#if userName}}The user's name is {{userName}}.{{/if}}

Based on the following journal entries from the user over the past week, please:
1. Identify key emotional trends (e.g., feelings of anxiety, moments of joy, stress patterns).
2. Highlight notable victories or positive moments the user shared.
3. Acknowledge any significant struggles or challenges mentioned.
4. Synthesize these into a comprehensive weekly recap. The recap should be encouraging, promote self-awareness, and offer gentle suggestions or reflections if appropriate.
   Make sure the recap naturally weaves in the identified trends, victories, and struggles, rather than listing them as bullet points.
   The tone should be supportive and empathetic.

Journal Entries from the Week:
{{{journalEntriesText}}}

Provide the full synthesized recap as a single string in the 'recap' field.
`,
});

const weeklyRecapFlow = ai.defineFlow(
  {
    name: 'weeklyRecapFlow',
    inputSchema: WeeklyRecapInputSchema,
    outputSchema: WeeklyRecapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
