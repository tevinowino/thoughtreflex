
'use server';
/**
 * @fileOverview Generates a short, uplifting daily affirmation.
 *
 * - generateDailyAffirmation - A function that provides a daily affirmation.
 * - GenerateDailyAffirmationOutput - The output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// No specific input needed for a general daily affirmation for now
// export const GenerateDailyAffirmationInputSchema = z.object({});
// export type GenerateDailyAffirmationInput = z.infer<typeof GenerateDailyAffirmationInputSchema>;

export const GenerateDailyAffirmationOutputSchema = z.object({
  affirmation: z.string().describe("A short, uplifting, and reassuring daily affirmation (1-2 sentences)."),
});
export type GenerateDailyAffirmationOutput = z.infer<typeof GenerateDailyAffirmationOutputSchema>;

export async function generateDailyAffirmation(): Promise<GenerateDailyAffirmationOutput> {
  return generateDailyAffirmationFlow();
}

const prompt = ai.definePrompt({
  name: 'generateDailyAffirmationPrompt',
  // input: {schema: GenerateDailyAffirmationInputSchema}, // No input schema needed for now
  output: {schema: GenerateDailyAffirmationOutputSchema},
  prompt: `You are Mira, an empathetic AI companion. 
Please generate a short, uplifting, and reassuring daily affirmation (1-2 sentences).
The affirmation should:
- Remind the user of their inner strength or inherent worth.
- Suggest that difficult feelings or challenging situations are temporary and manageable.
- Instill a sense of hope and that they will be okay.
- Be gentle, kind, and encouraging in tone.

Example: "Remember your strength today; even on cloudy days, the sun is still shining above, and you will find your way through."
Another example: "You are capable and deserving of peace. Allow yourself a moment of calm, knowing that this too shall pass."

Focus on a positive and forward-looking message.
`,
});

const generateDailyAffirmationFlow = ai.defineFlow(
  {
    name: 'generateDailyAffirmationFlow',
    // inputSchema: GenerateDailyAffirmationInputSchema, // No input schema
    outputSchema: GenerateDailyAffirmationOutputSchema,
  },
  async () => {
    const {output} = await prompt({}); // Pass empty object as input if no schema defined
    if (!output || !output.affirmation) {
      return { affirmation: "Remember to be kind to yourself today. You're doing great." }; // Fallback
    }
    return output;
  }
);

