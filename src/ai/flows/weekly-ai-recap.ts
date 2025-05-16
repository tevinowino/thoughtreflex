// src/ai/flows/weekly-ai-recap.ts
'use server';
/**
 * @fileOverview Generates a weekly AI recap summarizing emotional trends, victories, and struggles.
 *
 * - generateWeeklyRecap - A function that generates the weekly recap.
 * - WeeklyRecapInput - The input type for the generateWeeklyRecap function.
 * - WeeklyRecapOutput - The return type for the generateWeeklyRecap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeeklyRecapInputSchema = z.object({
  emotionalTrends: z
    .string()
    .describe('Summary of emotional trends observed throughout the week.'),
  victories: z.string().describe('Summary of victories achieved during the week.'),
  struggles: z.string().describe('Summary of struggles faced during the week.'),
  additionalContext: z
    .string()
    .optional()
    .describe('Any additional context or information to consider.'),
});

export type WeeklyRecapInput = z.infer<typeof WeeklyRecapInputSchema>;

const WeeklyRecapOutputSchema = z.object({
  recap: z.string().describe('A comprehensive weekly recap encouraging growth and self-awareness.'),
});

export type WeeklyRecapOutput = z.infer<typeof WeeklyRecapOutputSchema>;

export async function generateWeeklyRecap(input: WeeklyRecapInput): Promise<WeeklyRecapOutput> {
  return weeklyRecapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklyRecapPrompt',
  input: {schema: WeeklyRecapInputSchema},
  output: {schema: WeeklyRecapOutputSchema},
  prompt: `You are an AI therapist specializing in providing weekly recaps to encourage growth and self-awareness.

  Based on the user's emotional trends, victories, and struggles, generate a recap that summarizes the week and offers encouragement.

  Emotional Trends: {{{emotionalTrends}}}
  Victories: {{{victories}}}
  Struggles: {{{struggles}}}
  Additional Context: {{{additionalContext}}}

  Recap:`,
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
