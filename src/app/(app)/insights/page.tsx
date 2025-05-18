
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Activity, TrendingUp, Lightbulb, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { analyzeWeeklySentiments, AnalyzeWeeklySentimentsInput, AnalyzeWeeklySentimentsOutput } from '@/ai/flows/analyze-weekly-sentiments-flow';
import { identifyJournalThemes, IdentifyJournalThemesInput, IdentifyJournalThemesOutput } from '@/ai/flows/identify-journal-themes-flow';
import { generatePersonalizedSuggestions, GeneratePersonalizedSuggestionsInput, GeneratePersonalizedSuggestionsOutput } from '@/ai/flows/generate-personalized-suggestions-flow';
import type { WeeklyRecap } from '../recaps/page'; // For recap type

interface EmotionTrendData {
  name: string; // Week name
  positive: number;
  negative: number;
  neutral: number;
}

interface RecurringThemeData {
  theme: string;
  mentions: number;
}

interface SuggestionData {
  observation: string;
  suggestion: string;
  affirmation?: string;
}

// Define distinct colors for chart segments if not relying solely on globals.css
const COLORS = {
  positive: 'hsl(var(--chart-1))', // Ocean Teal
  negative: 'hsl(var(--chart-2))', // Soft Lavender (could be more reddish for negative)
  neutral: 'hsl(var(--chart-3))',  // Peach Blush (could be more greyish for neutral)
};
// Alternative, more standard sentiment colors
const SENTIMENT_COLORS = {
  positive: '#82ca9d', // A pleasant green
  negative: '#ff6b6b', // A clear red
  neutral: '#a0a0a0',  // A neutral grey
};


