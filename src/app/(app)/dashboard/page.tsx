
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
      if (fetchedGoals.length > 0 && !sessionStorage.getItem('goalReminderShown')) {
        toast({ 
          title: "Goal Reminder ✨", 
          description: "Don't forget to check in on your active goals today! You're making great progress." 
        });
        sessionStorage.setItem('goalReminderShown', 'true');
      }
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
      const recapExists = !snapshot.empty;
      setIsRecapAvailable(recapExists);
      setLoadingRecap(false);
      if (recapExists && !sessionStorage.getItem('recapReminderShown')) {
        toast({ 
          title: "Weekly Recap Ready! 🗓️", 
          description: "Your latest weekly insights await! Take a moment to reflect." 
        });
        sessionStorage.setItem('recapReminderShown', 'true');
      }
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
    <CardHeader className="pb-3 sm:pb-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-1">
        <span className="p-1.5 sm:p-2 bg-primary/10 rounded-full text-primary">
          {icon}
        </span>
        <CardTitle className="text-lg sm:text-xl font-semibold">{title}</CardTitle>
      </div>
      <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
    </CardHeader>
  );


  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background to-background/95">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-primary/10">
        <div className="transform transition-all duration-500 hover:scale-[1.02]">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80 tracking-tight">{user?.displayName?.split(' ')[0] || 'User'}!</h1>
          <p className="text-lg sm:text-xl text-muted-foreground/90 mt-2 sm:mt-3 font-medium leading-relaxed">
            Ready to reflect and grow? Here's your personalized space.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-110 bg-gradient-to-r from-primary to-primary/90 rounded-xl sm:rounded-2xl text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
          <Link href="/journal/new">
            <Edit3 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-pulse" /> Start New Journal Session
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardCard className="backdrop-blur-md bg-card/95 hover:translate-y-[-6px] sm:hover:translate-y-[-8px]">
          <DashboardCardHeader title="Recent Journals" description="Continue your journey of self-reflection." icon={<BookText className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse"/>} />
          <CardContent className="flex-grow px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
            {loadingJournals ? (
              <div className="flex items-center justify-center h-24 sm:h-32"><Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" /></div>
            ) : recentJournals.length > 0 ? (
              <ul className="space-y-3 sm:space-y-4">
                {recentJournals.map(journal => (
                  <li key={journal.id} className="group transform transition-all duration-300">
                    <Link href={`/journal/${journal.id}`} className="block p-3 sm:p-4 rounded-xl hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/20">
                      <h4 className="font-semibold text-primary group-hover:text-primary/80 group-hover:translate-x-1 transition-all duration-300 text-base sm:text-lg truncate">{journal.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground/80 mt-0.5 sm:mt-1">
                        Last entry: {journal.lastUpdatedAt.toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground/90 p-3 sm:p-4 text-center italic">No recent journal entries.</p>
            )}
          </CardContent>
          <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            <Button variant="ghost" asChild className="w-full text-primary justify-start hover:bg-primary/10 rounded-lg sm:rounded-xl text-sm sm:text-base">
              <Link href="/journal">View All Journals <ArrowRight className="ml-auto h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="backdrop-blur-md bg-card/95 hover:translate-y-[-6px] sm:hover:translate-y-[-8px]">
          <DashboardCardHeader title="Active Goals" description="Track your journey to success." icon={<Target className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse"/>} />
          <CardContent className="flex-grow px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
             {loadingGoals ? (
              <div className="flex items-center justify-center h-24 sm:h-32"><Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" /></div>
            ) : activeGoals.length > 0 ? (
              <ul className="space-y-3 sm:space-y-4">
                {activeGoals.map(goal => (
                  <li key={goal.id} className="text-sm sm:text-base text-foreground bg-primary/5 p-3 sm:p-4 rounded-xl truncate shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/10 hover:border-primary/30 hover:translate-x-1">
                    {goal.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground/90 p-3 sm:p-4 text-center italic">No active goals set yet.</p>
            )}
          </CardContent>
          <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            <Button variant="ghost" asChild className="w-full text-primary justify-start hover:bg-primary/10 rounded-lg sm:rounded-xl text-sm sm:text-base">
              <Link href="/goals">Manage Goals <ArrowRight className="ml-auto h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>
        
        <DashboardCard className="backdrop-blur-md bg-card/95 hover:translate-y-[-6px] sm:hover:translate-y-[-8px]">
          <DashboardCardHeader title="Journaling Streak" description="Keep your momentum soaring!" icon={<Flame className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse"/>} />
          <CardContent className="space-y-3 sm:space-y-4 text-center flex-grow flex flex-col justify-center items-center p-4 sm:p-6">
            <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">{currentStreak}</div>
            <p className="text-lg sm:text-xl font-medium text-muted-foreground/90">{currentStreak === 1 ? 'Day' : 'Days'}</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80">Longest Streak: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}</p>
            {currentStreak === 0 && <p className="text-sm sm:text-base text-muted-foreground/90 mt-2 sm:mt-3 italic">Start your journey today!</p>}
            {currentStreak > 0 && <p className="text-sm sm:text-base text-green-500 dark:text-green-400 font-semibold mt-2 sm:mt-3">Outstanding progress! Keep shining! ✨</p>}
          </CardContent>
           <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            <p className="text-xs sm:text-sm text-muted-foreground/90 text-center w-full font-medium">Journal daily to build your legendary streak.</p>
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="backdrop-blur-md bg-card/95 hover:translate-y-[-6px] sm:hover:translate-y-[-8px]">
          <DashboardCardHeader title="Weekly Recap" description="Reflect on your weekly journey." icon={<CalendarCheck className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse"/>} />
          <CardContent className="flex-grow flex flex-col items-center justify-center text-center p-4 sm:p-6">
            {loadingRecap ? (
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            ) : isRecapAvailable ? (
                 <p className="text-base sm:text-lg text-foreground font-medium">Your latest weekly insights await! ✨</p>
            ) : (
                 <p className="text-sm sm:text-base text-muted-foreground/90 italic">Keep journaling to unlock your weekly insights!</p>
            )}
          </CardContent>
          <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            <Button variant="ghost" asChild className="w-full text-primary justify-start hover:bg-primary/10 rounded-lg sm:rounded-xl text-sm sm:text-base">
              <Link href="/recaps">View Recaps <ArrowRight className="ml-auto h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>
      </div>

      <DashboardCard className="lg:col-span-2 xl:col-span-4 backdrop-blur-md bg-card/95 hover:translate-y-[-6px] sm:hover:translate-y-[-8px]">
        <CardHeader className="pb-4 sm:pb-6 p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
                <span className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl text-primary">
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse" />
                </span>
                <CardTitle className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">Discover Insights</CardTitle>
            </div>
            <CardDescription className="text-base sm:text-lg text-muted-foreground/90">Uncover patterns and gain deeper understanding of your emotional landscape.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6 sm:gap-10 pt-0 p-4 sm:p-6 md:p-8">
          <div className="flex-1 space-y-4 sm:space-y-6">
            <p className="text-foreground/90 text-base sm:text-lg leading-relaxed">
              ThoughtReflex helps you identify recurring themes, emotional trends, and offers personalized suggestions. 
              These insights can empower you to make positive changes and understand yourself better.
            </p>
            <Button variant="outline" asChild className="shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 rounded-lg sm:rounded-xl border-primary/20 text-sm sm:text-base">
              <Link href="/insights">Explore Your Insights <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 animate-pulse"/></Link>
            </Button>
          </div>
           <div className="flex-shrink-0 w-full md:w-2/5 lg:w-1/3 transform transition-all duration-500 hover:scale-105">
            <Image 
              src="/images/dashboard/insights-promo.png" 
              alt="Abstract representation of personal insights" 
              width={600} 
              height={600} 
              className="rounded-xl sm:rounded-2xl object-cover shadow-2xl hover:shadow-3xl transition-all duration-500"
            />
          </div>
        </CardContent>
      </DashboardCard>
    </div>
  );
}

    
