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
import type { DailyTopicScoreRangeResponse } from '@/ai/core/daily-topic-content-schemas';
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
      if (user.dailyGeneratedTopics && user.dailyGeneratedTopics[todayDateString]) {
        const topicData = user.dailyGeneratedTopics[todayDateString];
        setTodayTopicContent(topicData);
        if (topicData.completed && topicData.userAnswers) {
          setMiraReflectionData(determineReflection(topicData, topicData.userAnswers.scores));
          setJournalEntry(topicData.userAnswers.userEntry || '');
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
          };
          const generatedTopic = await generateDailyTopicContent(input);
          setTodayTopicContent(generatedTopic);
          
          const updatedProfilePart: Partial<UserProfile> = {
            dailyGeneratedTopics: {
              ...(user.dailyGeneratedTopics || {}),
              [todayDateString]: { ...generatedTopic, completed: false },
            }
          };
          await updateUserProfile(updatedProfilePart);
          if(refreshUserProfile) await refreshUserProfile(); // Refresh context with the newly generated topic
          setCurrentStage('questions');
        } catch (error) {
          console.error("Error generating daily topic:", error);
          toast({ title: "Topic Generation Failed", description: "Could not generate today's topic. Please try again later.", variant: "destructive" });
          setCurrentStage('completed'); // Or an error stage
        }
      }
      setIsLoadingTopic(false);
    };

    loadOrGenerateTopic();
  }, [user, authLoading, todayDateString, toast, updateUserProfile, refreshUserProfile]);

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
    // Example logic for score ranges, adjust as needed based on expected score distributions
    if (totalScore <= numQuestions * 2 + Math.floor(numQuestions / 2) -1 ) { // Approx low range
      return topic.scoreRanges.low;
    } else if (totalScore <= numQuestions * 3 + Math.floor(numQuestions / 2) ) { // Approx medium range
      return topic.scoreRanges.medium;
    } else { // Approx high range
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
      const userAnswersData = {
        topicName: todayTopicContent.topicName, // Save the topic name with the answer
        scores: userScoresArray,
        miraResponse: miraReflectionData.miraResponse, // This is Mira's reflection based on score
        journalPrompt: miraReflectionData.journalPrompt, // This is Mira's prompt based on score
        userEntry: journalEntry,
        completedAt: Timestamp.now(),
      };

      const updatedTopics = {
        ...(user.dailyGeneratedTopics || {}),
        [todayDateString]: {
          ...(user.dailyGeneratedTopics?.[todayDateString] || todayTopicContent), // Persist the generated topic content
          completed: true,
          userAnswers: userAnswersData,
        }
      };
      
      await updateUserProfile({ 
        dailyGeneratedTopics: updatedTopics,
        lastDailyTopicCompletionDate: todayDateString, // This can still track overall completion for the day
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

  if (currentStage === 'completed' && miraReflectionData) {
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
            <CardTitle className="text-xl text-primary">{todayTopicContent.topicName}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              You've completed this topic for {new Date(todayDateString + 'T00:00:00').toLocaleDateString()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Mira's Reflection:</h3>
              <p className="text-foreground/80 whitespace-pre-wrap">{miraReflectionData.miraResponse}</p>
            </div>
             {miraReflectionData.resourceSuggestion && (
              <div className="p-3 bg-accent/50 rounded-md border border-accent/30">
                <p className="text-sm text-accent-foreground/90"><Info className="inline h-4 w-4 mr-1.5 text-accent-foreground/70"/> {miraReflectionData.resourceSuggestion}</p>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Journal Prompt:</h3>
              <p className="text-foreground/80 italic">"{miraReflectionData.journalPrompt}"</p>
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
  