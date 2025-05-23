// src/components/app/suggestion-buttons.tsx
'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface SuggestionButtonsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export default function SuggestionButtons({ suggestions, onSelect, disabled = false }: SuggestionButtonsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div 
      className="flex flex-wrap gap-2 mt-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-auto py-1.5 px-3 bg-background hover:bg-muted/80 border-primary/30 text-primary hover:text-primary/90 shadow-sm"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            aria-label={`Select suggestion: ${suggestion}`}
          >
            {suggestion}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}
