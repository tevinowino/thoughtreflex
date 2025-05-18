
// src/app/(app)/journal/[sessionId]/page.tsx
'use client';

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Brain, Mic, Settings2, Smile, Zap, User, Loader2, ArrowLeft, Trash2, PlusCircle, CheckCircle, ImageIcon, Save } from 'lucide-react';
import { useAuth, UserProfile } from '@/contexts/auth-context'; 
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { getTherapistResponse, TherapistModeInput, AiChatMessage, ReframeThoughtOutput } from '@/ai/flows/therapist-modes';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, Timestamp, setDoc, where, getDocs, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Timestamp | Date; 
  avatar?: string | null;
  name: string;
  suggestedGoalText?: string | null;
  isGoalAdded?: boolean;
  reframingData?: ReframeThoughtOutput | null;
  isReframingSaved?: boolean;
}

type TherapistMode = 'Therapist' | 'Coach' | 'Friend';

const MAX_HISTORY_MESSAGES = 10; 

const getISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function JournalSessionPage() {
  const routeParams = useParams();
  const safeParams = { ...routeParams }; 
  const router = useRouter();
  const { toast } = useToast();
  const initialSessionId = safeParams.sessionId as string;

  const { user, loading: authLoading, refreshUserProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionTitle, setSessionTitle] = useState('Loading session...');
  const [editableSessionTitle, setEditableSessionTitle] = useState('');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentTherapistMode, setCurrentTherapistMode] = useState<TherapistMode>('Therapist');
  const [currentDbSessionId, setCurrentDbSessionId] = useState<string | null>(initialSessionId === 'new' ? null : initialSessionId);
  const [isSessionSettingsOpen, setIsSessionSettingsOpen] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (user?.defaultTherapistMode) {
      setCurrentTherapistMode(user.defaultTherapistMode);
    }
  }, [user?.defaultTherapistMode]);

  useEffect(() => {
    if (!user || authLoading) return;

    if (initialSessionId === 'new') {
      const newTitle = `New Journal - ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
      setSessionTitle(newTitle);
      setEditableSessionTitle(newTitle);
      setMessages([
        { id: '0', text: "Welcome! I'm Mira. I'm here to listen, and please know this space is private and confidential. What's on your mind today?", sender: 'ai', timestamp: new Date(), name: 'Mira', avatar: '/logo-ai.png' },
      ]);
      setIsLoadingSession(false);
      setCurrentDbSessionId(null); 
    } else {
      setIsLoadingSession(true);
      setCurrentDbSessionId(initialSessionId);
      const sessionDocRef = doc(db, 'users', user.uid, 'journalSessions', initialSessionId);

      getDoc(sessionDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const title = docSnap.data().title || `Session from ${(docSnap.data().createdAt.toDate() as Date).toLocaleDateString()}`;
          setSessionTitle(title);
          setEditableSessionTitle(title); // Initialize editable title here
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
        } as Message));
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


  const handleStreakUpdate = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.error("User profile not found for streak update.");
        return;
      }
      const userProfile = userDocSnap.data() as UserProfile;

      const today = new Date();
      const todayDateString = getISODateString(today);
      const lastJournalDateString = userProfile.lastJournalDate || "";

      if (lastJournalDateString !== todayDateString) {
        let newCurrentStreak = userProfile.currentStreak || 0;
        let newLongestStreak = userProfile.longestStreak || 0;

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

        const streakUpdates: Partial<UserProfile> = {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastJournalDate: todayDateString, 
        };
        await updateDoc(userDocRef, streakUpdates);
        if (refreshUserProfile) { 
          await refreshUserProfile();
        }
        toast({ title: "Streak Updated!", description: `You're on a ${newCurrentStreak}-day streak!`, });
      }
    } catch (error) {
      console.error("Error updating streak:", error);
      toast({ title: "Streak Error", description: "Could not update your journaling streak.", variant: "destructive"});
    }
  };


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessageText = input;
    setInput(''); 

    const userMessageData: Omit<Message, 'id' | 'timestamp'> & { timestamp: any } = { 
      text: userMessageText,
      sender: 'user',
      timestamp: serverTimestamp(),
      name: user.displayName || 'User',
      avatar: user.photoURL || null, 
    };

    setIsLoadingAiResponse(true);
    let tempUserMessageId = Date.now().toString();
    setMessages(prev => [...prev, { ...userMessageData, id: tempUserMessageId, timestamp: new Date() } as Message]);

    try {
      let actualSessionId = currentDbSessionId;
      
      if (!actualSessionId) {
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
      setMessages(prev => prev.map(m => m.id === tempUserMessageId ? {...m, id: userMsgRef.id} : m));
      
      await handleStreakUpdate();

      let activeGoalText: string | undefined = undefined;
      if (currentTherapistMode === 'Coach' || currentTherapistMode === 'Therapist') { // Also pass for Therapist mode
          const goalsQuery = query(collection(db, 'users', user.uid, 'goals'), where('isCompleted', '==', false), orderBy('createdAt', 'desc'), limit(1));
          const goalsSnapshot = await getDocs(goalsQuery);
          if (!goalsSnapshot.empty) {
              activeGoalText = goalsSnapshot.docs[0].data().text;
          }
      }
      
      const historyForAI: AiChatMessage[] = messages
        .slice(-MAX_HISTORY_MESSAGES) 
        .map(msg => ({ sender: msg.sender, text: msg.text }));
      historyForAI.push({ sender: 'user', text: userMessageText });

      const aiFlowInput: TherapistModeInput = {
        userInput: userMessageText,
        mode: currentTherapistMode,
        goal: activeGoalText,
        messageHistory: historyForAI,
        mbtiType: user?.mbtiType || null,
        userName: user.displayName || undefined,
      };

      const aiResponse = await getTherapistResponse(aiFlowInput);

      const aiMessageData: Omit<Message, 'id' | 'timestamp'> & { timestamp: any } = {
        text: aiResponse.response,
        sender: 'ai',
        timestamp: serverTimestamp(),
        name: 'Mira',
        avatar: '/logo-ai.png',
        suggestedGoalText: aiResponse.suggestedGoalText || null,
        isGoalAdded: false,
        reframingData: aiResponse.reframingData || null,
        isReframingSaved: false,
      };
      await addDoc(collection(db, 'users', user.uid, 'journalSessions', actualSessionId!, 'messages'), aiMessageData);

      const sessionUpdateData: { lastUpdatedAt: any } = {
        lastUpdatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, 'users', user.uid, 'journalSessions', actualSessionId!), sessionUpdateData);

    } catch (error: any) {
      console.error("Error sending message or getting AI response:", error);
      toast({ title: "Error", description: error.message || "Could not process message.", variant: "destructive" });
      setInput(userMessageText); 
      setMessages(prev => prev.filter(m => m.id !== tempUserMessageId)); 
    } finally {
      setIsLoadingAiResponse(false);
    }
  };

  const handleSaveSessionTitle = async () => {
    if (!currentDbSessionId || !user || !editableSessionTitle.trim()) {
       // Allow saving if title is deliberately cleared to empty, but only if it's an existing session
      if (currentDbSessionId && editableSessionTitle.trim() === '') {
        // Proceed to save empty title
      } else {
        toast({ title: "Error", description: "Cannot save empty title for a new session or session not found.", variant: "destructive" });
        return;
      }
    }
    try {
      const sessionDocRef = doc(db, 'users', user.uid, 'journalSessions', currentDbSessionId);
      await updateDoc(sessionDocRef, { 
        title: editableSessionTitle.trim(),
        lastUpdatedAt: serverTimestamp() // Update lastUpdatedAt on title change as well
      });
      setSessionTitle(editableSessionTitle.trim()); // Update display title
      toast({ title: "Session Renamed", description: "The session title has been updated." });
      setIsSessionSettingsOpen(false);
    } catch (error) {
      console.error("Error renaming session:", error);
      toast({ title: "Error", description: "Could not rename session.", variant: "destructive" });
    }
  };

  const handleDeleteSession = async () => {
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
      messagesSnapshot.forEach(docSnap => { // Renamed doc to docSnap to avoid conflict
        batch.delete(docSnap.ref);
      });
      await batch.commit();

      await deleteDoc(sessionDocRef);

      toast({ title: "Session Deleted", description: "The session and its messages have been removed." });
      router.push('/journal');
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({ title: "Error", description: "Could not delete session.", variant: "destructive" });
    } finally {
      setIsDeletingSession(false);
      setIsSessionSettingsOpen(false);
    }
  };

  const handleAddSuggestedGoal = async (messageId: string, goalText: string | null | undefined) => {
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
  };

  const handleSaveMindShift = async (messageId: string, reframingData: ReframeThoughtOutput | null | undefined) => {
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
  };


  const modeIcons = {
    Therapist: <Brain className="mr-2 h-4 w-4" />,
    Coach: <Zap className="mr-2 h-4 w-4" />,
    Friend: <Smile className="mr-2 h-4 w-4" />,
  };

  const ChatBubble = ({ message, handleAddSuggestedGoal, handleSaveMindShift }: { message: Message, handleAddSuggestedGoal: Function, handleSaveMindShift: Function}) => {
    const isUserMessage = message.sender === 'user';
    const timestamp = message.timestamp instanceof Date 
      ? message.timestamp 
      : new Date((message.timestamp as Timestamp).seconds * 1000);
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "group flex items-start gap-2 sm:gap-3 max-w-[90%] xs:max-w-[85%] sm:max-w-[75%] my-4", // Added my-4 for vertical spacing
          isUserMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'
        )}
      >
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 shadow-md border-2 border-background"> 
          <AvatarImage src={message.avatar || undefined} alt={isUserMessage ? (user?.displayName || "User") : "Mira"} />
          <AvatarFallback className={cn(
            "text-xs",
            isUserMessage 
              ? 'bg-secondary text-secondary-foreground' 
              : 'bg-primary/20 text-primary'
          )}>
            {isUserMessage 
              ? (user?.displayName?.substring(0,1) || <User className="h-4 w-4 sm:h-5 sm:w-5" /> )
              : <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
            }
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-1 w-full">
          <div
            className={cn(
              "px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md group-hover:shadow-xl transition-shadow duration-200 ease-in-out text-sm", 
              isUserMessage
                ? 'bg-primary text-primary-foreground rounded-br-none'
                : 'bg-muted text-foreground rounded-bl-none'
            )}
          >
             {message.imageDataUri ? (
              <Image 
                src={message.imageDataUri} 
                alt="AI generated visual prompt" 
                width={300} 
                height={300} 
                className="rounded-lg object-contain max-w-full h-auto my-2" 
              />
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
            )}
            <p className={cn(
              "text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300", 
              isUserMessage ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'
            )}>
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
  
          {/* Goal suggestion component */}
          {!isUserMessage && message.suggestedGoalText && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              className="mt-2 pt-2 sm:pt-3 border border-primary/30 bg-accent/20 p-2.5 sm:p-3 rounded-xl shadow-sm"
            >
              <p className="text-xs font-semibold text-primary/90 mb-1.5">Mira's Goal Suggestion:</p>
              <p className="text-xs sm:text-sm text-foreground/90 italic mb-2">"{message.suggestedGoalText}"</p>
              {!message.isGoalAdded ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-auto py-1 px-2 sm:py-1.5 sm:px-3 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={() => handleAddSuggestedGoal(message.id, message.suggestedGoalText)}
                >
                  <PlusCircle className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Add this goal
                </Button>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center font-medium">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Goal added!
                </p>
              )}
            </motion.div>
          )}
  
          {/* Mind shift suggestion component */}
          {!isUserMessage && message.reframingData && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              className="mt-2 pt-2 sm:pt-3 border border-purple-500/30 bg-purple-500/10 dark:bg-purple-600/20 p-2.5 sm:p-3 rounded-xl shadow-sm"
            >
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1.5">Mira's Mind Shift Suggestion:</p>
              {!message.isReframingSaved ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-auto py-1 px-2 sm:py-1.5 sm:px-3 border-purple-500/50 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
                  onClick={() => handleSaveMindShift(message.id, message.reframingData)}
                >
                  <Save className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Save this Mind Shift
                </Button>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center font-medium">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Mind Shift Saved!
                </p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
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
    <Card className="flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-3rem)] bg-card rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl overflow-hidden border">
      {/* Header Section */}
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
          {/* Therapist Mode Selector */}
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
          
          {/* Settings Dialog */}
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
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
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

      {/* Chat Messages Area */}
      <ScrollArea className="flex-1" viewportRef={viewportRef} ref={scrollAreaRef}>
        <div className="p-3 xs:p-4">
          {messages.map((message) => (
            <ChatBubble 
              key={message.id}
              message={message}
              handleAddSuggestedGoal={handleAddSuggestedGoal}
              handleSaveMindShift={handleSaveMindShift}
            />
          ))}
          
          {/* Loading Animation */}
          {isLoadingAiResponse && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 sm:gap-3 mr-auto my-4" // Added my-4 for vertical spacing
            >
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 shadow-sm border-2 border-background">
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

      {/* Message Input Area */}
      <form onSubmit={handleSendMessage} className="border-t p-2 xs:p-3 bg-muted/30">
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
                handleSendMessage(e);
              }
            }}
          />
          <div className="absolute right-1 xs:right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex gap-0.5 sm:gap-1">
            {/* Removed ImageIcon button based on previous correction to avoid feature creep for now */}
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
              type="submit" 
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
    </Card>  );
}

