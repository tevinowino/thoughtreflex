// src/components/app/chat-bubble.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Brain, PlusCircle, CheckCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Timestamp } from 'firebase/firestore';
import type { ReframeThoughtOutput } from '@/ai/core/reframe-thought-logic';
import SuggestionButtons from './suggestion-buttons';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Timestamp | Date;
  avatar?: string | null;
  name: string;
  suggestedGoalText?: string | null;
  isGoalAdded?: boolean;
  reframingData?: ReframeThoughtOutput | null;
  isReframingSaved?: boolean;
  suggestions?: string[] | null;
  suggestionSelected?: boolean;
  imageDataUri?: string; 
}

interface ChatBubbleProps {
  message: ChatMessage;
  currentUserId: string | undefined;
  currentUserDisplayName: string | null | undefined;
  currentUserPhotoURL: string | null | undefined;
  onAddSuggestedGoal: (messageId: string, goalText: string) => void;
  onSaveMindShift: (messageId: string, reframingData: ReframeThoughtOutput) => void;
  onSuggestionSelect: (messageId: string, suggestionText: string) => void;
  isLoadingAiResponse: boolean;
}

const ChatBubble = React.memo(({
  message,
  currentUserId,
  currentUserDisplayName,
  currentUserPhotoURL,
  onAddSuggestedGoal,
  onSaveMindShift,
  onSuggestionSelect,
  isLoadingAiResponse
}: ChatBubbleProps) => {
  const isUserMessage = message.sender === 'user';
  const timestamp = message.timestamp instanceof Date
    ? message.timestamp
    : new Date((message.timestamp as Timestamp)?.seconds * 1000);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'TR';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <motion.div
      key={message.id}
      layout // Added layout prop for smoother animations on change
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "group flex items-start gap-2 sm:gap-3 max-w-[90%] xs:max-w-[85%] sm:max-w-[75%] my-4",
        isUserMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 shadow-md border-2 border-background">
        <AvatarImage src={isUserMessage ? (currentUserPhotoURL || undefined) : (message.avatar || undefined)} alt={isUserMessage ? (currentUserDisplayName || "User") : "Mira"} />
        <AvatarFallback className={cn(
          "text-xs",
          isUserMessage
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary/20 text-primary'
        )}>
          {isUserMessage
            ? (getInitials(currentUserDisplayName) || <User className="h-4 w-4 sm:h-5 sm:w-5" />)
            : <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
          }
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1 w-full">
        <div
          className={cn(
            "px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md group-hover:shadow-xl transition-shadow duration-200 ease-in-out text-sm",
            isUserMessage
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-muted text-foreground rounded-bl-none'
          )}
        >
          {message.imageDataUri ? (
             <img 
                src={message.imageDataUri} 
                alt="AI generated visual prompt" 
                className="max-w-full h-auto rounded-lg my-2 border border-border shadow-sm" 
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          )}
          <p className={cn(
            "text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300",
            isUserMessage ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'
          )}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {!isUserMessage && message.suggestions && message.suggestions.length > 0 && !message.suggestionSelected && (
          <SuggestionButtons
            suggestions={message.suggestions}
            onSelect={(suggestion) => onSuggestionSelect(message.id, suggestion)}
            disabled={isLoadingAiResponse}
          />
        )}

        {!isUserMessage && message.suggestedGoalText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
            className="mt-2 pt-2 sm:pt-3 border border-primary/30 bg-accent/20 dark:bg-accent/10 p-2.5 sm:p-3 rounded-xl shadow-sm"
          >
            <p className="text-xs font-semibold text-primary/90 dark:text-primary/80 mb-1.5">Mira's Goal Suggestion:</p>
            <p className="text-xs sm:text-sm text-foreground/90 italic mb-2">"{message.suggestedGoalText}"</p>
            {!message.isGoalAdded ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-auto py-1 px-2 sm:py-1.5 sm:px-3 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => message.suggestedGoalText && onAddSuggestedGoal(message.id, message.suggestedGoalText)}
              >
                <PlusCircle className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Add this goal
              </Button>
            ) : (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center font-medium">
                <CheckCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Goal added!
              </p>
            )}
          </motion.div>
        )}

        {!isUserMessage && message.reframingData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
            className="mt-2 pt-2 sm:pt-3 border border-purple-500/30 bg-purple-500/10 dark:bg-purple-600/20 p-2.5 sm:p-3 rounded-xl shadow-sm"
          >
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1.5">Mira's Mind Shift Suggestion:</p>
            {!message.isReframingSaved ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-auto py-1 px-2 sm:py-1.5 sm:px-3 border-purple-500/50 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
                onClick={() => message.reframingData && onSaveMindShift(message.id, message.reframingData)}
              >
                <Save className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Save this Mind Shift
              </Button>
            ) : (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center font-medium">
                <CheckCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Mind Shift Saved!
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
ChatBubble.displayName = 'ChatBubble';

export default ChatBubble;
