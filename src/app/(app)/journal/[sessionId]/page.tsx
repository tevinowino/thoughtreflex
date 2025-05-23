// src/app/(app)/journal/[sessionId]/page.tsx
'use client';

import React, { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Settings2, Loader2, ArrowLeft, Trash2, PlusCircle, CheckCircle, Save, ImageIcon, Mic, Zap, Smile } from 'lucide-react';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Brain } from 'lucide-react'; // Added Brain for AI avatar
import { cn } from '@/lib/utils';
import { getTherapistResponse, TherapistModeInput, AiChatMessage as AiFlowChatMessage, ReframeThoughtOutput } from '@/ai/flows/therapist-modes';
import { generateCheckinPrompt, GenerateCheckinPromptInput } from '@/ai/flows/generate-checkin-prompt-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, Timestamp, setDoc, where, getDocs, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { differenceInDays, format, parseISO } from 'date-fns';
import { showLocalNotification } from '@/components/app/notification-manager';
import ChatBubble, { ChatMessage } from '@/components/app/chat-bubble';

type TherapistMode = 'Therapist' | 'Coach' | 'Friend';

const MAX_HISTORY_MESSAGES = 10; 

const getISODateString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export default function JournalSessionPage() {
  const routeParams = useParams();
  const safeParams = { ...routeParams }; 
  const router = useRouter();
  const { toast } = useToast();
  const initialSessionId = safeParams.sessionId as string;

  const { user, loading: authLoading, updateUserProfile, refreshUserProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionTitle, setSessionTitle] = useState('Loading session...');
  const [editableSessionTitle, setEditableSessionTitle] = useState('');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentTherapistMode, setCurrentTherapistMode] = useState<TherapistMode>('Therapist');
  const [currentDbSessionId, setCurrentDbSessionId] = useState<string | null>(initialSessionId === 'new' ? null : initialSessionId);
  const [isSessionSettingsOpen, setIsSessionSettingsOpen] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  
  const viewportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (user?.defaultTherapistMode) {
      setCurrentTherapistMode(user.defaultTherapistMode);
    }
  }, [user?.defaultTherapistMode]);

  useEffect(() => {
    if (!user || authLoading) return;

    const initializeNewSession = async () => {
      const newTitle = `New Journal - ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
      setSessionTitle(newTitle);
      setEditableSessionTitle(newTitle);
      setIsLoadingSession(true); 

      try {
        let daysSinceLastEntry: number | undefined = undefined;
        if (user.lastJournalDate && user.lastJournalDate.length > 0) { 
            try {
                daysSinceLastEntry = differenceInDays(new Date(), parseISO(user.lastJournalDate));
            } catch (e) {
                console.warn("Could not parse lastJournalDate:", user.lastJournalDate, e);
            }
        }


        let activeGoalText: string | undefined = undefined;
        const goalsQuery = query(collection(db, 'users', user.uid, 'goals'), where('isCompleted', '==', false), orderBy('createdAt', 'desc'), limit(1));
        const goalsSnapshot = await getDocs(goalsQuery);
        if (!goalsSnapshot.empty) {
            activeGoalText = goalsSnapshot.docs[0].data().text;
        }
        
        const checkinInput: GenerateCheckinPromptInput = {
            userName: user.displayName || undefined,
            userActiveGoal: activeGoalText,
            userMbtiType: user.mbtiType || undefined,
            daysSinceLastEntry: daysSinceLastEntry,
        };
        const aiPrompt = await generateCheckinPrompt(checkinInput);
        setMessages([
          { id: '0', text: aiPrompt.checkInPrompt, sender: 'ai', timestamp: new Date(), name: 'Mira', avatar: '/logo-ai.png' },
        ]);
      } catch (error) {
        console.error("Error generating check-in prompt:", error);
        setMessages([
          { id: '0', text: "Welcome! I'm Mira. I'm here to listen, and please know this space is private and confidential. What's on your mind today?", sender: 'ai', timestamp: new Date(), name: 'Mira', avatar: '/logo-ai.png' },
        ]);
      } finally {
        setIsLoadingSession(false);
        setCurrentDbSessionId(null);
      }
    };

    if (initialSessionId === 'new') {
      initializeNewSession();
    } else {
      setIsLoadingSession(true);
      setCurrentDbSessionId(initialSessionId);
      const sessionDocRef = doc(db, 'users', user.uid, 'journalSessions', initialSessionId);

      getDoc(sessionDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const title = docSnap.data().title || `Session from ${(docSnap.data().createdAt.toDate() as Date).toLocaleDateString()}`;
          setSessionTitle(title);
          setEditableSessionTitle(title);
        } else {
          toast({ title: "Error", description: "Session not found.", variant: "destructive" });
          router.push('/journal');
        }
      }).catch(error => {
        console.error("Error fetching session details:", error);
        toast({ title: "Error", description: "Could not load session details.", variant: "destructive" });
      });

      const messagesColRef = collection(db, 'users', user.uid, 'journalSessions', initialSessionId, 'messages');
      const q = query(messagesColRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(docSnap => ({ 
          id: docSnap.id,
          ...docSnap.data(),
          timestamp: docSnap.data().timestamp?.toDate ? docSnap.data().timestamp.toDate() : new Date(),
        } as ChatMessage));
        setMessages(fetchedMessages);
        setIsLoadingSession(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ title: "Error", description: "Could not load messages.", variant: "destructive" });
        setIsLoadingSession(false);
      });
      return () => unsubscribe();
    }
  }, [initialSessionId, user, authLoading, router, toast]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleStreakUpdate = useCallback(async () => {
    if (!user || !refreshUserProfile || !updateUserProfile) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef); // Get the latest profile
      if (!userDocSnap.exists()) {
        console.error("User profile not found for streak update.");
        return;
      }
      const currentProfile = userDocSnap.data() as UserProfile;

      const today = new Date();
      const todayDateString = getISODateString(today);
      const lastJournalDateString = currentProfile.lastJournalDate || "";

      if (lastJournalDateString !== todayDateString) {
        let newCurrentStreak = currentProfile.currentStreak || 0;
        let newLongestStreak = currentProfile.longestStreak || 0;
        let newMilestonesAchieved = [...(currentProfile.milestonesAchieved || [])];

        if (lastJournalDateString) {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          const yesterdayDateString = getISODateString(yesterday);

          if (lastJournalDateString === yesterdayDateString) {
            newCurrentStreak += 1;
          } else {
            newCurrentStreak = 1; 
          }
        } else {
          newCurrentStreak = 1; 
        }

        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }

        const streakMilestones = [3, 7, 14, 30, 50, 100, 365]; 
        let milestoneReachedThisUpdate: number | null = null;

        for (const milestone of streakMilestones) {
          if (newCurrentStreak >= milestone && !newMilestonesAchieved.includes(milestone)) {
            newMilestonesAchieved.push(milestone);
            milestoneReachedThisUpdate = milestone; 
            break; 
          }
        }
        
        const streakUpdates: Partial<UserProfile> = {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastJournalDate: todayDateString, 
          milestonesAchieved: newMilestonesAchieved,
        };
        await updateUserProfile(streakUpdates); 
        
        if(milestoneReachedThisUpdate) {
            showLocalNotification("You’re Doing Amazing 💫", {
                body: `You've journaled for ${milestoneReachedThisUpdate} days in a row! Keep showing up for yourself.`,
                icon: '/icons/icon-192x192.png',
                tag: `milestone-${milestoneReachedThisUpdate}`
            });
        }
        
        toast({ title: "Streak Updated!", description: `You're on a ${newCurrentStreak}-day streak! Keep it up! 🔥` });
        
        await refreshUserProfile();
      }
    } catch (error) {
      console.error("Error updating streak:", error);
      toast({ title: "Streak Error", description: "Could not update your journaling streak.", variant: "destructive"});
    }
  }, [user, refreshUserProfile, updateUserProfile, toast]);

  const processUserMessage = useCallback(async (userMessageText: string) => {
    if (!userMessageText.trim() || !user || !refreshUserProfile || !updateUserProfile) return;

    const userMessageData: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp: any } = {
      text: userMessageText,
      sender: 'user',
      timestamp: serverTimestamp(),
      name: user.displayName || 'User',
      avatar: user.photoURL || null,
    };

    setIsLoadingAiResponse(true);
    let tempUserMessageId = Date.now().toString();
    setMessages(prev => [...prev, { ...userMessageData, id: tempUserMessageId, timestamp: new Date() } as ChatMessage]);

    try {
      let actualSessionId = currentDbSessionId;

      if (!actualSessionId) { // First message in a new session
        const newSessionTitle = `Journal - ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
        const sessionColRef = collection(db, 'users', user.uid, 'journalSessions');
        const newSessionDoc = await addDoc(sessionColRef, {
          title: newSessionTitle,
          createdAt: serverTimestamp(),
          lastUpdatedAt: serverTimestamp(),
          userId: user.uid,
          firstMessagePreview: userMessageText.substring(0, 100),
        });
        actualSessionId = newSessionDoc.id;
        setCurrentDbSessionId(actualSessionId);
        router.replace(`/journal/${actualSessionId}`, { scroll: false });
        setSessionTitle(newSessionTitle);
        setEditableSessionTitle(newSessionTitle);
      }

      const userMsgRef = await addDoc(collection(db, 'users', user.uid, 'journalSessions', actualSessionId!, 'messages'), userMessageData);
      setMessages(prev => prev.map(m => m.id === tempUserMessageId ? { ...m, id: userMsgRef.id } : m));

      await handleStreakUpdate();

      let activeGoalText: string | undefined = undefined;
      const goalsQuery = query(collection(db, 'users', user.uid, 'goals'), where('isCompleted', '==', false), orderBy('createdAt', 'desc'), limit(1));
      const goalsSnapshot = await getDocs(goalsQuery);
      if (!goalsSnapshot.empty) {
        activeGoalText = goalsSnapshot.docs[0].data().text;
      }
      
      const historySnapshot = messages.filter(msg => msg.id !== tempUserMessageId).slice(-MAX_HISTORY_MESSAGES);
      const historyForAI: AiFlowChatMessage[] = historySnapshot
        .map(msg => ({ sender: msg.sender, text: msg.text }));
      historyForAI.push({ sender: 'user', text: userMessageText });

      let detectedIssuesSummary: string | undefined = undefined;
      if (user.detectedIssues && Object.keys(user.detectedIssues).length > 0) {
        detectedIssuesSummary = "User patterns include: " + Object.entries(user.detectedIssues)
          .map(([key, val]) => `${key} (${val.occurrences} mentions)`)
          .join(', ') + ".";
      }

      const aiFlowInput: TherapistModeInput = {
        userInput: userMessageText,
        mode: currentTherapistMode,
        goal: activeGoalText,
        messageHistory: historyForAI,
        mbtiType: user?.mbtiType || null,
        userName: user.displayName || null,
        detectedIssuesSummary: detectedIssuesSummary,
      };

      const aiResponse = await getTherapistResponse(aiFlowInput);

      const aiMessageData: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp: any } = {
        text: aiResponse.response,
        sender: 'ai',
        timestamp: serverTimestamp(),
        name: 'Mira',
        avatar: '/logo-ai.png',
        suggestedGoalText: aiResponse.suggestedGoalText || null,
        isGoalAdded: false,
        reframingData: aiResponse.reframingData || null,
        isReframingSaved: false,
        suggestions: aiResponse.suggestedReplies || null,
        suggestionSelected: false,
      };
      await addDoc(collection(db, 'users', user.uid, 'journalSessions', actualSessionId!, 'messages'), aiMessageData);

      if (aiResponse.detectedIssueTags && aiResponse.detectedIssueTags.length > 0 && refreshUserProfile) {
        const currentDetectedIssues = user.detectedIssues || {};
        const newDetectedIssues = { ...currentDetectedIssues };
        let issuesUpdated = false;
        aiResponse.detectedIssueTags.forEach(tag => {
          newDetectedIssues[tag] = {
            occurrences: (currentDetectedIssues[tag]?.occurrences || 0) + 1,
            lastDetected: Timestamp.now(),
          };
          issuesUpdated = true;
        });
        if (issuesUpdated) {
          await updateUserProfile({ detectedIssues: newDetectedIssues });
          await refreshUserProfile();
        }
      }

      const sessionUpdateData: { lastUpdatedAt: any, firstMessagePreview?: string } = {
        lastUpdatedAt: serverTimestamp(),
      };
      const currentSessionMessages = await getDocs(query(collection(db, 'users', user.uid, 'journalSessions', actualSessionId!, 'messages'), where('sender', '==', 'user'), orderBy('timestamp', 'asc'), limit(1)));
      if (currentSessionMessages.docs.length === 1 && currentSessionMessages.docs[0].id === userMsgRef.id) {
        sessionUpdateData.firstMessagePreview = userMessageText.substring(0, 100);
      }

      await updateDoc(doc(db, 'users', user.uid, 'journalSessions', actualSessionId!), sessionUpdateData);

    } catch (error: any) {
      console.error("Error sending message or getting AI response:", error);
      toast({ title: "Error", description: error.message || "Could not process message.", variant: "destructive" });
      setInput(userMessageText); 
      setMessages(prev => prev.filter(m => m.id !== tempUserMessageId)); 
    } finally {
      setIsLoadingAiResponse(false);
    }
  }, [user, currentDbSessionId, currentTherapistMode, messages, handleStreakUpdate, refreshUserProfile, updateUserProfile, router, toast]);


  const handleSendMessage = useCallback(async (e?: FormEvent | React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const textToSend = input;
    setInput(''); // Clear input immediately for better UX
    await processUserMessage(textToSend);
  }, [processUserMessage, input]);

  const handleSuggestionSelect = useCallback(async (messageId: string, suggestionText: string) => {
    if (!user || !currentDbSessionId) return;
    
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, suggestionSelected: true, suggestions: null } : m));
    const aiMessageRef = doc(db, 'users', user.uid, 'journalSessions', currentDbSessionId, 'messages', messageId);
    await updateDoc(aiMessageRef, { suggestionSelected: true, suggestions: null });

    await processUserMessage(suggestionText);
  }, [user, currentDbSessionId, processUserMessage]);


  const handleSaveSessionTitle = useCallback(async () => {
    if (!currentDbSessionId || !user || !editableSessionTitle.trim()) {
      toast({ title: "Error", description: "Session not found or title is empty.", variant: "destructive" });
      return;
    }
    try {
      const sessionDocRef = doc(db, 'users', user.uid, 'journalSessions', currentDbSessionId);
      await updateDoc(sessionDocRef, { 
        title: editableSessionTitle.trim(),
        lastUpdatedAt: serverTimestamp() 
      });
      setSessionTitle(editableSessionTitle.trim()); 
      toast({ title: "Session Renamed", description: "The session title has been updated." });
      setIsSessionSettingsOpen(false);
    } catch (error) {
      console.error("Error renaming session:", error);
      toast({ title: "Error", description: "Could not rename session.", variant: "destructive" });
    }
  }, [currentDbSessionId, user, editableSessionTitle, toast]);

  const handleDeleteSession = useCallback(async () => {
    if (!currentDbSessionId || !user) {
      toast({ title: "Error", description: "Session not found or user not logged in.", variant: "destructive"});
      return;
    }
    setIsDeletingSession(true);
    try {
      const sessionDocRef = doc(db, 'users', user.uid, 'journalSessions', currentDbSessionId);
      const messagesColRef = collection(db, 'users', user.uid, 'journalSessions', currentDbSessionId, 'messages');
      
      const messagesSnapshot = await getDocs(messagesColRef);
      const batch = writeBatch(db);
      messagesSnapshot.forEach(docSnap => { 
        batch.delete(docSnap.ref);
      });
      await batch.commit();

      await deleteDoc(sessionDocRef);

      toast({ title: "Session Deleted", description: `The session titled "${sessionTitle}" and its messages have been removed.` });
      router.push('/journal');
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({ title: "Error", description: "Could not delete session.", variant: "destructive" });
    } finally {
      setIsDeletingSession(false);
      setIsSessionSettingsOpen(false);
    }
  }, [currentDbSessionId, user, sessionTitle, router, toast]);

  const handleAddSuggestedGoal = useCallback(async (messageId: string, goalText: string | null | undefined) => {
    if (!user || !currentDbSessionId || !goalText) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'goals'), {
        text: goalText,
        isCompleted: false,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });
      toast({ title: "Goal Added!", description: `"${goalText}" has been added to your goals.` });

      const messageRef = doc(db, 'users', user.uid, 'journalSessions', currentDbSessionId, 'messages', messageId);
      await updateDoc(messageRef, { isGoalAdded: true });
      
      setMessages(prevMessages =>
        prevMessages.map(m =>
          m.id === messageId ? { ...m, isGoalAdded: true } : m
        )
      );

    } catch (error) {
      console.error("Error adding suggested goal:", error);
      toast({ title: "Error", description: "Could not add suggested goal.", variant: "destructive" });
    }
  }, [user, currentDbSessionId, toast]);

  const handleSaveMindShift = useCallback(async (messageId: string, reframingData: ReframeThoughtOutput | null | undefined) => {
    if (!user || !currentDbSessionId || !reframingData) return;
    try {
        await addDoc(collection(db, 'users', user.uid, 'mindShifts'), {
            ...reframingData,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        toast({ title: "Mind Shift Saved!", description: "Your reframed thought has been saved."});

        const messageRef = doc(db, 'users', user.uid, 'journalSessions', currentDbSessionId, 'messages', messageId);
        await updateDoc(messageRef, { isReframingSaved: true });

        setMessages(prevMessages => 
            prevMessages.map(m => 
                m.id === messageId ? { ...m, isReframingSaved: true } : m
            )
        );
    } catch (error) {
        console.error("Error saving mind shift:", error);
        toast({ title: "Error", description: "Could not save mind shift.", variant: "destructive" });
    }
  }, [user, currentDbSessionId, toast]);


  const modeIcons = {
    Therapist: <Brain className="mr-2 h-4 w-4" />,
    Coach: <Zap className="mr-2 h-4 w-4" />,
    Friend: <Smile className="mr-2 h-4 w-4" />,
  };

  if (authLoading || (isLoadingSession && initialSessionId !== 'new')) {
     return (
      <div className="flex flex-col h-[calc(100vh-theme(spacing.32))] md:h-[calc(100vh-theme(spacing.24))] bg-card rounded-2xl shadow-xl overflow-hidden items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  return (
    <Card key={currentDbSessionId || 'new-session-card'} className="flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-3rem)] bg-card rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl overflow-hidden border">
      <CardHeader className="flex flex-row items-center justify-between p-2 xs:p-3 sm:p-4 border-b bg-muted/30 gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 overflow-hidden">
          <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 shrink-0 h-8 w-8 sm:h-9 sm:w-9">
            <Link href="/journal">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="sr-only">Back to Journals</span>
            </Link>
          </Button>
          <div className="min-w-0 truncate">
            <CardTitle className="text-xs sm:text-sm md:text-base truncate">{sessionTitle}</CardTitle>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Select value={currentTherapistMode} onValueChange={(value: TherapistMode) => setCurrentTherapistMode(value)}>
            <SelectTrigger className="w-[100px] xs:w-[110px] sm:w-[150px] h-8 sm:h-9 text-xs sm:text-sm shadow-sm">
              <div className="flex items-center">
                <SelectValue placeholder="Select Mode" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Therapist">
                <div className="flex items-center">
                  <Brain className="mr-2 h-4 w-4" />
                  <span>Therapist</span>
                </div>
              </SelectItem>
              <SelectItem value="Coach">
                <div className="flex items-center">
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Coach</span>
                </div>
              </SelectItem>
              <SelectItem value="Friend">
                <div className="flex items-center">
                  <Smile className="mr-2 h-4 w-4" />
                  <span>Friend</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isSessionSettingsOpen} onOpenChange={setIsSessionSettingsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!currentDbSessionId} 
                onClick={() => setEditableSessionTitle(sessionTitle)} 
                className="hover:bg-primary/10 h-8 w-8 sm:h-9 sm:w-9"
              >
                <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="sr-only">Session Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-xl">Session Settings</DialogTitle>
                <DialogDescription>Rename or delete this journal session.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <Label htmlFor="sessionTitleInput" className="text-sm font-medium">Session Title</Label>
                <Input
                  id="sessionTitleInput"
                  value={editableSessionTitle}
                  onChange={(e) => setEditableSessionTitle(e.target.value)}
                  placeholder="Enter session title"
                  className="bg-muted/50"
                />
              </div>
              <DialogFooter className="flex gap-2 flex-col xs:flex-row justify-between items-center pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full xs:w-auto" disabled={isDeletingSession || !currentDbSessionId}>
                      {isDeletingSession ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Session
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the journal session titled "{sessionTitle}" and all its messages. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setIsDeletingSession(false)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteSession} 
                        className={cn(buttonVariants({ variant: "destructive" }))} 
                        disabled={isDeletingSession}
                      >
                        {isDeletingSession ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Yes, Delete Session"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="flex gap-2 w-full xs:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSessionSettingsOpen(false)}
                    className="flex-1 xs:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveSessionTitle} 
                    className="shadow-sm flex-1 xs:flex-none"
                    disabled={!currentDbSessionId}
                  >
                    Save Title
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <div className="p-3 xs:p-4">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              currentUserId={user?.uid}
              currentUserDisplayName={user?.displayName}
              currentUserPhotoURL={user?.photoURL}
              onAddSuggestedGoal={handleAddSuggestedGoal}
              onSaveMindShift={handleSaveMindShift}
              onSuggestionSelect={handleSuggestionSelect}
              isLoadingAiResponse={isLoadingAiResponse}
            />
          ))}
          
          {isLoadingAiResponse && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group flex items-start gap-2 sm:gap-3 mr-auto my-4" 
            >
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 shadow-md border-2 border-background">
                <AvatarImage src="/logo-ai.png" alt="Mira AI" />
                <AvatarFallback className="bg-muted text-primary text-xs">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                </AvatarFallback>
              </Avatar>
              <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl rounded-bl-none shadow-md bg-muted text-foreground flex items-center">
                <p className="text-sm italic text-muted-foreground">Mira is typing</p>
                <div className="flex gap-0.5 items-center ml-1.5">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                    className="h-1.5 w-1.5 bg-primary/60 rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                    className="h-1.5 w-1.5 bg-primary/60 rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    className="h-1.5 w-1.5 bg-primary/60 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="border-t p-2 xs:p-3 bg-muted/30">
        <div className="relative flex items-center">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your thoughts here..."
            className="pr-20 xs:pr-24 sm:pr-28 resize-none min-h-[48px] xs:min-h-[50px] sm:min-h-[56px] max-h-[120px] xs:max-h-[140px] sm:max-h-[160px] rounded-lg sm:rounded-xl text-sm sm:text-base border-input focus:border-primary shadow-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute right-1 xs:right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex gap-0.5 sm:gap-1">
             <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-primary h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9" 
              onClick={() => toast({
                title: "Coming Soon!", 
                description: "Voice input will be available in a future update."
              })}
            >
              <Mic className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Voice Input</span>
            </Button>
            <Button 
              type="button" // Changed from "submit"
              onClick={() => handleSendMessage()} // Call handleSendMessage directly
              size="icon" 
              disabled={isLoadingAiResponse || !input.trim()} 
              className="rounded-lg shadow-md h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9"
            >
              <Send className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Send Message</span>
            </Button>
          </div>
        </div>
      </form>
    </Card>  
  );
}