export default function InsightsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [emotionTrends, setEmotionTrends] = useState<EmotionTrendData[]>([]);
  const [recurringThemes, setRecurringThemes] = useState<RecurringThemeData[]>([]);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<SuggestionData[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insightsGenerated, setInsightsGenerated] = useState(false);


  const fetchJournalEntriesText = async (days = 30): Promise<string> => {
    if (!user) return "";
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    let allEntriesText = "";
    const sessionsQuery = query(
      collection(db, 'users', user.uid, 'journalSessions'),
      where('lastUpdatedAt', '>=', startTimestamp),
      orderBy('lastUpdatedAt', 'desc')
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    for (const sessionDoc of sessionsSnapshot.docs) {
      const messagesQuery = query(
        collection(db, 'users', user.uid, 'journalSessions', sessionDoc.id, 'messages'),
        where('sender', '==', 'user'),
        orderBy('timestamp', 'asc')
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach(msgDoc => {
        allEntriesText += msgDoc.data().text + "\n\n";
      });
    }
    return allEntriesText;
  };

  const fetchWeeklyRecaps = async (count = 4): Promise<Array<{id: string, title: string, summary: string}>> => {
    if (!user) return [];
    const recapsQuery = query(
      collection(db, 'users', user.uid, 'weeklyRecaps'),
      orderBy('generatedAt', 'desc'),
      limit(count)
    );
    const recapsSnapshot = await getDocs(recapsQuery);
    return recapsSnapshot.docs.map(doc => {
      const data = doc.data() as WeeklyRecap; 
      return { id: doc.id, title: data.title, summary: data.summary };
    }).reverse(); // Reverse to get chronological order for trends
  };

  const handleGenerateInsights = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "Please log in to generate insights.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setInsightsGenerated(false);
    toast({ title: "Generating Insights...", description: "This may take a few moments." });

    try {
      const [journalText, weeklyRecapsData] = await Promise.all([
        fetchJournalEntriesText(30), 
        fetchWeeklyRecaps(4)       
      ]);

      if (!journalText && weeklyRecapsData.length === 0) {
        toast({ title: "Not Enough Data", description: "Please write some journal entries or generate weekly recaps to get insights.", variant: "default"});
        setIsLoading(false);
        return;
      }

      // Generate Emotion Trends
      if (weeklyRecapsData.length > 0) {
        const emotionInput: AnalyzeWeeklySentimentsInput = { recapTexts: weeklyRecapsData };
        const emotionOutput = await analyzeWeeklySentiments(emotionInput);
        setEmotionTrends(emotionOutput.trends.map(t => ({ name: t.weekName, positive: t.positive, negative: t.negative, neutral: t.neutral })));
      } else {
        setEmotionTrends([]); 
      }

      // Generate Recurring Themes
      if (journalText) {
        const themesInput: IdentifyJournalThemesInput = { journalEntriesText: journalText, maxThemes: 5 };
        const themesOutput = await identifyJournalThemes(themesInput);
        setRecurringThemes(themesOutput.themes);
      } else {
        setRecurringThemes([]);
      }
      
      // Generate Personalized Suggestions
      if (journalText) {
        const suggestionsInput: GeneratePersonalizedSuggestionsInput = { journalEntriesText: journalText, userName: user.displayName || undefined };
        const suggestionsOutput = await generatePersonalizedSuggestions(suggestionsInput);
        setPersonalizedSuggestions(suggestionsOutput.suggestions);
      } else {
        setPersonalizedSuggestions([]);
      }

      setInsightsGenerated(true);
      toast({ title: "Insights Generated!", description: "Your personalized insights are ready." });

    } catch (e: any) {
      console.error("Error generating insights:", e);
      setError("Failed to generate insights. Please try again.");
      toast({ title: "Error", description: "Could not generate insights.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border bg-background p-3 text-sm shadow-lg outline-none animate-in fade-in-0 zoom-in-95">
          <p className="font-semibold mb-1">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
              {`${entry.name}: ${entry.value.toFixed(1)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Emotional Insights</h1>
          <p className="text-muted-foreground">
            Discover patterns and trends from your journal entries and recaps.
          </p>
        </div>
        <Button onClick={handleGenerateInsights} disabled={isLoading} size="lg">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
          {isLoading ? 'Generating...' : insightsGenerated ? 'Refresh Insights' : 'Generate Insights'}
        </Button>
      </div>

      {error && (
        <Card className="shadow-lg rounded-2xl border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !insightsGenerated && !error && (
        <Card className="text-center py-12 shadow-lg rounded-2xl">
          <CardHeader>
            <div className="mx-auto bg-secondary p-3 rounded-full w-fit">
                <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4">Ready for Insights?</CardTitle>
            <CardDescription>Click the "Generate Insights" button to analyze your recent activity.</CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {isLoading && (
        <div className="space-y-6">
          <Card className="shadow-lg rounded-2xl">
            <CardHeader><CardTitle>Loading Emotion Trends...</CardTitle></CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
          </Card>
           <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg rounded-2xl">
                <CardHeader><CardTitle>Loading Recurring Themes...</CardTitle></CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
            </Card>
            <Card className="shadow-lg rounded-2xl">
                <CardHeader><CardTitle>Loading Key Insights...</CardTitle></CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
            </Card>
           </div>
        </div>
      )}

      {insightsGenerated && !isLoading && !error && (
        <>
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Emotion Trends Over Time</CardTitle>
              <CardDescription>Visualizing sentiments from your recent weekly recaps (Scores 0-10).</CardDescription>
            </CardHeader>
            <CardContent>
              {emotionTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={emotionTrends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.5 }} />
                    <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                    <Bar dataKey="positive" name="Positive" fill={SENTIMENT_COLORS.positive} radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="negative" name="Negative" fill={SENTIMENT_COLORS.negative} radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="neutral" name="Neutral" fill={SENTIMENT_COLORS.neutral} radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No weekly recap data found to display emotion trends. Try generating some recaps.</p>
              )}
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-6 w-6 text-primary" /> Recurring Themes</CardTitle>
                <CardDescription>Common topics identified from your recent journal entries.</CardDescription>
              </CardHeader>
              <CardContent>
                {recurringThemes.length > 0 ? (
                  <ul className="space-y-3">
                    {recurringThemes.map(themeObj => (
                      <li key={themeObj.theme} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <span className="text-sm font-medium text-foreground">{themeObj.theme}</span>
                        <span className="text-xs text-foreground/80 block bg-primary/10 text-primary px-2 py-0.5 rounded-full">{themeObj.mentions} mentions</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center py-10">No recurring themes identified. Keep journaling to discover patterns.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary" /> Key Insights & Suggestions</CardTitle>
                <CardDescription>Personalized observations based on your journaling.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {personalizedSuggestions.length > 0 ? (
                  personalizedSuggestions.map((sugg, index) => (
                    <div key={index} className="space-y-3 border-l-4 border-primary/50 pl-4 py-2 bg-primary/5 rounded-r-lg">
                      <div>
                        <p className="text-sm font-semibold text-primary/90">Observation:</p>
                        <p className="text-sm text-foreground/90">{sugg.observation}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary/90">Suggestion:</p>
                        <p className="text-sm text-foreground/90">{sugg.suggestion}</p>
                      </div>
                      {sugg.affirmation && (
                        <div>
                          <p className="text-sm font-semibold text-primary/90">Affirmation:</p>
                          <p className="text-sm text-foreground/90 italic">"{sugg.affirmation}"</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-10">No specific suggestions at this time. Keep journaling to gain more insights.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      <Card className="mt-12 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0 md:p-0 flex flex-col md:flex-row items-center">
          <div className="p-6 md:p-8 flex-1 space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">Understanding Your Insights</h3>
            <p className="text-foreground/80">
              The insights page is designed to help you connect the dots in your emotional journey. By recognizing patterns in your thoughts, feelings, and behaviors, you can:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li>Gain deeper self-awareness.</li>
              <li>Identify triggers for certain emotions.</li>
              <li>Recognize unhelpful thinking habits.</li>
              <li>Track the effectiveness of coping strategies.</li>
              <li>Celebrate your progress and growth.</li>
            </ul>
            <p className="text-foreground/80">
              Use these insights as a guide for further reflection and to inform your healing goals.
            </p>
          </div>
          <div className="md:w-1/3 flex-shrink-0">
             <Image 
              src="/insights.png"
              alt="Abstract data visualization representing personal insights"
              width={400}
              height={350}
              className="object-cover w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

