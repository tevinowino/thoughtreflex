
'use server';
/**
 * @fileOverview Provides a Genkit tool and flow for reframing negative thoughts.
 *
 * - reframeThoughtFlow - A function that handles the thought reframing process.
 * - ReframeThoughtInputSchema - The input type for the reframeThoughtFlow function.
 * - ReframeThoughtOutputSchema - The return type for the reframeThoughtFlow function.
 * - reframeThoughtTool - A Genkit tool that can be used by other flows to reframe thoughts.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const ReframeThoughtInputSchema = z.object({
  thoughtToReframe: z.string().describe("The user's negative or unhelpful thought they want to examine."),
  conversationContext: z.string().optional().describe("Optional: Brief context of the conversation leading up to the reframing request."),
});
export type ReframeThoughtInput = z.infer<typeof ReframeThoughtInputSchema>;

export const ReframeThoughtOutputSchema = z.object({
  originalThought: z.string().describe("The user's original thought that was reframed."),
  reframedThought: z.string().describe('A more balanced, constructive, or positive alternative thought.'),
  alternativePerspective: z.string().describe('A brief explanation or alternative way to view the situation related to the original thought.'),
  supportingEvidence: z.array(z.string()).describe('A few bullet points or pieces of evidence that support the reframed thought.'),
});
export type ReframeThoughtOutput = z.infer<typeof ReframeThoughtOutputSchema>;

// The actual flow implementation
const reframeThoughtFlowInternal = ai.defineFlow(
  {
    name: 'reframeThoughtFlowInternal',
    inputSchema: ReframeThoughtInputSchema,
    outputSchema: ReframeThoughtOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
        name: 'reframeThoughtPrompt',
        input: { schema: ReframeThoughtInputSchema },
        output: { schema: ReframeThoughtOutputSchema },
        prompt: `You are Mira, an AI specializing in Cognitive Restructuring, a technique from Cognitive Behavioral Therapy (CBT).
Your goal is to help the user reframe their negative or unhelpful thought into a more balanced, constructive, or positive one.

User's original thought: "{{thoughtToReframe}}"
{{#if conversationContext}}
Conversation context: "{{conversationContext}}"
{{/if}}

1.  **Acknowledge and Validate**: Briefly acknowledge the user's thought.
2.  **Identify Cognitive Distortions (Internal Step - do not explicitly state to user unless directly relevant to reframe)**: Consider common cognitive distortions (e.g., all-or-nothing thinking, overgeneralization, mental filter, catastrophizing) that might be present in the original thought.
3.  **Challenge the Thought (Internal Step)**: Guide the user to question the validity and utility of the thought.
4.  **Generate a Reframed Thought**: Formulate a more balanced, realistic, and helpful alternative thought. This should be positive or neutral, and actionable if possible.
5.  **Provide an Alternative Perspective**: Offer a short (1-2 sentences) explanation of why this reframed thought might be a more helpful way to look at the situation.
6.  **Offer Supporting Evidence/Points**: Provide 2-3 bullet points or short statements that support the reframed thought or help the user adopt it. These should be concrete and encouraging.

Example:
Original Thought: "I failed the test, so I'm a complete failure at everything."
Reframed Thought: "Failing one test doesn't make me a complete failure. It means I struggled with this specific material or test, and I can learn from it."
Alternative Perspective: "It's common to equate one setback with overall failure, but this view is often too harsh. Focusing on learning and specific areas for improvement is more constructive."
Supporting Evidence:
- "You've succeeded in other areas of your life or studies before."
- "This test is just one data point, not a definition of your worth or capabilities."
- "You can identify what went wrong and prepare differently next time."

Ensure your output strictly follows the ReframeThoughtOutputSchema. The 'originalThought' field in the output should be the same as the 'thoughtToReframe' from the input.
Focus on being empathetic, constructive, and clear.
`,
    });

    const { output } = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate a reframing response.");
    }
    // Ensure the original thought is correctly passed through
    return {
        ...output,
        originalThought: input.thoughtToReframe,
    };
  }
);

// Exported function to call the flow
export async function reframeThoughtFlow(input: ReframeThoughtInput): Promise<ReframeThoughtOutput> {
  return reframeThoughtFlowInternal(input);
}

// Genkit Tool Definition
export const reframeThoughtTool = ai.defineTool(
  {
    name: 'reframeThoughtTool',
    description: "Use this tool when the user explicitly asks for help to reframe a specific negative thought. For example, if they say 'Can you help me reframe the thought that I'm a failure?' or 'How can I think differently about X?' Only use this tool if the user's intent to reframe a specific thought is very clear.",
    inputSchema: z.object({
        thought: z.string().describe("The negative thought the user wants to reframe."),
        currentConversationContext: z.string().optional().describe("Brief context of the current conversation to help tailor the reframing advice."),
    }),
    outputSchema: ReframeThoughtOutputSchema,
  },
  async (toolInput) => {
    // Map tool input to flow input
    const flowInput: ReframeThoughtInput = {
      thoughtToReframe: toolInput.thought,
      conversationContext: toolInput.currentConversationContext,
    };
    return reframeThoughtFlowInternal(flowInput);
  }
);
