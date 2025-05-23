
// src/ai/flows/save-to-notebook-flow.ts
'use server';
/**
 * @fileOverview Server Action wrapper for saving content to the user's notebook.
 * This file uses 'use server' and should only export async functions and types.
 *
 * - saveToNotebookFlow - The Server Action to handle saving to the notebook.
 */

import { auth } from '@/lib/firebase'; // For getting current user
import { 
  saveToNotebookAction,
  SaveToNotebookInputSchema, // Import Zod schema for tool definition
  SaveToNotebookOutputSchema, // Import Zod schema for tool definition
  type SaveToNotebookInput,    // Import TypeScript type
  type SaveToNotebookOutput    // Import TypeScript type
} from '@/ai/core/notebook-tool';
import { ai } from '@/ai/genkit'; // For defining the tool if we were to do it here (but tool is in core)

// Re-export types for convenience if they are part of this flow's public API
export type { SaveToNotebookInput, SaveToNotebookOutput };

// Exported async wrapper function to call the core logic
// This function will be used by the Genkit tool defined in therapist-modes.ts
export async function saveToNotebookFlow(input: SaveToNotebookInput): Promise<SaveToNotebookOutput> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // This check should ideally be handled by Firebase security rules for Firestore access,
    // but it's good to have a server-side check too.
    // The tool itself shouldn't be invokable if the user isn't authenticated
    // and the flow is called from a user-specific context.
    return { success: false, message: "User not authenticated. Cannot save to notebook." };
  }
  return saveToNotebookAction(input, currentUser.uid);
}
    