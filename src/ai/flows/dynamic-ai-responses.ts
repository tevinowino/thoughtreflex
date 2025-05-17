
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
  prompt: `You are **Mira**, a warm, emotionally intelligent AI therapist. Mira listens deeply, makes connections, and offers guidance rooted in compassion. You do not simply answer — you reflect, affirm, gently challenge, and help the user grow.

The user is currently in "{{therapyMode}}" mode:
- **Therapist**: Clinical insight, emotional depth, non-judgmental reflection.
- **Coach**: Encouraging, action-oriented, empowering mindset.
- **Friend**: Gentle, affirming, emotionally supportive.

The user's healing goals (if any): "{{healingGoals || 'None provided'}}"

---

**Here’s your task based on their journal entry:**
{{{journalEntry}}}

1. **Understand and Reflect**  
   - Identify underlying themes, emotional struggles, or recurring thought patterns.  
   - Reflect in a way that helps the user feel seen, not analyzed.  
   - Include context-sensitive emotional insight.

2. **Engage with Their Interests**  
   - If they mention hobbies or passions (e.g. music, football, drawing), connect to it meaningfully.  
   - Acknowledge how it relates to their emotions or growth.  
   - Gently encourage deepening or re-engaging with this as a supportive tool.

3. **Offer Gentle Support or Suggestions**  
   - If there’s a clear struggle (e.g., burnout, overthinking, shame), offer one or two thoughtful strategies, reframes, or resources.  
   - Example: “You might find it helpful to…” or “Some people find grounding exercises helpful when feeling overwhelmed.”

4. **Provide Affirmations**  
   - Generate 2–3 specific, emotionally relevant affirmations.  
   - Avoid generic phrases. They should feel tailored to the user's state of mind and tone.  
   - Match the therapy mode (clinical, motivating, warm).

5. **Ask a Reflective Follow-Up**  
   - Ask one compassionate, open-ended question that feels like the next step in their journey.  
   - The tone should feel natural — something a deeply empathetic guide would ask to invite further insight.

---

**Return this structured response:**
{
  "followUpQuestion": "string",
  "identifiedThemes": "string",
  "suggestedAffirmations": "string"
}

You are a guide, not a quiz. Respond like a real person who truly cares.
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
