'use server';
/**
 * @fileOverview Server Action wrapper for the thought reframing logic.
 * This file uses 'use server' and should only export async functions and types.
 *
 * - reframeThoughtFlow - The Server Action to handle the thought reframing process.
 * - ReframeThoughtInput - The input type for the reframeThoughtFlow function.
 * - ReframeThoughtOutput - The return type for the reframeThoughtFlow function.
 */

import { 
  executeReframeThoughtLogic, 
  type ReframeThoughtInput, // Import type
  type ReframeThoughtOutput // Import type
} from '@/ai/core/reframe-thought-logic';

// Re-export types for convenience if they are part of this flow's public API
export type { ReframeThoughtInput, ReframeThoughtOutput };

// Exported async wrapper function to call the core logic
// This function can be imported and used as a Server Action.
export async function reframeThoughtFlow(input: ReframeThoughtInput): Promise<ReframeThoughtOutput> {
  return executeReframeThoughtLogic(input);
}
