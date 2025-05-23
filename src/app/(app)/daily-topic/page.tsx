
// src/app/(app)/daily-topic/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { generateDailyTopicContent, GenerateDailyTopicContentInput, GenerateDailyTopicContentOutput } from '@/ai/flows/generate-daily-topic-content-flow';
import type { DailyTopicScoreRangeResponse, DailyTopicUserAnswers } from '@/ai/core/daily-topic-content-schemas';
import { ArrowLeft, CheckCircle, Info, Lightbulb, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';

export default function DailyTopicPage() {
  const { user, updateUserProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [todayTopicContent, setTodayTopicContent] = useState<GenerateDailyTopicContentOutput | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [currentStage, setCurrentStage] = useState<'loading' | 'questions' | 'reflection' | 'journaling' | 'completed'>('loading');
  const [miraReflectionData, setMiraReflectionData] = useState<DailyTopicScoreRangeResponse | null>(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTopic, setIsLoadingTopic] = useState(true);

  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (authLoading || !user) return;

    const loadOrGenerateTopic = async () => {
      setIsLoadingTopic(true);
      const userGeneratedTopics = user.dailyGeneratedTopics || {};
      const todayData = userGeneratedTopics[todayDateString];
      
      if (todayData) {
        setTodayTopicContent(todayData);
        if (todayData.completed && todayData.userAnswers) {
          setScores(todayData.userAnswers.scores.reduce((acc, score, index) => {
            const questionId = todayData.scaleQuestions[index]?.id;
            if (questionId) acc[questionId] = score;
            return acc;
          }, {} as Record<string, number>));
          setMiraReflectionData(determineReflection(todayData, todayData.userAnswers.scores));
          setJournalEntry(todayData.userAnswers.userEntry || '');
          setCurrentStage('completed');
        } else {
          setCurrentStage('questions');
        }
      } else {
        try {
          toast({ title: "Generating Today's Topic...", description: "Mira is preparing a special reflection for you." });
          const input: GenerateDailyTopicContentInput = {
            userName: user.displayName || undefined,
            detectedUserIssues: user.detectedIssues ? Object.keys(user.detectedIssues) : undefined,
            userReportedStruggles: user.userStruggles || undefined,
          };
          const generatedTopic = await generateDailyTopicContent(input);
          setTodayTopicContent(generatedTopic);
          
          const updatedProfilePart: Partial<UserProfile> = {
            dailyGeneratedTopics: {
              ...userGeneratedTopics,
              [todayDateString]: { ...generatedTopic, completed: false, userAnswers: null },
            }
          };
          await updateUserProfile(updatedProfilePart);
          if(refreshUserProfile) await refreshUserProfile();
          setCurrentStage('questions');
        } catch (error) {
          console.error("Error generating daily topic:", error);
          toast({ title: "Topic Generation Failed", description: "Could not generate today's topic. Please try again later.", variant: "destructive" });
          setCurrentStage('completed'); 
        }
      }
      setIsLoadingTopic(false);
    };

    loadOrGenerateTopic();
  }, [user, authLoading, todayDateString]); 


  const determineReflection = (topic: GenerateDailyTopicContentOutput, userScores: number[]): DailyTopicScoreRangeResponse => {
    let totalScore = 0;
    topic.scaleQuestions.forEach((q, index) => {
      let score = userScores[index] || 0; 
      if (q.reverseScore) {
        score = 6 - score; 
      }
      totalScore += score;
    });
    
    const numQuestions = topic.scaleQuestions.length;
    const lowThreshold = numQuestions * 2; 
    const mediumThreshold = numQuestions * 3 + Math.floor(numQuestions / 2) -1 ; 

    if (totalScore <= lowThreshold) {
      return topic.scoreRanges.low;
    } else if (totalScore <= mediumThreshold) {
      return topic.scoreRanges.medium;
    } else { 
      return topic.scoreRanges.high;
    }
  };


  const handleScoreChange = (questionId: string, value: string) => {
    setScores(prev => ({ ...prev, [questionId]: parseInt(value, 10) }));
  };

  const handleSubmitScores = (e: FormEvent) => {
    e.preventDefault();
    if (!todayTopicContent || Object.keys(scores).length !== todayTopicContent.scaleQuestions.length) {
      toast({ title: "Incomplete", description: "Please answer all questions.", variant: "destructive" });
      return;
    }
    
    const userScoresArray = todayTopicContent.scaleQuestions.map(q => scores[q.id] || 0);
    const reflectionData = determineReflection(todayTopicContent, userScoresArray);
    
    setMiraReflectionData(reflectionData);
    setCurrentStage('reflection');
  };

  const handleSaveJournalEntry = async () => {
    if (!user || !todayTopicContent || !miraReflectionData) return;
    setIsSaving(true);
    try {
      const userScoresArray = todayTopicContent.scaleQuestions.map(q => scores[q.id] || 0);
      const userAnswersData: DailyTopicUserAnswers = { // Use defined type
        topicName: todayTopicContent.topicName,
        scores: userScoresArray,
        miraResponse: miraReflectionData.miraResponse,
        journalPrompt: miraReflectionData.journalPrompt,
        userEntry: journalEntry.trim() || null, 
        completedAt: Timestamp.now(),
      };

      const currentGeneratedTopics = user.dailyGeneratedTopics || {};
      const updatedTopicForDay = {
        ...(currentGeneratedTopics[todayDateString] || todayTopicContent),
        completed: true,
        userAnswers: userAnswersData,
      };

      const updatedAllTopics = {
        ...currentGeneratedTopics,
        [todayDateString]: updatedTopicForDay
      };
      
      await updateUserProfile({ 
        dailyGeneratedTopics: updatedAllTopics,
        lastDailyTopicCompletionDate: todayDateString,
      });
      if (refreshUserProfile) await refreshUserProfile();

      toast({ title: "Entry Saved!", description: "Your reflections for today's topic have been saved." });
      setCurrentStage('completed');
    } catch (error) {
      console.error("Error saving daily topic entry:", error);
      toast({ title: "Save Failed", description: "Could not save your entry.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoadingTopic || (currentStage === 'loading' && !todayTopicContent) ) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Preparing your daily reflection...</p>
      </div>
    );
  }
  
  if (!todayTopicContent) {
     return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
         <h1 className="text-xl font-semibold text-destructive">Topic Unavailable</h1>
         <p className="text-muted-foreground my-4">We couldn't load or generate a topic for you today. Please try again later or check your internet connection.</p>
         <Button asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Dashboard</Link></Button>
      </div>
    );
  }

  const completedTopicData = user?.dailyGeneratedTopics?.[todayDateString];
  if (currentStage === 'completed' && completedTopicData?.completed && completedTopicData?.userAnswers) {
    const reflectionForCompleted = miraReflectionData || determineReflection(completedTopicData, completedTopicData.userAnswers.scores);
    const entryForCompleted = journalEntry || completedTopicData.userAnswers.userEntry || "";

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
            <CardTitle className="text-xl text-primary">{completedTopicData.topicName}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              You've completed this topic for {new Date(todayDateString + 'T00:00:00').toLocaleDateString()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Mira's Reflection:</h3>
              <p className="text-foreground/80 whitespace-pre-wrap">{reflectionForCompleted.miraResponse}</p>
            </div>
             {reflectionForCompleted.resourceSuggestion && (
              <div className="p-3 bg-accent/50 rounded-md border border-accent/30">
                <p className="text-sm text-accent-foreground/90"><Info className="inline h-4 w-4 mr-1.5 text-accent-foreground/70"/> {reflectionForCompleted.resourceSuggestion}</p>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Journal Prompt:</h3>
              <p className="text-foreground/80 italic">"{reflectionForCompleted.journalPrompt}"</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Entry:</h3>
              {entryForCompleted ? (
                 <p className="text-foreground/80 whitespace-pre-wrap p-3 bg-muted/50 rounded-md">{entryForCompleted}</p>
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
          <CardTitle className="text-xl text-primary">{todayTopicContent.topicName}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{todayTopicContent.introduction}</CardDescription>
        </CardHeader>

        {currentStage === 'questions' && (
          <form onSubmit={handleSubmitScores}>
            <CardContent className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">Please rate the following statements on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree):</p>
              {todayTopicContent.scaleQuestions.map((q, index) => (
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

        {currentStage === 'reflection' && miraReflectionData && (
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>Mira's Reflection:</h3>
              <p className="text-foreground/80 whitespace-pre-wrap p-3 bg-primary/5 rounded-md">{miraReflectionData.miraResponse}</p>
            </div>
            {miraReflectionData.resourceSuggestion && (
              <div className="p-3 bg-accent/50 rounded-md border border-accent/30">
                <p className="text-sm text-accent-foreground/90"><Info className="inline h-4 w-4 mr-1.5 text-accent-foreground/70"/> {miraReflectionData.resourceSuggestion}</p>
              </div>
            )}
            <Button onClick={() => setCurrentStage('journaling')} className="w-full sm:w-auto">
              Proceed to Journal
            </Button>
          </CardContent>
        )}
        
        {currentStage === 'journaling' && miraReflectionData && (
           <CardContent className="p-6 space-y-4">
            <div>
                <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>Mira's Reflection:</h3>
                <p className="text-foreground/80 whitespace-pre-wrap p-3 bg-primary/5 rounded-md mb-4">{miraReflectionData.miraResponse}</p>
            </div>
            {miraReflectionData.resourceSuggestion && (
              <div className="p-3 bg-accent/50 rounded-md border border-accent/30 mb-4">
                <p className="text-sm text-accent-foreground/90"><Info className="inline h-4 w-4 mr-1.5 text-accent-foreground/70"/> {miraReflectionData.resourceSuggestion}</p>
              </div>
            )}
            <div>
              <Label htmlFor="journalEntry" className="font-semibold text-foreground mb-1.5 block">Your Journal Prompt:</Label>
              <p className="text-foreground/80 italic mb-3 p-3 bg-muted/50 rounded-md">"{miraReflectionData.journalPrompt}"</p>
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
  );
}
    