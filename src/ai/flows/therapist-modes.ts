
'use server';

/**
 * @fileOverview Implements different AI "Therapist Modes" (Therapist, Coach, Friend) to match the user's preferred communication style.
 *
 * - getTherapistResponse - A function that returns a response based on the selected therapist mode.
 * - TherapistModeInput - The input type for the getTherapistResponse function.
 * - TherapistModeOutput - The return type for the getTherapistResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TherapistModeInputSchema = z.object({
  userInput: z.string().describe('The user input to be processed.'),
  mode: z
    .enum(['Therapist', 'Coach', 'Friend'])
    .describe('The selected therapist mode.'),
  weeklyRecap: z.string().optional().describe('A summary of the user’s week.'),
  goal: z.string().optional().describe('The user specified goal.'),
});
export type TherapistModeInput = z.infer<typeof TherapistModeInputSchema>;

const TherapistModeOutputSchema = z.object({
  response: z.string().describe('The AI therapist response.'),
});
export type TherapistModeOutput = z.infer<typeof TherapistModeOutputSchema>;

// Define mode-specific instructions
const therapistInstructions = {
  Therapist: `You are in Therapist mode. Be reflective, deep, and slow in your responses. Ask emotionally intelligent follow-up questions. Identify recurring themes and give soft nudges.`,
  Coach: `You are in Coach mode. Be motivational and structured in your responses. Check in on the user's goals and encourage progress.`,
  Friend: `You are in Friend mode. Be casual, warm, and conversational in your responses. Inject light questions to keep the mood balanced and welcoming.`,
};

// Internal schema for the prompt, including the pre-selected instruction
const TherapistModePromptInternalInputSchema = z.object({
  userInput: z.string().describe('The user input to be processed.'),
  mode: z.enum(['Therapist', 'Coach', 'Friend']).describe('The selected therapist mode (for context).'),
  weeklyRecap: z.string().optional().describe('A summary of the user’s week.'),
  goal: z.string().optional().describe('The user specified goal.'),
  activeModeInstruction: z.string().describe('The specific instruction for the current AI mode.')
});

export async function getTherapistResponse(
  input: TherapistModeInput
): Promise<TherapistModeOutput> {
  return therapistModeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'therapistModePrompt',
  input: {schema: TherapistModePromptInternalInputSchema}, // Use the new internal schema
  output: {schema: TherapistModeOutputSchema},
  prompt: `You are an AI therapist. Respond to the user input based on the selected mode.

User Input: {{{userInput}}}
Selected Mode: {{{mode}}}

{{#if weeklyRecap}}
Weekly Recap: {{{weeklyRecap}}}
{{/if}}

{{#if goal}}
User Goal: {{{goal}}}
{{/if}}

{{{activeModeInstruction}}}
`,
});

const therapistModeFlow = ai.defineFlow(
  {
    name: 'therapistModeFlow',
    inputSchema: TherapistModeInputSchema, // Flow's public input schema
    outputSchema: TherapistModeOutputSchema,
  },
  async (flowInput: TherapistModeInput) => {
    const instruction = therapistInstructions[flowInput.mode];
    
    const promptPayload = {
      userInput: flowInput.userInput,
      mode: flowInput.mode, // Pass mode for context if needed in prompt (e.g., "Mode: {{{mode}}}")
      weeklyRecap: flowInput.weeklyRecap,
      goal: flowInput.goal,
      activeModeInstruction: instruction, // Pass the selected instruction
    };

    const {output} = await prompt(promptPayload);
    return output!;
  }
);
