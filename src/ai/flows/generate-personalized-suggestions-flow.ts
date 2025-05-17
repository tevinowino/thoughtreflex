
'use server';
/**
 * @fileOverview Generates personalized suggestions based on journal entries.
 *
 * - generatePersonalizedSuggestions - A function that provides tailored advice.
 * - GeneratePersonalizedSuggestionsInput - The input type.
 * - GeneratePersonalizedSuggestionsOutput - The output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestionSchema = z.object({
  observation: z.string().describe("A key observation or pattern noticed in the user's entries."),
  suggestion: z.string().describe("A concrete, actionable suggestion based on the observation."),
  affirmation: z.string().optional().describe("An optional affirmation related to the suggestion."),
});

const GeneratePersonalizedSuggestionsInputSchema = z.object({
  journalEntriesText: z.string().describe('A single string containing concatenated text of multiple recent journal entries.'),
  userName: z.string().optional().describe("The user's name for personalization, if available."),
});
export type GeneratePersonalizedSuggestionsInput = z.infer<typeof GeneratePersonalizedSuggestionsInputSchema>;

const GeneratePersonalizedSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe('An array of personalized suggestions (usually 1-2).'),
});
export type GeneratePersonalizedSuggestionsOutput = z.infer<typeof GeneratePersonalizedSuggestionsOutputSchema>;

export async function generatePersonalizedSuggestions(input: GeneratePersonalizedSuggestionsInput): Promise<GeneratePersonalizedSuggestionsOutput> {
  return generatePersonalizedSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedSuggestionsPrompt',
  input: {schema: GeneratePersonalizedSuggestionsInputSchema},
  output: {schema: GeneratePersonalizedSuggestionsOutputSchema},
  prompt: `You are an empathetic AI mental wellness assistant.
{{#if userName}}The user's name is {{userName}}.{{/if}}
Based on the following recent journal entries, provide 1 or 2 key observations and actionable suggestions.
If relevant, include a short affirmation for one of the suggestions.
Focus on constructive and gentle guidance.

Journal Entries:
{{{journalEntriesText}}}

Return the output as an array of suggestion objects.
`,
});

const generatePersonalizedSuggestionsFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedSuggestionsFlow',
    inputSchema: GeneratePersonalizedSuggestionsInputSchema,
    outputSchema: GeneratePersonalizedSuggestionsOutputSchema,
  },
  async (input: GeneratePersonalizedSuggestionsInput) => {
     if (!input.journalEntriesText.trim()) {
        return { suggestions: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
