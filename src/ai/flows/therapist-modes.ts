
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

// Simplified Message type for AI flow context
const AiChatMessageSchema = z.object({
  sender: z.enum(['user', 'ai']),
  text: z.string(),
});
type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

const TherapistModeInputSchema = z.object({
  userInput: z.string().describe('The user input to be processed.'),
  mode: z
    .enum(['Therapist', 'Coach', 'Friend'])
    .describe('The selected therapist mode.'),
  weeklyRecap: z.string().optional().describe('A summary of the user’s week.'),
  goal: z.string().optional().describe('The user specified goal.'),
  messageHistory: z.array(AiChatMessageSchema).optional().describe('The history of messages in the current session.')
});
export type TherapistModeInput = z.infer<typeof TherapistModeInputSchema>;

const TherapistModeOutputSchema = z.object({
  response: z.string().describe('The AI therapist response.'),
  suggestedGoalText: z.string().optional().describe('A concrete, actionable goal suggested to the user based on their entry, if appropriate. The goal should be concise and start with a verb.'),
});
export type TherapistModeOutput = z.infer<typeof TherapistModeOutputSchema>;

// Define mode-specific instructions
const therapistInstructions = {
  Therapist: `You are in Therapist mode. Be reflective, deep, and slow in your responses. Ask emotionally intelligent follow-up questions. Identify recurring themes and give soft nudges.`,
  Coach: `You are in Coach mode. Be motivational and structured in your responses. Check in on the user's goals and encourage progress. If you identify an opportunity for personal growth or a problem the user is facing that could be addressed with a goal, you are more likely to suggest one.`,
  Friend: `You are in Friend mode. Be casual, warm, and conversational in your responses. Inject light questions to keep the mood balanced and welcoming.`,
};

// Internal schema for the prompt, including the pre-selected instruction and message history
const TherapistModePromptInternalInputSchema = z.object({
  userInput: z.string().describe('The user input to be processed.'),
  mode: z.enum(['Therapist', 'Coach', 'Friend']).describe('The selected therapist mode (for context).'),
  weeklyRecap: z.string().optional().describe('A summary of the user’s week.'),
  goal: z.string().optional().describe('The user specified goal.'),
  activeModeInstruction: z.string().describe('The specific instruction for the current AI mode.'),
  messageHistory: z.array(AiChatMessageSchema).optional().describe('The history of messages in the current session.')
});

export async function getTherapistResponse(
  input: TherapistModeInput
): Promise<TherapistModeOutput> {
  return therapistModeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'therapistModePrompt',
  input: {schema: TherapistModePromptInternalInputSchema}, 
  output: {schema: TherapistModeOutputSchema},
  prompt: `{{{activeModeInstruction}}}

{{#if messageHistory}}
Here is the recent conversation history:
{{#each messageHistory}}
{{{this.sender}}}: {{{this.text}}}
{{/each}}
{{/if}}

{{#if goal}}
Remember the user's current goal: {{{goal}}}
{{/if}}

{{#if weeklyRecap}}
Also, consider this weekly recap: {{{weeklyRecap}}}
{{/if}}

Now, respond to the latest user input:
User: {{{userInput}}}

Based on the user's input and the conversation history, if you identify an opportunity for personal growth or a problem the user is facing, suggest one clear, concise, and actionable goal they could work on. The goal should start with a verb (e.g., "Practice deep breathing for 5 minutes daily", "Identify one small step towards improving X"). Only suggest a goal if it feels natural and supportive within the context of the conversation and the current therapy mode (especially if in Coach mode). If suggesting a goal, provide it in the 'suggestedGoalText' field. Otherwise, omit 'suggestedGoalText' or leave it empty.
`,
});

const therapistModeFlow = ai.defineFlow(
  {
    name: 'therapistModeFlow',
    inputSchema: TherapistModeInputSchema, 
    outputSchema: TherapistModeOutputSchema,
  },
  async (flowInput: TherapistModeInput) => {
    const instruction = therapistInstructions[flowInput.mode];
    
    const promptPayload = {
      userInput: flowInput.userInput,
      mode: flowInput.mode, 
      weeklyRecap: flowInput.weeklyRecap,
      goal: flowInput.goal,
      activeModeInstruction: instruction,
      messageHistory: flowInput.messageHistory, // Pass the message history
    };

    const {output} = await prompt(promptPayload);
    return output!;
  }
);

    
