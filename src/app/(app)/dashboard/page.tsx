
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { BookText, Target, Sparkles, CalendarCheck, Edit3, Loader2, Flame } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { WeeklyRecap } from '../recaps/page'; 

interface RecentJournal {
  id: string;
  title: string;
  lastUpdatedAt: Date;
}

interface GoalSummary {
  id: string;
  text: string;
  isCompleted: boolean;
}


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [recentJournals, setRecentJournals] = useState<RecentJournal[]>([]);
  const [activeGoals, setActiveGoals] = useState<GoalSummary[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(true);
  const [isRecapAvailable, setIsRecapAvailable] = useState(false); 
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);


  useEffect(() => {
    if (!user || authLoading) return;

    setCurrentStreak(user.currentStreak || 0);
    setLongestStreak(user.longestStreak || 0);

    // Fetch Recent Journals
    setLoadingJournals(true);
    const journalsQuery = query(
      collection(db, 'users', user.uid, 'journalSessions'),
      orderBy('lastUpdatedAt', 'desc'),
      limit(3)
    );
    const unsubscribeJournals = onSnapshot(journalsQuery, (snapshot) => {
      const fetchedJournals = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || `Session from ${(doc.data().createdAt.toDate() as Date).toLocaleDateString()}`,
        lastUpdatedAt: (doc.data().lastUpdatedAt as Timestamp).toDate(),
      }));
      setRecentJournals(fetchedJournals);
      setLoadingJournals(false);
    }, (error) => {
      console.error("Error fetching recent journals:", error);
      toast({ title: "Error", description: "Could not load recent journals.", variant: "destructive" });
      setLoadingJournals(false);
    });

    // Fetch Active Goals
    setLoadingGoals(true);
    const goalsQuery = query(
      collection(db, 'users', user.uid, 'goals'),
      where('isCompleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const fetchedGoals = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        isCompleted: doc.data().isCompleted,
      }));
      setActiveGoals(fetchedGoals);
      setLoadingGoals(false);
    }, (error) => {
      console.error("Error fetching active goals:", error);
      toast({ title: "Error", description: "Could not load active goals.", variant: "destructive" });
      setLoadingGoals(false);
    });
    
    setLoadingRecap(true);
    const recapsQuery = query(
      collection(db, 'users', user.uid, 'weeklyRecaps'),
      orderBy('generatedAt', 'desc'),
      limit(1)
    );
    const unsubscribeRecaps = onSnapshot(recapsQuery, (snapshot) => {
      if (!snapshot.empty) {
        setIsRecapAvailable(true);
      } else {
        setIsRecapAvailable(false);
      }
      setLoadingRecap(false);
    }, (error) => {
      console.error("Error fetching weekly recaps:", error);
      setIsRecapAvailable(false);
      setLoadingRecap(false);
    });


    return () => {
      unsubscribeJournals();
      unsubscribeGoals();
      unsubscribeRecaps();
    };
  }, [user, authLoading, toast]);


  if (authLoading || !user) {
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
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!</h1>
          <p className="text-muted-foreground">
            Ready to reflect and grow? Here's your space.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/journal/new">
            <Edit3 className="mr-2 h-5 w-5" /> Start New Journal Session
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookText className="h-6 w-6 text-primary" />
              Recent Journals
            </CardTitle>
            <CardDescription>Continue your reflections or start a new entry.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingJournals ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentJournals.length > 0 ? (
              <ul className="space-y-2">
                {recentJournals.map(journal => (
                  <li key={journal.id} className="text-sm hover:bg-muted/50 p-2 rounded-md">
                    <Link href={`/journal/${journal.id}`} className="block text-primary hover:underline truncate">
                      {journal.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Last entry: {journal.lastUpdatedAt.toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent journal entries found.</p>
            )}
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/journal">View All Journals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Your Active Goals
            </CardTitle>
            <CardDescription>Track your progress towards emotional well-being.</CardDescription>
          </CardHeader>
          <CardContent>
             {loadingGoals ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activeGoals.length > 0 ? (
              <ul className="space-y-2">
                {activeGoals.map(goal => (
                  <li key={goal.id} className="text-sm text-foreground truncate p-1">
                    {goal.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">You haven't set any active goals yet.</p>
            )}
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/goals">Manage Goals</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              Journaling Streak
            </CardTitle>
            <CardDescription>Keep your reflection momentum going!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg text-foreground">Current Streak: <span className="font-bold">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</span></p>
            <p className="text-sm text-muted-foreground">Longest Streak: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}</p>
            {currentStreak === 0 && <p className="text-sm text-muted-foreground">Start journaling today to build your streak!</p>}
             {currentStreak > 0 && <p className="text-sm text-primary">Great job! Keep it up!</p>}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />
              Weekly Recap
            </CardTitle>
            <CardDescription>Review your emotional trends and victories.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecap ? (
                <div className="flex items-center justify-center h-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : isRecapAvailable ? (
                 <p className="text-sm text-foreground">Your latest weekly recap is ready!</p>
            ) : (
                 <p className="text-sm text-muted-foreground">Your weekly recap is not yet available.</p>
            )}
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/recaps">View Recaps</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl overflow-hidden">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Discover Insights
            </CardTitle>
            <CardDescription>Uncover patterns and gain deeper understanding of your emotional landscape.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-3">
            <p className="text-foreground/80">
              ThoughtReflex helps you identify recurring themes like anxiety, burnout, or moments of joy. 
              These insights can empower you to make positive changes.
            </p>
            <Button variant="outline" asChild>
              <Link href="/insights">Explore Your Insights</Link>
            </Button>
          </div>
           <div className="flex-shrink-0">
            <Image 
              src="https://placehold.co/300x200.png" 
              alt="Abstract representation of insights" 
              width={300} 
              height={200} 
              className="rounded-lg object-cover"
              data-ai-hint="abstract mind"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
