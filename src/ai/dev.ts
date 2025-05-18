
import { config } from 'dotenv';
config();

import '@/ai/flows/weekly-ai-recap.ts';
import '@/ai/flows/dynamic-ai-responses.ts';
import '@/ai/flows/therapist-modes.ts';
import '@/ai/flows/analyze-weekly-sentiments-flow.ts';
import '@/ai/flows/identify-journal-themes-flow.ts';
import '@/ai/flows/generate-personalized-suggestions-flow.ts';
import '@/ai/core/reframe-thought-logic.ts'; // Not a flow, but ensure it's part of build if referenced elsewhere.
import '@/ai/flows/reframe-thought-flow.ts';
import '@/ai/flows/generate-affirmation-flow.ts'; // Added new flow

