
// src/ai/core/notebook-tool.ts
// This file does NOT use 'use server'. It contains reusable logic and definitions for notebook interaction.

import { z } from 'genkit';
import { db } from '@/lib/firebase'; // Assuming firebase is initialized here
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

// Input schema for the action/tool
export const SaveToNotebookInputSchema = z.object({
  contentToSave: z.string().min(1).describe("The content Mira should save to the user's notebook."),
  suggestedTitle: z.string().optional().describe("An optional title for the notebook entry. If not provided, a default will be used."),
});
export type SaveToNotebookInput = z.infer<typeof SaveToNotebookInputSchema>;

// Output schema for the action/tool
export const SaveToNotebookOutputSchema = z.object({
  success: z.boolean().describe("Whether the note was saved successfully."),
  message: z.string().describe("A confirmation or error message."),
  entryId: z.string().optional().describe("The ID of the newly created notebook entry if successful."),
});
export type SaveToNotebookOutput = z.infer<typeof SaveToNotebookOutputSchema>;

// The actual logic implementation for saving to the notebook
export async function saveToNotebookAction(
  input: SaveToNotebookInput,
  userId: string
): Promise<SaveToNotebookOutput> {
  if (!userId) {
    return { success: false, message: "User not authenticated." };
  }
  if (!input.contentToSave.trim()) {
    return { success: false, message: "Cannot save empty content to notebook." };
  }

  try {
    const todayDate = format(new Date(), 'MMM d, yyyy');
    const defaultTitle = input.suggestedTitle?.trim() || `Note from Mira - ${todayDate}`;
    
    const entryRef = await addDoc(collection(db, 'users', userId, 'notebookEntries'), {
      userId: userId,
      title: defaultTitle,
      content: input.contentToSave,
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: `Note titled "${defaultTitle}" saved successfully to your notebook.`,
      entryId: entryRef.id,
    };
  } catch (error: any) {
    console.error("Error saving to notebook:", error);
    return {
      success: false,
      message: `Failed to save note to notebook: ${error.message || 'Unknown error'}`,
    };
  }
}
    