// src/ai/core/reframe-thought-logic.ts
// This file does NOT use 'use server'. It contains reusable logic and definitions.

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; // Assuming z is from the main genkit export based on existing user code.
                          // If not, it might be from 'genkit/zod' or '@genkit-ai/zod'.

// Input Schema for the reframing logic/flow
export const ReframeThoughtInputSchema = z.object({
  thoughtToReframe: z.string().describe("The user's negative or unhelpful thought they want to examine."),
  conversationContext: z.string().optional().describe("Optional: Brief context of the conversation leading up to the reframing request."),
});
export type ReframeThoughtInput = z.infer<typeof ReframeThoughtInputSchema>;

// Output Schema for the reframing logic/flow
export const ReframeThoughtOutputSchema = z.object({
  originalThought: z.string().describe("The user's original thought that was reframed."),
  reframedThought: z.string().describe('A more balanced, constructive, or positive alternative thought.'),
  alternativePerspective: z.string().describe('A brief explanation or alternative way to view the situation related to the original thought.'),
  supportingEvidence: z.array(z.string()).describe('A few bullet points or pieces of evidence that support the reframed thought.'),
});
export type ReframeThoughtOutput = z.infer<typeof ReframeThoughtOutputSchema>;

// The actual logic implementation for reframing a thought
async function executeReframeThoughtLogic(input: ReframeThoughtInput): Promise<ReframeThoughtOutput> {
  const prompt = ai.definePrompt({
      name: 'reframeThoughtLogicPrompt', // Different name to avoid conflict if flow has same name
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

// Genkit Tool Definition, using the executeReframeThoughtLogic
export const reframeThoughtTool = ai.defineTool(
  {
    name: 'reframeThoughtTool',
    description: "Use this tool when the user explicitly asks for help to reframe a specific negative thought. For example, if they say 'Can you help me reframe the thought that I'm a failure?' or 'How can I think differently about X?' Only use this tool if the user's intent to reframe a specific thought is very clear.",
    inputSchema: z.object({ // Tool's input schema, can be slightly different from flow's if needed
        thought: z.string().describe("The negative thought the user wants to reframe."),
        currentConversationContext: z.string().optional().describe("Brief context of the current conversation to help tailor the reframing advice."),
    }),
    outputSchema: ReframeThoughtOutputSchema, // Tool's output schema
  },
  async (toolInput) => {
    // Map tool input to the logic function's input
    const logicInput: ReframeThoughtInput = {
      thoughtToReframe: toolInput.thought,
      conversationContext: toolInput.currentConversationContext,
    };
    return executeReframeThoughtLogic(logicInput);
  }
);

// Exporting the main logic function in case it needs to be called directly elsewhere (not as a Server Action from here)
export { executeReframeThoughtLogic };
