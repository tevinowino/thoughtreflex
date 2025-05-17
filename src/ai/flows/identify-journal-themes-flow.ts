
'use server';
/**
 * @fileOverview Identifies recurring themes from a collection of journal entries.
 *
 * - identifyJournalThemes - A function that processes journal entries to find common themes.
 * - IdentifyJournalThemesInput - The input type for the identifyJournalThemes function.
 * - IdentifyJournalThemesOutput - The return type for the identifyJournalThemes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ThemeSchema = z.object({
  theme: z.string().describe('The identified recurring theme (e.g., "Work Stress", "Relationships", "Self-Care").'),
  mentions: z.number().describe('The number of times this theme was mentioned or inferred.'),
  // Sentiment analysis per theme is complex; omitting for initial version.
  // sentiment: z.number().optional().describe('Overall sentiment score for this theme (-1 to 1, optional).')
});

const IdentifyJournalThemesInputSchema = z.object({
  journalEntriesText: z.string().describe('A single string containing concatenated text of multiple journal entries over a period.'),
  maxThemes: z.number().optional().default(5).describe('Maximum number of top themes to identify.'),
});
export type IdentifyJournalThemesInput = z.infer<typeof IdentifyJournalThemesInputSchema>;

const IdentifyJournalThemesOutputSchema = z.object({
  themes: z.array(ThemeSchema).describe('An array of identified recurring themes with their mention counts.'),
});
export type IdentifyJournalThemesOutput = z.infer<typeof IdentifyJournalThemesOutputSchema>;

export async function identifyJournalThemes(input: IdentifyJournalThemesInput): Promise<IdentifyJournalThemesOutput> {
  return identifyJournalThemesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyJournalThemesPrompt',
  input: {schema: IdentifyJournalThemesInputSchema},
  output: {schema: IdentifyJournalThemesOutputSchema},
  prompt: `You are an AI expert in text analysis and theme identification from personal journals.
Analyze the provided journal entries to identify up to {{{maxThemes}}} recurring themes or topics.
For each theme, count how many times it is mentioned or strongly implied.
Do not list very generic themes like "feelings" or "thoughts". Focus on more specific topics like "Anxiety about future", "Conflict with family", "Excitement for new project", "Practicing mindfulness".

Journal Entries Text:
{{{journalEntriesText}}}

Output the results as an array of theme objects.
`,
});

const identifyJournalThemesFlow = ai.defineFlow(
  {
    name: 'identifyJournalThemesFlow',
    inputSchema: IdentifyJournalThemesInputSchema,
    outputSchema: IdentifyJournalThemesOutputSchema,
  },
  async (input: IdentifyJournalThemesInput) => {
    if (!input.journalEntriesText.trim()) {
        return { themes: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
