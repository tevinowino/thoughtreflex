
// src/ai/flows/generate-daily-topic-content-flow.ts
'use server';
/**
 * @fileOverview AI flow to generate content for the Daily Guided Topic feature.
 *
 * - generateDailyTopicContent - Generates a topic name, intro, scale questions, and score-based responses.
 * - GenerateDailyTopicContentInput - Input type, including optional user context.
 * - GenerateDailyTopicContentOutput - Output type, the structured daily topic content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  GenerateDailyTopicContentInputSchema,
  GenerateDailyTopicContentOutputSchema,
  type GenerateDailyTopicContentInput, // Import type
  type GenerateDailyTopicContentOutput // Import type
} from '@/ai/core/daily-topic-content-schemas';

export type { GenerateDailyTopicContentInput, GenerateDailyTopicContentOutput };

export async function generateDailyTopicContent(input: GenerateDailyTopicContentInput): Promise<GenerateDailyTopicContentOutput> {
  return generateDailyTopicContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyTopicContentPrompt',
  input: {schema: GenerateDailyTopicContentInputSchema},
  output: {schema: GenerateDailyTopicContentOutputSchema},
  prompt: `You are Mira, an empathetic AI therapist and content creator specializing in mental wellness and healing.
Your task is to generate the full content for a Daily Guided Topic.

Context:
{{#if userName}}User's Name: {{userName}}{{/if}}
{{#if detectedUserIssues.length}}
Previously detected user themes/issues: {{#each detectedUserIssues}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
If these issues are specific (e.g., 'childhood trauma', 'body image concerns'), try to generate a topic that gently relates to or supports healing in that area.
If issues are general (e.g., 'stress', 'anxiety') or not provided, choose a broad but highly relevant mental wellness theme.
{{else}}
No specific user issues detected. Please choose a general but impactful mental wellness or healing topic.
{{/if}}

Topic Generation Guidelines:
1.  **Topic Selection**:
    *   If specific detectedUserIssues are provided, select a topic that is relevant and supportive for one of those issues. Examples:
        *   If "childhood trauma" is an issue: "Understanding Your Past, Empowering Your Present" or "Gentle Steps in Healing Early Wounds."
        *   If "body image": "Cultivating Self-Acceptance: Your Body, Your Ally."
        *   If "relationship anxiety": "Building Secure Connections."
    *   If no specific issues, choose a general mental wellness topic. Examples: "Finding Moments of Gratitude," "Building Resilience to Stress," "The Power of Self-Compassion," "Nurturing Healthy Boundaries," "Exploring Your Core Values," "Practicing Mindfulness in Daily Life."
    *   Avoid overly clinical or jargon-heavy topic names. Keep it inviting.
2.  **topicName**: A concise and engaging name for the topic (3-7 words).
3.  **introduction**: A warm, empathetic introduction from Mira (2-3 sentences) explaining the topic and its importance, inviting the user to reflect.
4.  **scaleQuestions**: Generate exactly 3 to 5 unique scale-based questions.
    *   Each question should have an id (e.g., "q1", "q2", "q3").
    *   The text should be a statement the user rates on a 1-5 scale (e.g., "I feel confident in expressing my needs to others.").
    *   Optionally, set reverseScore: true if a lower numerical score (e.g., 1 or 2) actually indicates a more positive or healthier stance for that specific question.
5.  **scoreRanges**: Based on the aggregate score from the scale questions (assume 1-5 per question, so for 3 questions, total score is 3-15; for 5 questions, total 5-25).
    *   **Low Range**: Define what constitutes a "low" score range. Provide a miraResponse (empathetic reflection for users scoring low), a journalPrompt (specific prompt tailored to their experience), and an optional resourceSuggestion (a small, actionable tip).
    *   **Medium Range**: Define "medium" score range. Provide miraResponse, journalPrompt, and optional resourceSuggestion.
    *   **High Range**: Define "high" score range. Provide miraResponse, journalPrompt, and optional resourceSuggestion.
    *   Mira's responses for score ranges should be distinct, validating, and offer constructive next steps or reflections.
6.  **generalResource** (Optional): If applicable, provide a text description and an optional link (URL) to a general resource (e.g., a well-known website, a type of meditation to search for).

Ensure your output strictly adheres to the JSON schema for GenerateDailyTopicContentOutput.
The AI should generate varied topics and questions each time, even if user context is similar, to keep it fresh.
Focus on being supportive, insightful, and practical.
Example question id format: "q1_selfworth", "q2_boundaries". Make them unique.
`,
});

const generateDailyTopicContentFlow = ai.defineFlow(
  {
    name: 'generateDailyTopicContentFlow',
    inputSchema: GenerateDailyTopicContentInputSchema,
    outputSchema: GenerateDailyTopicContentOutputSchema,
  },
  async (input: GenerateDailyTopicContentInput) => {
    const {output} = await prompt(input);
    if (!output) {
      // Fallback logic if AI fails to generate a complete topic
      console.error("AI failed to generate daily topic content. Using fallback.");
      return {
        topicName: "Moment of Reflection",
        introduction: "Welcome! Let's take a moment to check in with yourself. How are you feeling today?",
        scaleQuestions: [
          { id: 'q1_fallback', text: "I feel generally content with my current emotional state." },
          { id: 'q2_fallback', text: "I am able to manage stress effectively most of the time." },
          { id: 'q3_fallback', text: "I feel connected to my inner self." },
        ],
        scoreRanges: {
          low: { miraResponse: "It sounds like things might be a bit tough right now, and that's okay. Recognizing it is the first step.", journalPrompt: "What's one small thing you could do today to offer yourself a moment of comfort or kindness?", resourceSuggestion: "Try a 2-minute breathing exercise." },
          medium: { miraResponse: "It seems you're navigating things with some awareness. That's a good place to be. What feels most present for you?", journalPrompt: "What's one area you're doing well in, and one area you'd like to give a little more attention to?", resourceSuggestion: "Consider a short walk to clear your head." },
          high: { miraResponse: "It's wonderful that you're feeling well-connected and managing things effectively! What's contributing to this positive state?", journalPrompt: "How can you continue to nurture this positive state? What's one way you can share this positive energy with others or use it to further your goals?", resourceSuggestion: "Reflect on one success from the past week and how you achieved it." }
        },
      };
    }
    return output;
  }
);
