// src/ai/core/affirmation-schemas.ts
// This file does NOT use 'use server'. It contains reusable schema definitions.
import {z} from 'genkit';

export const GenerateDailyAffirmationOutputSchema = z.object({
  affirmation: z.string().describe("A short, uplifting, and reassuring daily affirmation (1-2 sentences)."),
});

// We can also export the inferred TypeScript type from here if preferred
// export type GenerateDailyAffirmationOutput = z.infer<typeof GenerateDailyAffirmationOutputSchema>;
