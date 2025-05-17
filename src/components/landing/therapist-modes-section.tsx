// src/components/landing/therapist-modes-section.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Smile, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Mode {
  name: 'Therapist' | 'Coach' | 'Friend';
  icon: JSX.Element;
  description: string;
  examplePrompt: string;
  exampleResponse: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const modes: Mode[] = [
  {
    name: 'Therapist',
    icon: <Brain className="h-5 w-5" />,
    description: 'Reflective, deep, and slow. Focuses on understanding underlying emotions and patterns.',
    examplePrompt: "I've been feeling overwhelmed with work lately.",
    exampleResponse: "It sounds like work has been quite demanding. Can you tell me more about what 'overwhelmed' feels like for you in those moments?",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-500/30",
  },
  {
    name: 'Coach',
    icon: <Zap className="h-5 w-5" />,
    description: 'Motivational and structured. Helps you set goals and encourages progress.',
    examplePrompt: "I want to be more confident.",
    exampleResponse: "That's a great goal! What's one small step you could take this week to practice confidence in a low-stakes situation?",
    bgColor: "bg-green-500/10",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-500/30",
  },
  {
    name: 'Friend',
    icon: <Smile className="h-5 w-5" />,
    description: 'Casual, warm, and conversational. Offers a supportive and light-hearted chat.',
    examplePrompt: "Just had a long day, needed to vent.",
    exampleResponse: "Oh no, long days are the worst! Grab a cup of tea (or your comfort drink of choice) and tell me all about it. I'm here to listen.",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-700 dark:text-yellow-500",
    borderColor: "border-yellow-500/30",
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 }
  },
};

const cardContentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } },
};

export function TherapistModesSection() {
  const [selectedMode, setSelectedMode] = useState<Mode>(modes[0]);

  return (
    <section id="therapist-modes" className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <motion.div 
          className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={sectionVariants}
        >
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary font-medium shadow-sm">Personalized Support</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Mira Adapts to Your Needs
          </h2>
          <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Choose the AI communication style that feels right for you at any moment.
          </p>
        </motion.div>
        
        <motion.div 
          className="flex justify-center gap-2 sm:gap-3 mb-10 flex-wrap"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={sectionVariants}
        >
          {modes.map((mode, index) => (
             <motion.div key={mode.name} custom={index} variants={sectionVariants}>
                <Button
                variant={selectedMode.name === mode.name ? 'default' : 'outline'}
                onClick={() => setSelectedMode(mode)}
                className="shadow-md transition-all duration-200 ease-in-out hover:shadow-lg flex items-center gap-2 px-4 py-2 text-sm sm:px-6 sm:py-2.5"
                >
                {mode.icon}
                {mode.name}
                </Button>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <Card className={`w-full max-w-2xl mx-auto shadow-xl rounded-2xl overflow-hidden border-2 ${selectedMode.borderColor}`}>
            <CardHeader className={`p-6 ${selectedMode.bgColor}`}>
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-full ${selectedMode.bgColor} border ${selectedMode.borderColor}`}>
                    {React.cloneElement(selectedMode.icon, { className: `h-6 w-6 ${selectedMode.textColor}`})}
                </span>
                <CardTitle className={`text-2xl font-semibold ${selectedMode.textColor}`}>{selectedMode.name} Mode</CardTitle>
              </div>
              <CardDescription className="text-foreground/80 pt-2">{selectedMode.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-card">
              <h4 className="font-semibold text-foreground text-lg mb-1">Example Interaction:</h4>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedMode.name} // Key change triggers animation
                  variants={cardContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-3"
                >
                  <div className="border-l-4 border-primary/50 pl-4 py-2 bg-primary/5 rounded-md">
                    <p className="font-medium text-primary/90 flex items-center gap-2"><MessageCircle className="h-4 w-4"/>You:</p>
                    <p className="text-foreground/90 italic">"{selectedMode.examplePrompt}"</p>
                  </div>
                  <div className={`border-l-4 ${selectedMode.borderColor} pl-4 py-2 ${selectedMode.bgColor} rounded-md`}>
                    <p className={`font-medium ${selectedMode.textColor} flex items-center gap-2`}>
                      {React.cloneElement(selectedMode.icon, { className: `h-4 w-4 ${selectedMode.textColor}`})}
                      Mira ({selectedMode.name}):
                    </p>
                    <p className="text-foreground/90">"{selectedMode.exampleResponse}"</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
