
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getTopicForDay, getDayOfWeek } from '@/lib/daily-topics';
import type { DailyTopic, DailyTopicScoreRangeResponse } from '@/types/daily-topic';
import { ArrowLeft, CheckCircle, Info, Lightbulb, Loader2, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

export default function DailyTopicPage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [todayTopic, setTodayTopic] = useState<DailyTopic | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [currentStage, setCurrentStage] = useState<'loading' | 'questions' | 'reflection' | 'journaling' | 'completed'>('loading');
  const [miraReflection, setMiraReflection] = useState<DailyTopicScoreRangeResponse | null>(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const dayIndex = new Date().getDay();
    const topic = getTopicForDay(dayIndex);
    if (topic) {
      setTodayTopic(topic);
      // Check if already completed today
      if (user?.dailyTopicResponses && user.dailyTopicResponses[todayDateString]?.topic === topic.topicName) {
        setMiraReflection({
            miraResponse: user.dailyTopicResponses[todayDateString].miraResponse,
            journalPrompt: user.dailyTopicResponses[todayDateString].journalPrompt,
            resourceSuggestion: topic.scoreRanges.low.resourceSuggestion // Or dynamically find it
        });
        setJournalEntry(user.dailyTopicResponses[todayDateString].userEntry || '');
        setCurrentStage('completed');
      } else {
        setCurrentStage('questions');
      }
    } else {
      toast({ title: "No topic for today", description: "Please check back later.", variant: "default" });
      setCurrentStage('completed'); // Or handle as an error
    }
  }, [user, todayDateString, toast]);

  const handleScoreChange = (questionId: string, value: string) => {
    setScores(prev => ({ ...prev, [questionId]: parseInt(value, 10) }));
  };

  const handleSubmitScores = (e: FormEvent) => {
    e.preventDefault();
    if (!todayTopic || Object.keys(scores).length !== todayTopic.scaleQuestions.length) {
      toast({ title: "Incomplete", description: "Please answer all questions.", variant: "destructive" });
      return;
    }

    let totalScore = 0;
    todayTopic.scaleQuestions.forEach(q => {
      let score = scores[q.id] || 0;
      if (q.reverseScore) {
        score = 6 - score; // Reverse score (1->5, 2->4, 3->3, 4->2, 5->1)
      }
      totalScore += score;
    });
    
    // Determine score range (example logic, adjust based on your number of questions)
    const numQuestions = todayTopic.scaleQuestions.length;
    const maxPossibleScore = numQuestions * 5;
    let reflectionData;

    if (totalScore <= numQuestions * 2 + Math.floor(numQuestions/2) -1 ) { // Approximation for low range
      reflectionData = todayTopic.scoreRanges.low;
    } else if (totalScore <= numQuestions * 3 + Math.floor(numQuestions/2) ) { // Approximation for medium range
      reflectionData = todayTopic.scoreRanges.medium;
    } else {
      reflectionData = todayTopic.scoreRanges.high;
    }
    setMiraReflection(reflectionData);
    setCurrentStage('reflection');
  };

  const handleSaveJournalEntry = async () => {
    if (!user || !todayTopic || !miraReflection) return;
    setIsSaving(true);
    try {
      const newDailyTopicResponse = {
        topic: todayTopic.topicName,
        scores: todayTopic.scaleQuestions.map(q => scores[q.id] || 0),
        miraResponse: miraReflection.miraResponse,
        journalPrompt: miraReflection.journalPrompt,
        userEntry: journalEntry,
        completedAt: Timestamp.now(),
      };

      const updatedResponses = {
        ...(user.dailyTopicResponses || {}),
        [todayDateString]: newDailyTopicResponse
      };
      
      await updateUserProfile({ 
        dailyTopicResponses: updatedResponses,
        lastDailyTopicCompletionDate: todayDateString,
      });

      toast({ title: "Entry Saved!", description: "Your reflections for today's topic have been saved." });
      setCurrentStage('completed');
    } catch (error) {
      console.error("Error saving daily topic entry:", error);
      toast({ title: "Save Failed", description: "Could not save your entry.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || currentStage === 'loading' || !todayTopic) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (currentStage === 'completed' && todayTopic && miraReflection) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 rounded-full">
                <Link href="/dashboard">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                    <span className="sr-only">Back to Dashboard</span>
                </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Today's Guided Topic: Completed</h1>
        </div>
        <Card className="shadow-xl rounded-2xl">
          <CardHeader className="bg-primary/5 border-b border-primary/20">
            <CardTitle className="text-xl text-primary">{todayTopic.topicName}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              You've completed this topic for {new Date(todayDateString + 'T00:00:00').toLocaleDateString()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Mira's Reflection:</h3>
              <p className="text-foreground/80 whitespace-pre-wrap">{miraReflection.miraResponse}</p>
            </div>
             {miraReflection.resourceSuggestion && (
              <div className="p-3 bg-accent/50 rounded-md border border-accent/30">
                <p className="text-sm text-accent-foreground/90"><Info className="inline h-4 w-4 mr-1.5 text-accent-foreground/70"/> {miraReflection.resourceSuggestion}</p>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Journal Prompt:</h3>
              <p className="text-foreground/80 italic">"{miraReflection.journalPrompt}"</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Entry:</h3>
              {journalEntry ? (
                 <p className="text-foreground/80 whitespace-pre-wrap p-3 bg-muted/50 rounded-md">{journalEntry}</p>
              ) : (
                <p className="text-muted-foreground italic">You didn't write an entry for this prompt.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
       <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 rounded-full">
                <Link href="/dashboard">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                    <span className="sr-only">Back to Dashboard</span>
                </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Today's Guided Topic</h1>
        </div>

      <Card className="shadow-xl rounded-2xl">
        <CardHeader className="bg-primary/5 border-b border-primary/20">
          <CardTitle className="text-xl text-primary">{todayTopic.topicName}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{todayTopic.introduction}</CardDescription>
        </CardHeader>

        {currentStage === 'questions' && (
          <form onSubmit={handleSubmitScores}>
            <CardContent className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">Please rate the following statements on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree):</p>
              {todayTopic.scaleQuestions.map((q, index) => (
                <div key={q.id} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                  <Label htmlFor={`q-${q.id}`} className="text-foreground/90">{index + 1}. {q.text}</Label>
                  <RadioGroup
                    id={`q-${q.id}`}
                    onValueChange={(value) => handleScoreChange(q.id, value)}
                    className="flex flex-wrap gap-x-4 gap-y-2 pt-1"
                    required
                  >
                    {[1, 2, 3, 4, 5].map(val => (
                      <div key={val} className="flex items-center space-x-2">
                        <RadioGroupItem value={val.toString()} id={`q-${q.id}-val-${val}`} />
                        <Label htmlFor={`q-${q.id}-val-${val}`} className="font-normal">{val}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-6 border-t">
              <Button type="submit" className="w-full sm:w-auto">Continue to Reflection</Button>
            </CardFooter>
          </form>
        )}

        {currentStage === 'reflection' && miraReflection && (
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>Mira's Reflection:</h3>
              <p className="text-foreground/80 whitespace-pre-wrap p-3 bg-primary/5 rounded-md">{miraReflection.miraResponse}</p>
            </div>
            {miraReflection.resourceSuggestion && (
              <div className="p-3 bg-accent/50 rounded-md border border-accent/30">
                <p className="text-sm text-accent-foreground/90"><Info className="inline h-4 w-4 mr-1.5 text-accent-foreground/70"/> {miraReflection.resourceSuggestion}</p>
              </div>
            )}
            <Button onClick={() => setCurrentStage('journaling')} className="w-full sm:w-auto">
              Proceed to Journal
            </Button>
          </CardContent>
        )}
        
        {currentStage === 'journaling' && miraReflection && (
           <CardContent className="p-6 space-y-4">
            <div>
                <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>Mira's Reflection:</h3>
                <p className="text-foreground/80 whitespace-pre-wrap p-3 bg-primary/5 rounded-md mb-4">{miraReflection.miraResponse}</p>
            </div>
            {miraReflection.resourceSuggestion && (
              <div className="p-3 bg-accent/50 rounded-md border border-accent/30 mb-4">
                <p className="text-sm text-accent-foreground/90"><Info className="inline h-4 w-4 mr-1.5 text-accent-foreground/70"/> {miraReflection.resourceSuggestion}</p>
              </div>
            )}
            <div>
              <Label htmlFor="journalEntry" className="font-semibold text-foreground mb-1.5 block">Your Journal Prompt:</Label>
              <p className="text-foreground/80 italic mb-3 p-3 bg-muted/50 rounded-md">"{miraReflection.journalPrompt}"</p>
              <Textarea
                id="journalEntry"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Write your reflections here..."
                className="min-h-[150px] bg-muted/30"
                rows={6}
              />
            </div>
             <Button onClick={handleSaveJournalEntry} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Journal Entry'}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>