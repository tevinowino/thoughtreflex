'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Activity, TrendingUp, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Image from 'next/image';

const mockEmotionData = [
  { name: 'Week 1', joy: 4, sadness: 2, anxiety: 5, anger: 1, calm: 3 },
  { name: 'Week 2', joy: 5, sadness: 1, anxiety: 3, anger: 1, calm: 4 },
  { name: 'Week 3', joy: 3, sadness: 3, anxiety: 4, anger: 2, calm: 2 },
  { name: 'Week 4', joy: 6, sadness: 1, anxiety: 2, anger: 0, calm: 5 },
];

const mockThemeData = [
  { theme: 'Work Stress', mentions: 12, sentiment: -0.5 },
  { theme: 'Relationships', mentions: 8, sentiment: 0.2 },
  { theme: 'Self-Care', mentions: 5, sentiment: 0.8 },
  { theme: 'Future Worries', mentions: 9, sentiment: -0.3 },
];

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Emotional Insights</h1>
        <p className="text-muted-foreground">
          Discover patterns and trends from your journal entries.
        </p>
      </div>

      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Emotion Trends Over Time</CardTitle>
          <CardDescription>Visualizing your emotional landscape across recent weeks.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockEmotionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip wrapperClassName="rounded-lg border bg-popover p-2 text-sm shadow-md outline-none animate-in fade-in-0 zoom-in-95" />
              <Legend />
              <Bar dataKey="joy" fill="var(--chart-1)" />
              <Bar dataKey="sadness" fill="var(--chart-2)" />
              <Bar dataKey="anxiety" fill="var(--chart-3)" />
              <Bar dataKey="calm" fill="var(--chart-4)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-6 w-6 text-primary" /> Recurring Themes</CardTitle>
            <CardDescription>Common topics and their general sentiment in your entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mockThemeData.map(theme => (
                <li key={theme.theme} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-foreground">{theme.theme}</span>
                  <div className="text-right">
                     <span className="text-xs text-foreground/80 block">{theme.mentions} mentions</span>
                     <span className={`text-xs font-semibold ${theme.sentiment > 0 ? 'text-green-600' : theme.sentiment < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {theme.sentiment > 0 ? 'Positive' : theme.sentiment < 0 ? 'Negative' : 'Neutral'}
                     </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary" /> Key Insights & Suggestions</CardTitle>
            <CardDescription>Personalized observations based on your journaling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-accent/20 rounded-lg">
              <p className="text-sm font-semibold text-accent-foreground">Observation:</p>
              <p className="text-sm text-foreground/90">"You've mentioned 'feeling tired' frequently in the past two weeks, often in relation to work tasks."</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-lg">
              <p className="text-sm font-semibold text-secondary-foreground">Suggestion:</p>
              <p className="text-sm text-foreground/90">"Consider exploring time management techniques or discussing workload with your manager. Prioritizing rest could also be beneficial."</p>
            </div>
             <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold text-foreground">Affirmation:</p>
              <p className="text-sm text-foreground/90">"I honor my body's need for rest and recovery."</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
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
              src="https://placehold.co/400x350.png"
              alt="Abstract data visualization"
              width={400}
              height={350}
              className="object-cover w-full h-full"
              data-ai-hint="data chart"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
