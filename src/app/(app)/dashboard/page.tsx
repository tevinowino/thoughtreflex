
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { BookText, Target, Sparkles, CalendarCheck, Edit3, Loader2, Flame, ArrowRight, Smile, Meh, Frown, Save, Sunrise } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { WeeklyRecap } from '../recaps/page'; 
import { generateDailyAffirmation, GenerateDailyAffirmationOutput } from '@/ai/flows/generate-affirmation-flow';
import { motion } from 'framer-motion';

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
  const [dailyAffirmation, setDailyAffirmation] = useState<string | null>(null);
  const [loadingAffirmation, setLoadingAffirmation] = useState(true);

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
    
    // Fetch Daily Affirmation
    setLoadingAffirmation(true);
    const storedAffirmation = sessionStorage.getItem('dailyAffirmation');
    const storedAffirmationDate = sessionStorage.getItem('dailyAffirmationDate');

    if (storedAffirmation && storedAffirmationDate === todayDateStr) {
      setDailyAffirmation(storedAffirmation);
      setLoadingAffirmation(false);
    } else {
      generateDailyAffirmation()
        .then((output: GenerateDailyAffirmationOutput) => {
          setDailyAffirmation(output.affirmation);
          sessionStorage.setItem('dailyAffirmation', output.affirmation);
          sessionStorage.setItem('dailyAffirmationDate', todayDateStr);
        })
        .catch(err => {
          console.error("Error fetching daily affirmation:", err);
          setDailyAffirmation("Remember to be kind to yourself today. Every step forward is progress."); // Fallback
        })
        .finally(() => setLoadingAffirmation(false));
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
      // toast({ title: "Error", description: "Could not load recent journals.", variant: "destructive" });
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
      // toast({ title: "Error", description: "Could not load active goals.", variant: "destructive" });
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
    
    try {
      const dailyMoodDocRef = doc(db, 'users', user.uid, 'dailyMoods', todayDateStr);
      await setDoc(dailyMoodDocRef, { mood: mood, timestamp: serverTimestamp() }, { merge: true });
      
      // Optimistically update local state
      setCurrentDayMood(mood);
      
      // Update main user profile in AuthContext and Firestore
      await updateUserProfile({ latestMood: { mood, date: todayDateStr } });
      if (refreshUserProfile) await refreshUserProfile();

      toast({ title: "Mood Logged!", description: `Your mood for today has been logged as ${mood}.` });
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
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
    >
        <Card className={`shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out rounded-2xl flex flex-col ${className} transform hover:-translate-y-1`}>
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
      </div>
      {description && <CardDescription className="text-xs sm:text-sm text-muted-foreground">{description}</CardDescription>}
    </CardHeader>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <motion.div 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-background via-muted/50 to-background p-6 lg:p-8 shadow-lg border border-border/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">
                Welcome, {user?.displayName?.split(' ')[0] || 'User'}!
              </span>
            </h1>
            <p className="mt-2 text-base md:text-lg text-muted-foreground">
              Your personal space for reflection and growth.
            </p>
          </div>
          <Button asChild size="lg" className="w-full lg:w-auto shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 bg-primary hover:bg-primary/90 rounded-xl">
            <Link href="/journal/new">
              <Edit3 className="mr-2 h-5 w-5" /> New Journal Session
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Daily Affirmation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <Card className="bg-gradient-to-r from-accent/30 via-background to-accent/30 dark:from-accent/20 dark:via-background dark:to-accent/20 shadow-lg rounded-2xl border-accent/50">
            <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Sunrise className="h-7 w-7 text-amber-500" />
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">Your Daily Affirmation</h3>
                </div>
                {loadingAffirmation ? (
                    <div className="flex justify-center items-center h-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <p className="text-base sm:text-lg text-foreground/80 italic">"{dailyAffirmation}"</p>
                )}
            </CardContent>
        </Card>
      </motion.div>


      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <DashboardCard className="bg-card">
          <DashboardCardHeader title="Daily Mood" description="Track your emotional journey" icon={<Smile className="h-5 w-5 sm:h-6 sm:w-6" />} />
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 flex-grow">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(['positive', 'neutral', 'negative'] as MoodOption[]).map(moodOption => (
                <Button 
                  key={moodOption}
                  onClick={() => handleLogMood(moodOption)} 
                  variant="outline"
                  className={`h-12 sm:h-14 text-lg rounded-lg transition-all duration-200 ease-in-out
                    hover:bg-opacity-20 focus:ring-offset-2 focus:ring-offset-background
                    ${currentDayMood === moodOption 
                      ? `ring-2 ring-primary bg-primary/10 text-primary dark:bg-primary/20` 
                      : `text-muted-foreground hover:text-primary hover:border-primary/50`
                    }
                    ${moodOption === 'positive' ? 'hover:bg-green-500/10 hover:border-green-500/50' : ''}
                    ${moodOption === 'neutral' ? 'hover:bg-yellow-500/10 hover:border-yellow-500/50' : ''}
                    ${moodOption === 'negative' ? 'hover:bg-red-500/10 hover:border-red-500/50' : ''}
                  `}
                >
                   {moodOption === 'positive' && <Smile className="h-5 w-5 sm:h-6 sm:w-6" />}
                   {moodOption === 'neutral' && <Meh className="h-5 w-5 sm:h-6 sm:w-6" />}
                   {moodOption === 'negative' && <Frown className="h-5 w-5 sm:h-6 sm:w-6" />}
                </Button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            {loadingMood ? (
              <div className="w-full flex justify-center items-center h-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : currentDayMood ? (
              <div className={`w-full p-2.5 rounded-lg text-center text-sm font-medium text-white ${moodConfig[currentDayMood].color} flex items-center justify-center gap-2`}>
                {moodConfig[currentDayMood].icon} {moodConfig[currentDayMood].text}
              </div>
            ) : (
              <p className="text-sm text-center text-muted-foreground w-full">Log today's mood</p>
            )}
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="bg-card">
          <DashboardCardHeader title="Recent Journals" description="Your latest reflections" icon={<BookText className="h-5 w-5 sm:h-6 sm:w-6" />} />
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 flex-grow">
            {loadingJournals ? (
              <div className="h-[150px] sm:h-[200px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentJournals.length > 0 ? (
              <ul className="space-y-2 sm:space-y-3">
                {recentJournals.map(journal => (
                  <li key={journal.id} className="group">
                    <Link href={`/journal/${journal.id}`} className="block p-3 rounded-xl hover:bg-primary/5 border border-border/50 hover:border-primary/20 transition-all">
                      <h4 className="font-medium text-foreground group-hover:translate-x-1 transition-transform truncate">{journal.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{journal.lastUpdatedAt.toLocaleDateString()}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">Start your first journal entry!</p>
            )}
          </CardContent>
          <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            <Button variant="ghost" asChild className="w-full text-primary justify-start group">
              <Link href="/journal">View All Journals <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="bg-card">
          <DashboardCardHeader title="Active Goals" description="Your current objectives" icon={<Target className="h-5 w-5 sm:h-6 sm:w-6" />} />
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 flex-grow">
            {loadingGoals ? (
              <div className="h-[150px] sm:h-[200px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activeGoals.length > 0 ? (
              <ul className="space-y-2 sm:space-y-3">
                {activeGoals.map(goal => (
                  <li key={goal.id} className="p-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground truncate">
                    {goal.text}
                  </li>
                ))}
              </ul>
            ) : (
               <p className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">Set your first goal to get started!</p>
            )}
          </CardContent>
          <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            <Button variant="ghost" asChild className="w-full text-primary justify-start group">
              <Link href="/goals">Manage Goals <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="bg-card">
          <DashboardCardHeader title="Journaling Streak" description="Your consistency score" icon={<Flame className="h-5 w-5 sm:h-6 sm:w-6" />} />
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 text-center flex-grow flex flex-col justify-center items-center">
            <div className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{currentStreak}</div>
            <p className="mt-1 text-lg text-muted-foreground">{currentStreak === 1 ? 'Day' : 'Days'}</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80 mt-2">Best: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}</p>
            {currentStreak > 0 && (
              <p className="mt-3 text-sm text-green-500 dark:text-green-400 font-medium">Keep the flame alive! 🔥</p>
            )}
          </CardContent>
           <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            <p className="text-xs text-center text-muted-foreground w-full">Journal daily to maintain your streak.</p>
          </CardFooter>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <DashboardCard className="bg-card lg:col-span-1">
          <DashboardCardHeader title="Weekly Review" description="Your progress this week" icon={<CalendarCheck className="h-5 w-5 sm:h-6 sm:w-6" />} />
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 text-center flex-grow flex flex-col justify-center items-center">
            {loadingRecap ? (
                <div className="h-16 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
            ) : isRecapAvailable ? (
              <p className="text-base text-foreground">Your latest weekly insights are ready!</p>
            ) : (
              <p className="text-sm text-muted-foreground">Continue journaling for weekly insights.</p>
            )}
          </CardContent>
          <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
            <Button variant="ghost" asChild className="w-full text-primary justify-start group">
              <Link href="/recaps">View All Recaps <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"/></Link>
            </Button>
          </CardFooter>
        </DashboardCard>

        <DashboardCard className="bg-card lg:col-span-2">
          <DashboardCardHeader title="Discover Insights" description="Understand your patterns" icon={<Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />} />
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 flex-grow">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
              <div className="flex-1">
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  Uncover emotional trends, recurring themes, and get personalized suggestions based on your reflections.
                </p>
                <Button variant="outline" asChild className="mt-4 shadow-sm hover:shadow-md">
                  <Link href="/insights">View Insights <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="w-full md:w-1/3 lg:w-2/5 flex-shrink-0 mt-4 md:mt-0">
                <Image 
                  src="/insights.png" 
                  alt="Abstract visualization representing personal insights" 
                  width={300} 
                  height={200} 
                  className="rounded-xl shadow-lg object-cover w-full h-auto"
                />
              </div>
            </div>
          </CardContent>
        </DashboardCard>
      </div>
    </div>
  )
}
