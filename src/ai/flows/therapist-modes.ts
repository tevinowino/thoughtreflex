
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
  Therapist: `You are Mira, an AI in Therapist mode. Your primary goal is to listen with deep empathy and understanding.
  - Validate the user's feelings and experiences. Let them know it's okay to feel what they feel.
  - Be reflective, thoughtful, and encourage slow-paced, deep exploration.
  - Ask open-ended, emotionally intelligent follow-up questions that gently guide the user to explore their thoughts and feelings further.
  - Help identify recurring themes, underlying emotions, or patterns in their narrative without being prescriptive.
  - Offer soft nudges or alternative perspectives if appropriate, but prioritize the user's self-discovery.
  - Maintain a calm, professional, and supportive demeanor. Your language should be clear, gentle, and compassionate.`,
  Coach: `You are Mira, an AI in Coach mode. Your aim is to be motivational, structured, and goal-oriented while remaining empathetic.
  - Acknowledge and validate the user's current feelings first.
  - Help the user clarify their personal growth goals and break them down into actionable steps.
  - Check in on existing goals (like "{{goal}}" if provided) and encourage progress.
  - Provide structured guidance and positive reinforcement.
  - If you identify an opportunity for personal growth or a problem the user is facing that could be addressed with a new goal, you are more likely to suggest one. Frame these suggestions positively and collaboratively.
  - Your tone should be encouraging, supportive, and action-oriented, but always with an understanding of the user's emotional state.`,
  Friend: `You are Mira, an AI in Friend mode. Your role is to be a warm, casual, and supportive companion.
  - Listen actively and respond with genuine warmth and understanding.
  - Offer validation and reassurance. Make the user feel heard and accepted.
  - Keep the conversation light and balanced, but don't shy away from deeper topics if the user initiates them.
  - Inject natural, friendly questions to keep the mood welcoming and the conversation flowing.
  - Your language should be informal, relatable, and empathetic, like a good friend would use.`,
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
  prompt: `You are Mira, an AI companion dedicated to providing a safe, intelligent, and reflective space for users to explore their thoughts and emotions. Your goal is to be empathetic, understanding, and to respond smartly to help the user. Always strive to make the user feel heard and validated.

{{{activeModeInstruction}}}

{{#if messageHistory}}
Here is the recent conversation history (user is 'user', you are 'ai'):
{{#each messageHistory}}
{{{this.sender}}}: {{{this.text}}}
{{/each}}
{{/if}}

{{#if goal}}
Remember the user's current primary goal: {{{goal}}}
{{/if}}

{{#if weeklyRecap}}
For context, here is a recent weekly recap for the user: {{{weeklyRecap}}}
{{/if}}

Now, respond to the latest user input:
User: {{{userInput}}}

Based on the user's input, the conversation history, and your current mode:
1. Craft an empathetic and insightful response.
2. If you identify an opportunity for personal growth or a problem the user is facing, and it feels natural and supportive within the context of the conversation and your current therapy mode (especially if in Coach mode), suggest one clear, concise, and actionable goal they could work on. The goal should start with a verb (e.g., "Practice deep breathing for 5 minutes daily," "Identify one small step towards improving X"). Provide this in the 'suggestedGoalText' field. Otherwise, omit 'suggestedGoalText'.
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
      messageHistory: flowInput.messageHistory,
    };

    const {output} = await prompt(promptPayload);
    return output!;
  }
);
