
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Activity, TrendingUp, Lightbulb, Loader2, AlertTriangle, Sparkles, PieChart as PieChartIcon } from 'lucide-react'; // Added PieChartIcon
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {motion} from 'framer-motion';
// import { DashboardCard, DashboardCardHeader } from '@/components/ui/dashboard-card';
import { analyzeWeeklySentiments, AnalyzeWeeklySentimentsInput } from '@/ai/flows/analyze-weekly-sentiments-flow'; // Output type not needed here if just displaying
import { identifyJournalThemes, IdentifyJournalThemesInput } from '@/ai/flows/identify-journal-themes-flow';
import { generatePersonalizedSuggestions, GeneratePersonalizedSuggestionsInput } from '@/ai/flows/generate-personalized-suggestions-flow';
import type { WeeklyRecap } from '../recaps/page'; 

interface EmotionTrendData {
  name: string; 
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

interface DetectedIssueChartData {
  name: string; // Issue name
  value: number; // Occurrences
}

const SENTIMENT_COLORS = {
  positive: 'hsl(var(--chart-1))', 
  negative: 'hsl(var(--chart-5))', 
  neutral: 'hsl(var(--chart-3))',  
};

// Generate distinct colors for pie chart segments
const PIE_CHART_COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))',
  'hsl(var(--primary)/0.7)',
  'hsl(var(--secondary)/0.7)',
  'hsl(var(--accent)/0.7)',
];


