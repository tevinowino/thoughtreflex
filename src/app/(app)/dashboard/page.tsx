
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { BookText, Target, Sparkles, CalendarCheck, Edit3, Loader2, Flame, ArrowRight, Smile, Meh, Frown, Save, Sunrise, CheckCircle, Clock, BookOpen } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6 lg:space-y-10">
        {/* Hero Welcome Section with improved visual impact */}
        <motion.div 
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-background via-muted/50 to-background p-6 lg:p-10 shadow-xl border border-border/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">
                  Welcome, {user?.displayName?.split(' ')[0] || 'User'}!
                </span>
              </h1>
              <p className="mt-2 text-base md:text-lg text-muted-foreground max-w-md">
                Your personal space for reflection and growth. What's on your mind today?
              </p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-primary hover:bg-primary/90 rounded-xl text-base">
              <Link href="/journal/new">
                <Edit3 className="mr-2 h-5 w-5" /> New Journal Entry
              </Link>
            </Button>
          </div>
        </motion.div>
  
        {/* Daily Affirmation Section with Visual Enhancement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="w-full"
        >
          <Card className="bg-gradient-to-r from-accent/20 via-background to-accent/20 dark:from-accent/10 dark:via-background dark:to-accent/10 shadow-lg rounded-2xl border-accent/40 overflow-hidden">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="inline-flex items-center justify-center gap-3 mb-4 bg-accent/10 px-4 py-2 rounded-full">
                <Sunrise className="h-6 w-6 text-amber-500" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">Today's Affirmation</h3>
              </div>
              {loadingAffirmation ? (
                <div className="flex justify-center items-center h-16">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : (
                <p className="text-base sm:text-xl md:text-2xl text-foreground/80 italic font-serif">"{dailyAffirmation}"</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
  
        {/* Main Dashboard Content with Better Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Daily Mood Card with Improved UX */}
          <DashboardCard className="bg-card/90 backdrop-blur-sm">
            <DashboardCardHeader 
              title="Daily Mood" 
              description="How are you feeling today?" 
              icon={<Smile className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />} 
            />
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 flex-grow">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {(['positive', 'neutral', 'negative'] as MoodOption[]).map(moodOption => (
                  <Button 
                    key={moodOption}
                    onClick={() => handleLogMood(moodOption)} 
                    variant="outline"
                    className={`h-16 sm:h-20 rounded-xl transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-1
                      ${currentDayMood === moodOption 
                        ? `ring-2 ring-primary bg-primary/10 text-primary dark:bg-primary/20 shadow-inner` 
                        : `text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-md`
                      }
                      ${moodOption === 'positive' ? 'hover:bg-green-500/10 hover:border-green-500/50' : ''}
                      ${moodOption === 'neutral' ? 'hover:bg-yellow-500/10 hover:border-yellow-500/50' : ''}
                      ${moodOption === 'negative' ? 'hover:bg-red-500/10 hover:border-red-500/50' : ''}
                    `}
                  >
                    {moodOption === 'positive' && <Smile className="h-6 w-6 sm:h-8 sm:w-8" />}
                    {moodOption === 'neutral' && <Meh className="h-6 w-6 sm:h-8 sm:w-8" />}
                    {moodOption === 'negative' && <Frown className="h-6 w-6 sm:h-8 sm:w-8" />}
                    <span className="text-xs sm:text-sm capitalize">{moodOption}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
              {loadingMood ? (
                <div className="w-full flex justify-center items-center h-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : currentDayMood ? (
                <div className={`w-full p-3 rounded-lg text-center text-sm font-medium text-white ${moodConfig[currentDayMood].color} flex items-center justify-center gap-2 shadow-md`}>
                  {moodConfig[currentDayMood].icon} {moodConfig[currentDayMood].text}
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground w-full">Select your mood for today</p>
              )}
            </CardFooter>
          </DashboardCard>
  
          {/* Journaling Streak Card with Visual Impact */}
          <DashboardCard className="bg-card/90 backdrop-blur-sm">
            <DashboardCardHeader 
              title="Journaling Streak" 
              description="Your consistency journey" 
              icon={<Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />} 
            />
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 text-center flex-grow flex flex-col justify-center items-center">
              <div className="relative mt-2 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-2xl rounded-full" />
                <div className="relative bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full p-6 border border-amber-500/20">
                  <div className="text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                    {currentStreak}
                  </div>
                </div>
              </div>
              <p className="mt-1 text-lg text-muted-foreground">{currentStreak === 1 ? 'Day' : 'Days'}</p>
              <p className="text-xs sm:text-sm text-muted-foreground/80 mt-1">Best streak: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}</p>
              {currentStreak > 0 && (
                <div className="mt-3 px-4 py-1.5 bg-green-500/10 rounded-full">
                  <p className="text-sm text-green-500 dark:text-green-400 font-medium">Keep the flame alive! 🔥</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
              <p className="text-xs text-center text-muted-foreground w-full">Journal daily to build and maintain your streak</p>
            </CardFooter>
          </DashboardCard>
        </div>
  
        {/* Recent Journals and Active Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Recent Journals with Improved List Design */}
          <DashboardCard className="bg-card/90 backdrop-blur-sm">
            <DashboardCardHeader 
              title="Recent Journals" 
              description="Your latest reflections" 
              icon={<BookText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />} 
            />
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 flex-grow">
              {loadingJournals ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentJournals.length > 0 ? (
                <ul className="space-y-2.5 sm:space-y-3.5">
                  {recentJournals.map(journal => (
                    <li key={journal.id} className="group transition-all duration-300">
                      <Link href={`/journal/${journal.id}`} className="block p-3 sm:p-4 rounded-xl hover:bg-primary/5 border border-border/50 hover:border-primary/20 transition-all hover:shadow-md flex items-center">
                        <div className="flex-grow">
                          <h4 className="font-medium text-foreground group-hover:translate-x-1 transition-transform truncate text-base">{journal.title}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{journal.lastUpdatedAt.toLocaleDateString()}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center gap-4 p-6 border border-dashed border-border/60 rounded-xl">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-center text-sm text-muted-foreground">Start your first journal entry!</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/journal/new">Create Journal</Link>
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
              <Button variant="ghost" asChild className="w-full text-primary hover:text-primary/90 justify-start group">
                <Link href="/journal">View All Journals <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"/></Link>
              </Button>
            </CardFooter>
          </DashboardCard>
  
          {/* Active Goals with Improved Visual Design */}
          <DashboardCard className="bg-card/90 backdrop-blur-sm">
            <DashboardCardHeader 
              title="Active Goals" 
              description="Tracking your aspirations" 
              icon={<Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />} 
            />
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 flex-grow">
              {loadingGoals ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activeGoals.length > 0 ? (
                <ul className="space-y-2.5 sm:space-y-3.5">
                  {activeGoals.map((goal, index) => (
                    <li key={goal.id} className="p-3 sm:p-4 rounded-xl bg-muted/50 hover:bg-muted/70 border border-border/50 transition-all flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-purple-500">{index + 1}</span>
                      </div>
                      <p className="text-sm text-foreground truncate flex-grow">{goal.text}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center gap-4 p-6 border border-dashed border-border/60 rounded-xl">
                  <Target className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-center text-sm text-muted-foreground">Set your first goal to get started!</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/goals/new">Add Goal</Link>
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
              <Button variant="ghost" asChild className="w-full text-primary hover:text-primary/90 justify-start group">
                <Link href="/goals">Manage Goals <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"/></Link>
              </Button>
            </CardFooter>
          </DashboardCard>
        </div>
  
        {/* Weekly Review and Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Weekly Review with Better UI */}
          <DashboardCard className="bg-card/90 backdrop-blur-sm lg:col-span-1">
            <DashboardCardHeader 
              title="Weekly Review" 
              description="Your progress summary" 
              icon={<CalendarCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />} 
            />
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 text-center flex-grow flex flex-col justify-center items-center">
              {loadingRecap ? (
                <div className="h-32 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : isRecapAvailable ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-base text-foreground">Your weekly insights are ready!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-muted-foreground/70" />
                  </div>
                  <p className="text-sm text-muted-foreground">Continue journaling for weekly insights</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 sm:p-5 mt-auto border-t border-primary/10">
              <Button variant="ghost" asChild className="w-full text-primary hover:text-primary/90 justify-start group">
                <Link href="/recaps">View All Recaps <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"/></Link>
              </Button>
            </CardFooter>
          </DashboardCard>
  
          {/* Discover Insights with Enhanced Design */}
          <DashboardCard className="bg-card/90 backdrop-blur-sm lg:col-span-2">
            <DashboardCardHeader 
              title="Discover Insights" 
              description="Understand your patterns" 
              icon={<Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />} 
            />
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 flex-grow">
              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                    Uncover emotional trends, recurring themes, and get personalized suggestions based on your journaling patterns and reflections.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button variant="outline" asChild className="shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                      <Link href="/insights">View Insights <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-1/3 lg:w-2/5 flex-shrink-0">
                  <Image 
                    src="/insights.png" 
                    alt="Abstract visualization representing personal insights" 
                    width={300} 
                    height={200} 
                    className="rounded-xl shadow-lg object-cover w-full h-auto hover:shadow-xl transition-all hover:-translate-y-1 duration-300"
                  />
                </div>
              </div>
            </CardContent>
          </DashboardCard>
        </div>
      </div>
    </div>
  )}
