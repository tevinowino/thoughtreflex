
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Edit, FileText, ThumbsUp, Zap, Wind, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { generateWeeklyRecap, WeeklyRecapInput } from '@/ai/flows/weekly-ai-recap';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

export interface WeeklyRecap {
  id: string;
  weekOf: string;
  title: string;
  summary: string;
  emotionalHigh?: string;
  struggleOfTheWeek?: string;
  growthMoment?: string;
  generatedAt: Date; // Ensure this is a Date object
  userId: string;
}

export default function RecapsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recaps, setRecaps] = useState<WeeklyRecap[]>([]);
  const [isLoadingRecaps, setIsLoadingRecaps] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoadingRecaps(false);
      return;
    }
    setIsLoadingRecaps(true);
    const recapsColRef = collection(db, 'users', user.uid, 'weeklyRecaps');
    const q = query(recapsColRef, orderBy('generatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecaps = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          generatedAt: (data.generatedAt as Timestamp)?.toDate ? (data.generatedAt as Timestamp).toDate() : new Date(),
        } as WeeklyRecap;
      });
      setRecaps(fetchedRecaps);
      setIsLoadingRecaps(false);
    }, (error) => {
      console.error("Error fetching recaps:", error);
      toast({ title: "Error", description: "Could not fetch weekly recaps.", variant: "destructive" });
      setIsLoadingRecaps(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleGenerateRecap = async () => {
    if (!user) {
      toast({ title: "Error", description: "You need to be logged in.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    toast({
      title: "Generating Recap...",
      description: "This might take a few moments. We'll analyze your recent entries.",
    });
    
    try {
      // TODO: In a real app, gather actual data from user's journal entries for the past week.
      // This is a simplified input for now.
      const recapInput: WeeklyRecapInput = {
        emotionalTrends: "User reported feeling stressed about work but also moments of calm during walks.",
        victories: "Completed a difficult task, took time for self-care.",
        struggles: "Feeling overwhelmed by deadlines, occasional moments of self-doubt.",
        additionalContext: `User is ${user.displayName || 'the user'}. They have been journaling consistently.`,
      };

      const result = await generateWeeklyRecap(recapInput);
      
      const newRecapData: Omit<WeeklyRecap, 'id' | 'generatedAt'> = {
        weekOf: `Week of ${new Date().toLocaleDateString()}`, 
        title: `Weekly Recap - ${new Date().toLocaleDateString()}`,
        summary: result.recap,
        userId: user.uid,
        // Optional fields can be added here if AI generates them or if user can input them later
      };

      await addDoc(collection(db, 'users', user.uid, 'weeklyRecaps'), {
        ...newRecapData,
        generatedAt: serverTimestamp(),
      });
      // No need to manually add to local state, onSnapshot will update it.
      
      toast({
        title: "Weekly Recap Generated!",
        description: "Your new weekly recap has been created and saved.",
      });

    } catch (error: any) {
      console.error("Error generating recap:", error);
      toast({
        title: "Recap Generation Failed",
        description: error.message || "Could not generate weekly recap.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (isLoadingRecaps) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly AI Recaps</h1>
          <p className="text-muted-foreground">
            Review your progress, emotional trends, and key moments from each week.
          </p>
        </div>
        <Button size="lg" onClick={handleGenerateRecap} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Edit className="mr-2 h-5 w-5" /> Generate This Week's Recap
            </>
          )}
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
            <p className="text-sm text-muted-foreground">Keep journaling or generate your first recap!</p>
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
                        <CardDescription className="text-sm">{recap.weekOf} (Generated: {recap.generatedAt.toLocaleDateString()})</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary -mt-2 -mr-2" asChild>
                        <Link href={`/recaps/${recap.id}`}>
                          <FileText className="h-5 w-5" />
                          <span className="sr-only">View full recap</span>
                        </Link>
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground/80 italic line-clamp-3">"{recap.summary}"</p>
                {(recap.emotionalHigh || recap.struggleOfTheWeek || recap.growthMoment) && (
                  <div className="grid md:grid-cols-3 gap-4 pt-2">
                      {recap.emotionalHigh && <div className="p-3 bg-green-500/10 rounded-lg">
                          <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 flex items-center"><ThumbsUp className="h-4 w-4 mr-1.5"/>Emotional High</h4>
                          <p className="text-xs text-foreground/70">{recap.emotionalHigh}</p>
                      </div>}
                      {recap.struggleOfTheWeek && <div className="p-3 bg-red-500/10 rounded-lg">
                          <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 flex items-center"><Wind className="h-4 w-4 mr-1.5"/>Struggle of the Week</h4>
                          <p className="text-xs text-foreground/70">{recap.struggleOfTheWeek}</p>
                      </div>}
                      {recap.growthMoment && <div className="p-3 bg-blue-500/10 rounded-lg">
                          <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 flex items-center"><Zap className="h-4 w-4 mr-1.5"/>Growth Moment</h4>
                          <p className="text-xs text-foreground/70">{recap.growthMoment}</p>
                      </div>}
                  </div>
                )}
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

    