export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [emotionTrends, setEmotionTrends] = useState<EmotionTrendData[]>([]);
  const [recurringThemes, setRecurringThemes] = useState<RecurringThemeData[]>([]);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<SuggestionData[]>([]);
  const [detectedIssuesChartData, setDetectedIssuesChartData] = useState<DetectedIssueChartData[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insightsGenerated, setInsightsGenerated] = useState(false);

  // Memoize detected issues chart data generation
  const chartDataForDetectedIssues = useMemo(() => {
    if (user?.detectedIssues) {
      return Object.entries(user.detectedIssues)
        .map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
          value: data.occurrences,
        }))
        .sort((a, b) => b.value - a.value) // Sort by occurrences
        .slice(0, 8); // Limit to top 8 for pie chart readability
    }
    return [];
  }, [user?.detectedIssues]);

  useEffect(() => {
    if (user?.detectedIssues) {
      setDetectedIssuesChartData(chartDataForDetectedIssues);
    }
  }, [user?.detectedIssues, chartDataForDetectedIssues]);


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
    }).reverse(); 
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

      if (weeklyRecapsData.length > 0) {
        const emotionInput: AnalyzeWeeklySentimentsInput = { recapTexts: weeklyRecapsData };
        const emotionOutput = await analyzeWeeklySentiments(emotionInput);
        setEmotionTrends(emotionOutput.trends.map(t => ({ name: t.weekName, positive: t.positive, negative: t.negative, neutral: t.neutral })));
      } else {
        setEmotionTrends([]); 
      }

      if (journalText) {
        const themesInput: IdentifyJournalThemesInput = { journalEntriesText: journalText, maxThemes: 5 };
        const themesOutput = await identifyJournalThemes(themesInput);
        setRecurringThemes(themesOutput.themes);
      } else {
        setRecurringThemes([]);
      }
      
      if (journalText) {
        const suggestionsInput: GeneratePersonalizedSuggestionsInput = { journalEntriesText: journalText, userName: user.displayName || undefined };
        const suggestionsOutput = await generatePersonalizedSuggestions(suggestionsInput);
        setPersonalizedSuggestions(suggestionsOutput.suggestions);
      } else {
        setPersonalizedSuggestions([]);
      }

      // Detected issues are already in user.detectedIssues, update chart data
      setDetectedIssuesChartData(chartDataForDetectedIssues);

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
        <div className="rounded-xl border bg-popover text-popover-foreground p-3 text-sm shadow-lg outline-none animate-in fade-in-0 zoom-in-95">
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

  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border bg-popover text-popover-foreground p-3 text-sm shadow-lg outline-none animate-in fade-in-0 zoom-in-95">
          <p className="font-semibold mb-1">{`${payload[0].name}`}</p>
          <p style={{ color: payload[0].payload.fill }}>{`Occurrences: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };


  if (authLoading && !user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Emotional Insights</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Discover patterns and trends from your journal entries and recaps.
          </p>
        </div>
        <Button onClick={handleGenerateInsights} disabled={isLoading} size="lg" className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
          {isLoading ? 'Generating...' : insightsGenerated ? 'Refresh Insights' : 'Generate Insights'}
        </Button>
      </div>

      {error && (
        <Card className="shadow-lg rounded-xl sm:rounded-2xl border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive-foreground"><AlertTriangle /> Error Generating Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground/90">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !insightsGenerated && !error && (
        <Card className="text-center py-12 sm:py-16 shadow-xl rounded-2xl border-border/50 bg-card">
          <CardHeader>
            <div className="mx-auto bg-secondary/20 p-4 rounded-full w-fit mb-4">
                <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <CardTitle className="mt-2 text-xl sm:text-2xl font-semibold">Ready for Deeper Insights?</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground/90">Click the "Generate Insights" button to analyze your recent activity and uncover personal patterns.</CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {isLoading && (
        <div className="space-y-6">
          {[1,2,3].map(i => (
            <Card key={i} className="shadow-lg rounded-xl sm:rounded-2xl animate-pulse">
                <CardHeader><CardTitle className="h-6 bg-muted rounded w-3/4"></CardTitle><CardDescription className="h-4 bg-muted rounded w-1/2 mt-1"></CardDescription></CardHeader>
                <CardContent className="h-[250px] sm:h-[300px] flex items-center justify-center bg-muted/50 rounded-b-xl sm:rounded-b-2xl"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></CardContent>
            </Card>
          ))}
        </div>
      )}

      {insightsGenerated && !isLoading && !error && (
        <>
          <DashboardCard className="col-span-1 lg:col-span-2">
            <DashboardCardHeader 
              title="Emotion Trends Over Time" 
              description="Visualizing sentiments from your recent weekly recaps (Scores 0-10)." 
              icon={<Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />} 
            />
            <CardContent className="px-2 sm:px-4 pb-4 pt-2 h-[350px] sm:h-[400px]">
              {emotionTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionTrends} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} dy={5} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 10]} dx={-5}/>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.5 }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconSize={10}/>
                    <Bar dataKey="positive" name="Positive" fill={SENTIMENT_COLORS.positive} radius={[4, 4, 0, 0]} barSize={15} />
                    <Bar dataKey="negative" name="Negative" fill={SENTIMENT_COLORS.negative} radius={[4, 4, 0, 0]} barSize={15} />
                    <Bar dataKey="neutral" name="Neutral" fill={SENTIMENT_COLORS.neutral} radius={[4, 4, 0, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-center py-10">No weekly recap data found to display emotion trends. Try generating some recaps.</p>
                </div>
              )}
            </CardContent>
          </DashboardCard>
          
          <div className="grid md:grid-cols-2 gap-6">
            <DashboardCard>
              <DashboardCardHeader 
                title="Recurring Themes" 
                description="Common topics identified from your recent journal entries." 
                icon={<Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />} 
              />
              <CardContent className="px-4 sm:px-6 pb-4 pt-0 min-h-[200px]">
                {recurringThemes.length > 0 ? (
                  <ul className="space-y-2.5">
                    {recurringThemes.map(themeObj => (
                      <li key={themeObj.theme} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <span className="text-sm font-medium text-foreground">{themeObj.theme}</span>
                        <span className="text-xs text-foreground/80 block bg-primary/10 text-primary px-2 py-0.5 rounded-full">{themeObj.mentions} mentions</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                   <div className="h-full flex items-center justify-center py-10">
                        <p className="text-muted-foreground text-center">No recurring themes identified. Keep journaling to discover patterns.</p>
                   </div>
                )}
              </CardContent>
            </DashboardCard>

            <DashboardCard>
              <DashboardCardHeader 
                title="Key Insights & Suggestions" 
                description="Personalized observations based on your journaling." 
                icon={<Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />} 
              />
              <CardContent className="px-4 sm:px-6 pb-4 pt-0 space-y-3 min-h-[200px]">
                {personalizedSuggestions.length > 0 ? (
                  personalizedSuggestions.map((sugg, index) => (
                    <div key={index} className="space-y-2 border-l-4 border-primary/50 pl-3 py-1.5 bg-primary/5 rounded-r-md">
                      <div>
                        <p className="text-xs font-semibold text-primary/90">Observation:</p>
                        <p className="text-sm text-foreground/90">{sugg.observation}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary/90">Suggestion:</p>
                        <p className="text-sm text-foreground/90">{sugg.suggestion}</p>
                      </div>
                      {sugg.affirmation && (
                        <div>
                          <p className="text-xs font-semibold text-primary/90">Affirmation:</p>
                          <p className="text-sm text-foreground/90 italic">"{sugg.affirmation}"</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center py-10">
                    <p className="text-muted-foreground text-center">No specific suggestions at this time. Keep journaling to gain more insights.</p>
                  </div>
                )}
              </CardContent>
            </DashboardCard>
          </div>

          {/* Detected Emotional Patterns Pie Chart */}
          <DashboardCard className="col-span-1 md:col-span-2 lg:col-span-3">
             <DashboardCardHeader 
              title="Detected Emotional Patterns" 
              description="Frequency of themes Mira has noticed in your recent interactions." 
              icon={<PieChartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />} 
            />
            <CardContent className="px-2 sm:px-4 pb-4 pt-2 h-[350px] sm:h-[400px]">
              {detectedIssuesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={detectedIssuesChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={'70%'}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {detectedIssuesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieCustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-center py-10">No specific emotional patterns detected yet. Continue interacting with Mira.</p>
                 </div>
              )}
            </CardContent>
          </DashboardCard>
        </>
      )}
      
      <Card className="mt-8 sm:mt-12 shadow-xl rounded-2xl overflow-hidden bg-card/95">
        <CardContent className="p-0 flex flex-col md:flex-row items-center">
          <div className="p-6 sm:p-8 flex-1 space-y-3">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground">Understanding Your Insights</h3>
            <p className="text-foreground/80 text-sm sm:text-base">
              The insights page is designed to help you connect the dots in your emotional journey. By recognizing patterns in your thoughts, feelings, and behaviors, you can:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80 text-sm sm:text-base">
              <li>Gain deeper self-awareness.</li>
              <li>Identify triggers for certain emotions.</li>
              <li>Recognize unhelpful thinking habits.</li>
              <li>Track the effectiveness of coping strategies.</li>
              <li>Celebrate your progress and growth.</li>
            </ul>
            <p className="text-foreground/80 text-sm sm:text-base pt-1">
              Use these insights as a guide for further reflection and to inform your healing goals.
            </p>
          </div>
          <div className="md:w-1/3 flex-shrink-0 w-full h-48 md:h-auto">
             <Image 
              src="/images/insights/insights-visualization.png"
              alt="Abstract data visualization representing personal insights"
              width={400}
              height={350}
              className="object-cover w-full h-full"
              data-ai-hint="digital brain connection"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const DashboardCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
  >
      <Card className={`shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out rounded-2xl flex flex-col ${className} transform hover:-translate-y-1 bg-card border border-border/50`}>
      {children}
      </Card>
  </motion.div>
);

const DashboardCardHeader = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => (
  <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-5">
    <div className="flex items-center gap-2 sm:gap-3 mb-1">
      <span className="p-1.5 sm:p-2 bg-primary/10 rounded-full text-primary">
        {icon}
      </span>
      <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">{title}</CardTitle>
      <p className='text-muted-foreground/80 text-sm sm:text-base'>{description}</p>
    </div>
  </CardHeader>
)
