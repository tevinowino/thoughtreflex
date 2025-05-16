'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Smile } from 'lucide-react'; // Icons for Therapist, Coach, Friend

interface Mode {
  name: 'Therapist' | 'Coach' | 'Friend';
  icon: JSX.Element;
  description: string;
  examplePrompt: string;
  exampleResponse: string;
}

const modes: Mode[] = [
  {
    name: 'Therapist',
    icon: <Brain className="h-6 w-6 mr-2" />,
    description: 'Reflective, deep, and slow. Focuses on understanding underlying emotions and patterns.',
    examplePrompt: "I've been feeling overwhelmed with work lately.",
    exampleResponse: "It sounds like work has been quite demanding. Can you tell me more about what 'overwhelmed' feels like for you in those moments?",
  },
  {
    name: 'Coach',
    icon: <Zap className="h-6 w-6 mr-2" />,
    description: 'Motivational and structured. Helps you set goals and encourages progress.',
    examplePrompt: "I want to be more confident.",
    exampleResponse: "That's a great goal! What's one small step you could take this week to practice confidence in a low-stakes situation?",
  },
  {
    name: 'Friend',
    icon: <Smile className="h-6 w-6 mr-2" />,
    description: 'Casual, warm, and conversational. Offers a supportive and light-hearted chat.',
    examplePrompt: "Just had a long day, needed to vent.",
    exampleResponse: "Oh no, long days are the worst! Grab a cup of tea (or your comfort drink of choice) and tell me all about it. I'm here to listen.",
  },
];

export function TherapistModesSection() {
  const [selectedMode, setSelectedMode] = useState<Mode>(modes[0]);

  return (
    <section id="therapist-modes" className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Find Your Voice with Therapist Modes
          </h2>
          <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Choose the communication style that feels right for you. ThoughtReflex adapts to your needs.
          </p>
        </div>
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {modes.map((mode) => (
            <Button
              key={mode.name}
              variant={selectedMode.name === mode.name ? 'default' : 'outline'}
              onClick={() => setSelectedMode(mode)}
              className="shadow-md"
            >
              {mode.icon}
              {mode.name}
            </Button>
          ))}
        </div>
        <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted p-6">
            <div className="flex items-center">
              {selectedMode.icon}
              <CardTitle className="text-2xl">{selectedMode.name} Mode</CardTitle>
            </div>
            <CardDescription className="text-foreground/80 pt-2">{selectedMode.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-foreground">Example Interaction:</h4>
            </div>
            <div className="bg-accent/20 p-4 rounded-lg">
              <p className="font-medium text-primary">You:</p>
              <p className="text-foreground/90">"{selectedMode.examplePrompt}"</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="font-medium text-primary">{selectedMode.name} AI:</p>
              <p className="text-foreground/90">"{selectedMode.exampleResponse}"</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
