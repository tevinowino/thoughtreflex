
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
});

export type WeeklyRecapOutput = z.infer<typeof WeeklyRecapOutputSchema>;

export async function generateWeeklyRecap(input: WeeklyRecapInput): Promise<WeeklyRecapOutput> {
  return weeklyRecapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklyRecapPrompt',
  input: {schema: WeeklyRecapInputSchema},
  output: {schema: WeeklyRecapOutputSchema},
  prompt: `You are Mira, an AI companion specializing in creating insightful, empathetic, and encouraging weekly recaps for {{#if userName}}{{userName}}{{else}}the user{{/if}}. Your goal is to help them reflect on their week and foster self-awareness.

Based on the following journal entries from the user over the past week:
{{{journalEntriesText}}}

Please craft a comprehensive weekly recap that:
1.  Identifies and thoughtfully discusses key emotional trends (e.g., patterns of anxiety, moments of joy, stress indicators, feelings of hope or frustration).
2.  Highlights notable victories, achievements, or positive moments the user shared, no matter how small.
3.  Acknowledges any significant struggles or challenges mentioned with sensitivity and validation.
4.  Synthesizes these elements into a flowing narrative. The recap should be encouraging, promote self-awareness, and offer gentle suggestions or reflections if appropriate, based *only* on the provided entries.
    Avoid making assumptions or giving unsolicited advice beyond gentle reflections tied to the text.
5.  The tone should be consistently supportive, understanding, and human-like.

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
    if (!input.journalEntriesText.trim()) {
      return { recap: "It seems there were no journal entries this past week to generate a recap from. Keep journaling, and I can provide a summary next time!" };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
