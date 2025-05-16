'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Edit, FileText, ThumbsUp, Zap, Wind } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface WeeklyRecap {
  id: string;
  weekOf: string;
  title: string;
  summary: string;
  emotionalHigh: string;
  struggleOfTheWeek: string;
  growthMoment: string;
}

const mockRecaps: WeeklyRecap[] = [
  {
    id: '1',
    weekOf: 'October 23 - October 29, 2023',
    title: "A Week of Navigating Change",
    summary: "This week, you explored feelings of uncertainty related to upcoming work changes. You also celebrated a small personal victory and showed resilience in managing stress.",
    emotionalHigh: "Feeling proud after completing a challenging project.",
    struggleOfTheWeek: "Managing anxiety about the future.",
    growthMoment: "You consciously used breathing exercises during a stressful moment, which you noted helped."
  },
  {
    id: '2',
    weekOf: 'October 16 - October 22, 2023',
    title: "Finding Balance",
    summary: "You focused on finding a better work-life balance. There were moments of frustration, but also clear intentions set towards self-care.",
    emotionalHigh: "Enjoying a quiet weekend निगम.",
    struggleOfTheWeek: "Feeling guilty for taking time off.",
    growthMoment: "Recognizing the need for boundaries and communicating them effectively once."
  },
];

export default function RecapsPage() {
  const { toast } = useToast();
  // In a real app, fetch recaps from Firestore
  const recaps = mockRecaps;

  const handleGenerateRecap = () => {
    // Placeholder for AI recap generation logic
    toast({
      title: "Generating Recap...",
      description: "This might take a few moments. We'll notify you when it's ready.",
    });
    // Simulate generation
    setTimeout(() => {
      toast({
        title: "Weekly Recap Ready!",
        description: "Your new weekly recap has been generated.",
        action: <Button variant="outline" size="sm" asChild><Link href="#">View Now</Link></Button>,
      });
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly AI Recaps</h1>
          <p className="text-muted-foreground">
            Review your progress, emotional trends, and key moments from each week.
          </p>
        </div>
        <Button size="lg" onClick={handleGenerateRecap}>
          <Edit className="mr-2 h-5 w-5" /> Generate This Week's Recap
        </Button>
      </div>

      {recaps.length === 0 ? (
        <Card className="text-center py-12 shadow-lg rounded-2xl">
          <CardHeader>
             <div className="mx-auto bg-secondary p-3 rounded-full w-fit">
                <CalendarDays className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4">No Recaps Yet</CardTitle>
            <CardDescription>Your weekly AI-generated recaps will appear here after you've journaled for a bit.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Keep journaling to unlock your first recap!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {recaps.map(recap => (
            <Card key={recap.id} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">{recap.title}</CardTitle>
                        <CardDescription className="text-sm">{recap.weekOf}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary -mt-2 -mr-2">
                        <FileText className="h-5 w-5" />
                        <span className="sr-only">View full recap</span>
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground/80 italic">"{recap.summary}"</p>
                <div className="grid md:grid-cols-3 gap-4 pt-2">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                        <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 flex items-center"><ThumbsUp className="h-4 w-4 mr-1.5"/>Emotional High</h4>
                        <p className="text-xs text-foreground/70">{recap.emotionalHigh}</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg">
                        <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 flex items-center"><Wind className="h-4 w-4 mr-1.5"/>Struggle of the Week</h4>
                        <p className="text-xs text-foreground/70">{recap.struggleOfTheWeek}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 flex items-center"><Zap className="h-4 w-4 mr-1.5"/>Growth Moment</h4>
                        <p className="text-xs text-foreground/70">{recap.growthMoment}</p>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-12 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0 md:p-0 flex flex-col md:flex-row items-center">
          <div className="p-6 md:p-8 flex-1 space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">The Value of Reflection</h3>
            <p className="text-foreground/80">
              Weekly recaps provide a structured opportunity to look back on your experiences, identify patterns, and acknowledge your progress. This reflection can:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li>Reinforce positive changes and coping strategies.</li>
              <li>Offer new perspectives on challenges.</li>
              <li>Highlight areas for continued growth.</li>
              <li>Boost motivation by recognizing your efforts.</li>
            </ul>
            <p className="text-foreground/80">
             ThoughtReflex's AI helps distill your week into meaningful summaries, encouraging self-awareness and celebrating your journey.
            </p>
          </div>
          <div className="md:w-1/3 flex-shrink-0">
             <Image 
              src="https://placehold.co/400x350.png"
              alt="Person looking at a scenic view thoughtfully"
              width={400}
              height={350}
              className="object-cover w-full h-full"
              data-ai-hint="scenic view reflection"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
