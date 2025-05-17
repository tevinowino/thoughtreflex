
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { BookText, Target, Sparkles, CalendarCheck, Edit3, Loader2, Flame, ArrowRight, Smile, Meh, Frown, Save } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

type MoodOption = 'positive' | 'neutral' | 'negative';

export default function DashboardPage() {
  const { user, loading: authLoading, updateUserProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [recentJournals, setRecentJournals] = useState<RecentJournal[]>([]);
  const [activeGoals, setActiveGoals] = useState<GoalSummary[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(true);
  const [isRecapAvailable, setIsRecapAvailable] = useState(false); 
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [currentDayMood, setCurrentDayMood] = useState<MoodOption | null>(null);
  const [loadingMood, setLoadingMood] = useState(true);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user || authLoading) return;

    setCurrentStreak(user.currentStreak || 0);
    setLongestStreak(user.longestStreak || 0);

    // Fetch Today's Mood
    setLoadingMood(true);
    const todayDateStr = getTodayDateString();
    if (user.latestMood && user.latestMood.date === todayDateStr) {
      setCurrentDayMood(user.latestMood.mood);
      setLoadingMood(false);
    } else {
      // Check dailyMoods collection if latestMood is outdated or not present
      const moodDocRef = doc(db, 'users', user.uid, 'dailyMoods', todayDateStr);
      getDoc(moodDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setCurrentDayMood(docSnap.data().mood as MoodOption);
        } else {
          setCurrentDayMood(null);
        }
        setLoadingMood(false);
      }).catch(err => {
        console.error("Error fetching today's mood:", err);
        setLoadingMood(false);
      });
    }
    

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

  const handleLogMood = async (mood: MoodOption) => {
    if (!user) return;
    const todayDateStr = getTodayDateString();
    const moodData = {
      mood: mood,
      date: todayDateStr,
      timestamp: serverTimestamp(),
    };

    try {
      const dailyMoodDocRef = doc(db, 'users', user.uid, 'dailyMoods', todayDateStr);
      await setDoc(dailyMoodDocRef, { mood: mood, timestamp: serverTimestamp() });
      await updateUserProfile({ latestMood: { mood, date: todayDateStr } }); // Update main profile too
      setCurrentDayMood(mood);
      toast({ title: "Mood Logged!", description: `Your mood for today has been logged as ${mood}.` });
      if (refreshUserProfile) await refreshUserProfile(); // Ensure latestMood is reflected in context
    } catch (error) {
      console.error("Error logging mood:", error);
      toast({ title: "Error", description: "Could not log your mood.", variant: "destructive" });
    }
  };

  const moodConfig = {
    positive: { color: 'bg-green-500', darkColor: 'dark:bg-green-400', text: 'Feeling Positive!', icon: <Smile className="h-5 w-5 text-white" /> },
    neutral: { color: 'bg-yellow-500', darkColor: 'dark:bg-yellow-400', text: 'Feeling Neutral.', icon: <Meh className="h-5 w-5 text-white" /> },
    negative: { color: 'bg-red-500', darkColor: 'dark:bg-red-400', text: 'Feeling a Bit Down.', icon: <Frown className="h-5 w-5 text-white" /> },
  };

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
    <div className="max-w-[2000px] mx-auto p-4 lg:p-8 space-y-6 lg:space-y-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-background/95 to-background p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="transform transition hover:translate-x-2">
            <h1 className="text-4xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-primary/80">{user?.displayName?.split(' ')[0] || 'User'}</h1>
            <p className="mt-3 text-lg lg:text-xl text-muted-foreground">
              Your personal space for reflection and growth.
            </p>
          </div>
          <Button asChild size="lg" className="w-full lg:w-auto shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-r from-primary to-primary/90 rounded-2xl">
            <Link href="/journal/new">
              <Edit3 className="mr-3 h-5 w-5" /> New Journal Entry
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <DashboardCard className="bg-card/90 backdrop-filter backdrop-blur-lg transform transition-all duration-300 hover:-translate-y-2">
          <DashboardCardHeader title="Daily Mood" description="Track your emotional journey" icon={<Smile className="h-6 w-6" />} />
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <Button onClick={() => handleLogMood('positive')} variant={currentDayMood === 'positive' ? "default" : "outline"} 
                className="h-12 bg-green-500/10 hover:bg-green-500/20 border-green-500/30">
                <Smile className="h-5 w-5" />
              </Button>
              <Button onClick={() => handleLogMood('neutral')} variant={currentDayMood === 'neutral' ? "default" : "outline"} 
                className="h-12 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30">
                <Meh className="h-5 w-5" />
              </Button>
              <Button onClick={() => handleLogMood('negative')} variant={currentDayMood === 'negative' ? "default" : "outline"} 
                className="h-12 bg-red-500/10 hover:bg-red-500/20 border-red-500/30">
                <Frown className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t border-border/50">
            {loadingMood ? (
              <div className="w-full flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : currentDayMood ? (
              <div className={`w-full p-2 rounded-xl text-center text-white ${moodConfig[currentDayMood].color}`}>
                {moodConfig[currentDayMood].text}
              </div>
            ) : (
              <p className="text-sm text-center text-muted-foreground w-full">Log today's mood</p>
            )}
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="bg-card/90 backdrop-filter backdrop-blur-lg transform transition-all duration-300 hover:-translate-y-2">
          <DashboardCardHeader title="Journal Entries" description="Your recent reflections" icon={<BookText className="h-6 w-6" />} />
          <CardContent className="p-4">
            {loadingJournals ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentJournals.length > 0 ? (
              <ul className="space-y-3">
                {recentJournals.map(journal => (
                  <li key={journal.id}>
                    <Link href={`/journal/${journal.id}`} className="block p-3 rounded-xl hover:bg-primary/5 border border-border/50 hover:border-primary/20">
                      <h4 className="font-medium truncate">{journal.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{journal.lastUpdatedAt.toLocaleDateString()}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground p-4">Start your first journal entry</p>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t border-border/50">
            <Button variant="ghost" asChild className="w-full">
              <Link href="/journal">All Journals <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="bg-card/90 backdrop-filter backdrop-blur-lg transform transition-all duration-300 hover:-translate-y-2">
          <DashboardCardHeader title="Goals" description="Your active objectives" icon={<Target className="h-6 w-6" />} />
          <CardContent className="p-4">
            {loadingGoals ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : activeGoals.length > 0 ? (
              <ul className="space-y-3">
                {activeGoals.map(goal => (
                  <li key={goal.id} className="p-3 rounded-xl bg-primary/5 border border-border/50">
                    {goal.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground p-4">Set your first goal</p>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t border-border/50">
            <Button variant="ghost" asChild className="w-full">
              <Link href="/goals">Manage Goals <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="bg-card/90 backdrop-filter backdrop-blur-lg transform transition-all duration-300 hover:-translate-y-2">
          <DashboardCardHeader title="Streak" description="Your consistency score" icon={<Flame className="h-6 w-6" />} />
          <CardContent className="p-4 text-center">
            <div className="text-6xl font-bold text-primary">{currentStreak}</div>
            <p className="mt-2 text-lg">{currentStreak === 1 ? 'Day' : 'Days'}</p>
            <p className="text-sm text-muted-foreground mt-1">Best: {longestStreak} days</p>
            {currentStreak > 0 && (
              <p className="mt-4 text-sm text-green-500">Keep going strong! 🌟</p>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t border-border/50">
            <p className="text-sm text-center text-muted-foreground w-full">Journal daily to maintain your streak</p>
          </CardFooter>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DashboardCard className="bg-card/90 backdrop-filter backdrop-blur-lg transform transition-all duration-300 hover:-translate-y-2">
          <DashboardCardHeader title="Weekly Review" description="Your progress this week" icon={<CalendarCheck className="h-6 w-6" />} />
          <CardContent className="p-6 text-center">
            {loadingRecap ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            ) : isRecapAvailable ? (
              <p className="text-lg">Your weekly insights are ready!</p>
            ) : (
              <p className="text-muted-foreground">Continue journaling for insights</p>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t border-border/50">
            <Button variant="ghost" asChild className="w-full">
              <Link href="/recaps">View Recaps <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="bg-card/90 backdrop-filter backdrop-blur-lg transform transition-all duration-300 hover:-translate-y-2">
          <DashboardCardHeader title="Insights" description="Understand your patterns" icon={<Sparkles className="h-6 w-6" />} />
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-1">
                <p className="text-lg leading-relaxed">
                  Discover patterns in your emotional journey and get personalized insights.
                </p>
                <Button variant="outline" asChild className="mt-4">
                  <Link href="/insights">View Insights <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="w-full lg:w-1/3">
                <Image 
                  src="/images/dashboard/insights-promo.png" 
                  alt="Insights visualization" 
                  width={300} 
                  height={300} 
                  className="rounded-xl shadow-lg"
                />
              </div>
            </div>
          </CardContent>
        </DashboardCard>
      </div>
    </div>
  )
}
