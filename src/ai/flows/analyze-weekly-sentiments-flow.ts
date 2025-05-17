
'use server';
/**
 * @fileOverview Analyzes sentiments from weekly recaps for trend visualization.
 *
 * - analyzeWeeklySentiments - A function that processes weekly recap texts to extract sentiment scores.
 * - AnalyzeWeeklySentimentsInput - The input type for the analyzeWeeklySentiments function.
 * - AnalyzeWeeklySentimentsOutput - The return type for the analyzeWeeklySentiments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeeklyRecapSentimentSchema = z.object({
  weekName: z.string().describe("The identifier for the week (e.g., 'Week 1', 'Last Week')."),
  positive: z.number().describe('A score from 0-10 representing positive sentiment intensity.'),
  negative: z.number().describe('A score from 0-10 representing negative sentiment intensity.'),
  neutral: z.number().describe('A score from 0-10 representing neutral sentiment intensity.'),
});

const AnalyzeWeeklySentimentsInputSchema = z.object({
  recapTexts: z.array(z.object({
    id: z.string(),
    title: z.string(), // To help AI identify the week
    summary: z.string()
  })).describe('An array of weekly recap objects, each containing its ID, title, and summary text.'),
});
export type AnalyzeWeeklySentimentsInput = z.infer<typeof AnalyzeWeeklySentimentsInputSchema>;

const AnalyzeWeeklySentimentsOutputSchema = z.object({
  trends: z.array(WeeklyRecapSentimentSchema).describe('An array of sentiment scores for each processed weekly recap.'),
});
export type AnalyzeWeeklySentimentsOutput = z.infer<typeof AnalyzeWeeklySentimentsOutputSchema>;

export async function analyzeWeeklySentiments(input: AnalyzeWeeklySentimentsInput): Promise<AnalyzeWeeklySentimentsOutput> {
  return analyzeWeeklySentimentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWeeklySentimentsPrompt',
  input: {schema: AnalyzeWeeklySentimentsInputSchema},
  output: {schema: AnalyzeWeeklySentimentsOutputSchema},
  prompt: `You are an AI expert in sentiment analysis.
For each weekly recap summary provided below, analyze its overall sentiment.
Assign a score from 0 (none) to 10 (very strong) for positive, negative, and neutral sentiments for each week.
Use the recap title to help identify the week (e.g., if title is "Weekly Recap - 5/24/2025", you can use "Week of 5/24" or "Week 1" if it's the first in the list).

Recaps:
{{#each recapTexts}}
---
Week ID (for your reference, don't output): {{this.id}}
Week Title: {{this.title}}
Summary:
{{{this.summary}}}
---
{{/each}}

Output the results as an array of objects, each containing 'weekName', 'positive', 'negative', and 'neutral' scores.
Example for one week: { weekName: "Week of May 17", positive: 7, negative: 2, neutral: 5 }
`,
});

const analyzeWeeklySentimentsFlow = ai.defineFlow(
  {
    name: 'analyzeWeeklySentimentsFlow',
    inputSchema: AnalyzeWeeklySentimentsInputSchema,
    outputSchema: AnalyzeWeeklySentimentsOutputSchema,
  },
  async (input: AnalyzeWeeklySentimentsInput) => {
    if (input.recapTexts.length === 0) {
      return { trends: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
