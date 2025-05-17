
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { useAuth } from '@/contexts/auth-context';
import { BookText, Target, Sparkles, CalendarCheck, Edit3, Loader2, Flame, ArrowRight } from 'lucide-react';
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
      setIsRecapAvailable(!snapshot.empty);
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
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const DashboardCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <Card className={`shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out rounded-2xl flex flex-col ${className}`}>
      {children}
    </Card>
  );
  
  const DashboardCardHeader = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => (
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <span className="p-2 bg-primary/10 rounded-full text-primary">
          {icon}
        </span>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </div>
      <CardDescription className="text-sm">{description}</CardDescription>
    </CardHeader>
  );


  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Ready to reflect and grow? Here's your space.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow transform hover:scale-105">
          <Link href="/journal/new">
            <Edit3 className="mr-2 h-5 w-5" /> Start New Journal Session
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardCard>
          <DashboardCardHeader title="Recent Journals" description="Continue your reflections." icon={<BookText className="h-6 w-6"/>} />
          <CardContent className="flex-grow">
            {loadingJournals ? (
              <div className="flex items-center justify-center h-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : recentJournals.length > 0 ? (
              <ul className="space-y-3">
                {recentJournals.map(journal => (
                  <li key={journal.id} className="group">
                    <Link href={`/journal/${journal.id}`} className="block p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium text-primary group-hover:underline truncate">{journal.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        Last entry: {journal.lastUpdatedAt.toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground p-3 text-center">No recent journal entries.</p>
            )}
          </CardContent>
          <CardFooter className="p-4 mt-auto border-t">
            <Button variant="ghost" asChild className="w-full text-primary justify-start">
              <Link href="/journal">View All Journals <ArrowRight className="ml-auto h-4 w-4"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="Active Goals" description="Track your progress." icon={<Target className="h-6 w-6"/>} />
          <CardContent className="flex-grow">
             {loadingGoals ? (
              <div className="flex items-center justify-center h-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : activeGoals.length > 0 ? (
              <ul className="space-y-2.5">
                {activeGoals.map(goal => (
                  <li key={goal.id} className="text-sm text-foreground bg-muted/30 p-2.5 rounded-md truncate shadow-sm">
                    {goal.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground p-3 text-center">No active goals set yet.</p>
            )}
          </CardContent>
          <CardFooter className="p-4 mt-auto border-t">
            <Button variant="ghost" asChild className="w-full text-primary justify-start">
              <Link href="/goals">Manage Goals <ArrowRight className="ml-auto h-4 w-4"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>
        
        <DashboardCard>
          <DashboardCardHeader title="Journaling Streak" description="Keep the momentum!" icon={<Flame className="h-6 w-6"/>} />
          <CardContent className="space-y-3 text-center flex-grow flex flex-col justify-center items-center">
            <div className="text-5xl font-bold text-primary">{currentStreak}</div>
            <p className="text-lg text-muted-foreground">{currentStreak === 1 ? 'Day' : 'Days'}</p>
            <p className="text-xs text-muted-foreground">Longest Streak: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}</p>
            {currentStreak === 0 && <p className="text-sm text-muted-foreground mt-2">Start journaling today!</p>}
            {currentStreak > 0 && <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">Great job! Keep it up!</p>}
          </CardContent>
           <CardFooter className="p-4 mt-auto border-t">
            <p className="text-xs text-muted-foreground text-center w-full">Journal daily to build your streak.</p>
          </CardFooter>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="Weekly Recap" description="Review your week." icon={<CalendarCheck className="h-6 w-6"/>} />
          <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
            {loadingRecap ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : isRecapAvailable ? (
                 <p className="text-sm text-foreground">Your latest weekly recap is ready!</p>
            ) : (
                 <p className="text-sm text-muted-foreground">Your weekly recap is not yet available. Keep journaling!</p>
            )}
          </CardContent>
          <CardFooter className="p-4 mt-auto border-t">
            <Button variant="ghost" asChild className="w-full text-primary justify-start">
              <Link href="/recaps">View Recaps <ArrowRight className="ml-auto h-4 w-4"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>
      </div>

      <DashboardCard className="lg:col-span-2 xl:col-span-4">
        <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
                <span className="p-2 bg-primary/10 rounded-full text-primary">
                    <Sparkles className="h-6 w-6" />
                </span>
                <CardTitle className="text-xl font-semibold">Discover Insights</CardTitle>
            </div>
            <CardDescription>Uncover patterns and gain deeper understanding of your emotional landscape.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6 pt-0">
          <div className="flex-1 space-y-4">
            <p className="text-foreground/80 text-base">
              ThoughtReflex helps you identify recurring themes, emotional trends, and offers personalized suggestions. 
              These insights can empower you to make positive changes and understand yourself better.
            </p>
            <Button variant="outline" asChild className="shadow-sm hover:shadow-md transition-shadow">
              <Link href="/insights">Explore Your Insights <ArrowRight className="ml-2 h-4 w-4"/></Link>
            </Button>
          </div>
           <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4">
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="Abstract representation of personal insights" 
              width={600} 
              height={400} 
              className="rounded-xl object-cover shadow-md"
              data-ai-hint="abstract mind map"
            />
          </div>
        </CardContent>
      </DashboardCard>
    </div>
  );
}
