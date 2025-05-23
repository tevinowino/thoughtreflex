
import { config } from 'dotenv';
config();

import '@/ai/flows/weekly-ai-recap.ts';
import '@/ai/flows/dynamic-ai-responses.ts';
import '@/ai/flows/therapist-modes.ts';
import '@/ai/flows/analyze-weekly-sentiments-flow.ts';
import '@/ai/flows/identify-journal-themes-flow.ts';
import '@/ai/flows/generate-personalized-suggestions-flow.ts';
import '@/ai/core/reframe-thought-logic.ts'; 
import '@/ai/flows/reframe-thought-flow.ts';
import '@/ai/core/affirmation-schemas.ts'; 
import '@/ai/flows/generate-affirmation-flow.ts';
import '@/ai/core/checkin-prompt-schemas.ts';
import '@/ai/flows/generate-checkin-prompt-flow.ts';
import '@/ai/core/daily-topic-content-schemas.ts'; 
import '@/ai/flows/generate-daily-topic-content-flow.ts'; 
import '@/ai/core/notebook-tool.ts'; 
import '@/ai/flows/save-to-notebook-flow.ts';
    