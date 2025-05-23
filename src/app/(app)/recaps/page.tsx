
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Edit, FileText, ThumbsUp, Zap, Wind, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { generateWeeklyRecap, WeeklyRecapInput } from '@/ai/flows/weekly-ai-recap';
import { useAuth, UserProfile } from '@/contexts/auth-context'; // Import UserProfile
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { format, getDay, isSameDay } from 'date-fns';

export interface WeeklyRecap {
  id: string;
  weekOf: string;
  title: string;
  summary: string;
  emotionalHigh?: string;
  struggleOfTheWeek?: string;
  growthMoment?: string;
  generatedAt: Date;
  userId: string;
}

export default function RecapsPage() {
  const { user, updateUserProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [recaps, setRecaps] = useState<WeeklyRecap[]>([]);
  const [isLoadingRecaps, setIsLoadingRecaps] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const today = new Date();
  const isSunday = getDay(today) === 0; // 0 is Sunday
  const todayDateString = format(today, 'yyyy-MM-dd');

  const hasGeneratedThisWeek = useMemo(() => {
    if (!user?.lastRecapGeneratedDate) return false;
    // Check if lastRecapGeneratedDate is the same as the current Sunday
    // This assumes recaps are only generated on Sundays.
    const lastRecapDate = new Date(user.lastRecapGeneratedDate + "T00:00:00"); // Ensure correct date parsing
    return isSunday && isSameDay(lastRecapDate, today);
  }, [user?.lastRecapGeneratedDate, isSunday, today]);

  const canGenerateRecap = isSunday && !hasGeneratedThisWeek;
  
  let buttonText = "Generate This Week's Recap";
  let buttonTooltip = "";
  if (!isSunday) {
    buttonTooltip = "Weekly recaps can only be generated on Sundays.";
  } else if (hasGeneratedThisWeek) {
    buttonTooltip = "You've already generated this week's recap.";
  }


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
    if (!user || !refreshUserProfile || !updateUserProfile) {
      toast({ title: "Error", description: "You need to be logged in.", variant: "destructive" });
      return;
    }
    if (!canGenerateRecap) {
      toast({ title: "Cannot Generate Recap", description: buttonTooltip || "Recap generation is not available right now.", variant: "default" });
      return;
    }

    setIsGenerating(true);
    toast({
      title: "Generating Recap...",
      description: "This might take a few moments. We'll analyze your recent entries.",
    });
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

      const sessionsQuery = query(
        collection(db, 'users', user.uid, 'journalSessions'),
        where('lastUpdatedAt', '>=', sevenDaysAgoTimestamp),
        orderBy('lastUpdatedAt', 'desc')
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      let allUserMessagesText = "";

      if (sessionsSnapshot.empty) {
         toast({
          title: "Not Enough Recent Activity",
          description: "No journal sessions found from the past week to generate a recap.",
        });
        setIsGenerating(false);
        return;
      }

      for (const sessionDoc of sessionsSnapshot.docs) {
        const messagesQuery = query(
          collection(db, 'users', user.uid, 'journalSessions', sessionDoc.id, 'messages'),
          where('sender', '==', 'user'),
          orderBy('timestamp', 'asc')
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.forEach(msgDoc => {
          allUserMessagesText += msgDoc.data().text + "\n\n"; 
        });
      }

      if (!allUserMessagesText.trim()) {
        toast({
          title: "No Journal Entries",
          description: "You haven't written any user messages in your journal sessions this past week.",
          variant: "default"
        });
        setIsGenerating(false);
        return;
      }
      
      const recapInput: WeeklyRecapInput = {
        journalEntriesText: allUserMessagesText,
        userName: user.displayName || undefined,
      };

      const result = await generateWeeklyRecap(recapInput);
      
      const newRecapData: Omit<WeeklyRecap, 'id' | 'generatedAt'> = {
        weekOf: `Week of ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`, 
        title: `Weekly Recap - ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`,
        summary: result.recap,
        userId: user.uid,
      };

      await addDoc(collection(db, 'users', user.uid, 'weeklyRecaps'), {
        ...newRecapData,
        generatedAt: serverTimestamp(),
      });
      
      // Update lastRecapGeneratedDate in user profile
      await updateUserProfile({ lastRecapGeneratedDate: todayDateString });
      await refreshUserProfile(); // Refresh context
      
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
        <Button 
            size="lg" 
            onClick={handleGenerateRecap} 
            disabled={isGenerating || !canGenerateRecap}
            title={buttonTooltip}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Edit className="mr-2 h-5 w-5" /> {buttonText}
            </>
          )}
        </Button>
      </div>
      {!isSunday && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-700 dark:text-yellow-400 flex items-center gap-2 text-sm">
            <AlertCircle className="h-5 w-5"/>
            Weekly recaps can only be generated on Sundays.
        </div>
      )}
      {isSunday && hasGeneratedThisWeek && (
         <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2 text-sm">
            <AlertCircle className="h-5 w-5"/>
            You've already generated this week's recap. Come back next Sunday!
        </div>
      )}


      {recaps.length === 0 ? (
        <Card className="text-center py-12 shadow-lg rounded-2xl">
          <CardHeader>
             <div className="mx-auto bg-secondary p-3 rounded-full w-fit">
                <CalendarDays className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4">No Recaps Yet</CardTitle>
            <CardDescription>Generate your first recap on a Sunday to see a summary of your week's reflections.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Keep journaling and generate a recap when you're ready!</p>
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
              src="/images/recaps/weeklyreflecting.png"
              alt="Person looking at a scenic view thoughtfully, representing weekly reflection"
              width={400}
              height={350}
              className="object-cover w-full h-full"
              data-ai-hint="person reflection nature"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

