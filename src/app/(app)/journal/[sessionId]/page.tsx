
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Brain, Mic, Settings2, Smile, Zap, User, Loader2, ArrowLeft, Trash2, PlusCircle, CheckCircle } from 'lucide-react';
import { useAuth, UserProfile } from '@/contexts/auth-context'; 
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { getTherapistResponse, TherapistModeInput, AiChatMessage } from '@/ai/flows/therapist-modes';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, Timestamp, setDoc, where, getDocs, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Timestamp | Date; 
  avatar?: string | null;
  name: string;
  suggestedGoalText?: string;
  isGoalAdded?: boolean;
}

type TherapistMode = 'Therapist' | 'Coach' | 'Friend';

const MAX_HISTORY_MESSAGES = 10; 

const getISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function JournalSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const initialSessionId = params.sessionId as string;

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

  useEffect(() => {
    if (user?.defaultTherapistMode) {
      setCurrentTherapistMode(user.defaultTherapistMode);
    }
  }, [user?.defaultTherapistMode]);

  useEffect(() => {
    if (!user || authLoading) return;

    if (initialSessionId === 'new') {
      setSessionTitle('New Journal Session');
      setEditableSessionTitle('New Journal Session');
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
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
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
        const newSessionTitle = `Journal - ${new Date().toLocaleDateString()}`;
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
      if (currentTherapistMode === 'Coach') {
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
        messageHistory: historyForAI 
      };

      const aiResponse = await getTherapistResponse(aiFlowInput);

      const aiMessageData: Omit<Message, 'id' | 'timestamp'> & { timestamp: any } = {
        text: aiResponse.response,
        sender: 'ai',
        timestamp: serverTimestamp(),
        name: 'Mira',
        avatar: '/logo-ai.png',
        suggestedGoalText: aiResponse.suggestedGoalText,
        isGoalAdded: false,
      };
      await addDoc(collection(db, 'users', user.uid, 'journalSessions', actualSessionId!, 'messages'), aiMessageData);

      await updateDoc(doc(db, 'users', user.uid, 'journalSessions', actualSessionId!), {
        lastUpdatedAt: serverTimestamp(),
        ...(messages.length === 0 && { firstMessagePreview: userMessageText.substring(0, 100) }) 
      });

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
      toast({ title: "Error", description: "Cannot save empty title or session not found.", variant: "destructive" });
      return;
    }
    try {
      const sessionDocRef = doc(db, 'users', user.uid, 'journalSessions', currentDbSessionId);
      await updateDoc(sessionDocRef, { title: editableSessionTitle.trim() });
      setSessionTitle(editableSessionTitle.trim());
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
      messagesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
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

  const handleAddSuggestedGoal = async (messageId: string, goalText: string) => {
    if (!user || !currentDbSessionId) return;
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
    <div className="flex flex-col h-[calc(100vh-theme(spacing.32))] md:h-[calc(100vh-theme(spacing.24))] bg-card rounded-2xl shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/journal">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Journals</span>
            </Link>
          </Button>
          <CardTitle className="text-xl truncate">{sessionTitle}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Select value={currentTherapistMode} onValueChange={(value: TherapistMode) => setCurrentTherapistMode(value)}>
            <SelectTrigger className="w-[150px] h-9">
              <div className="flex items-center">
                {modeIcons[currentTherapistMode]}
                <SelectValue placeholder="Select Mode" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Therapist"><div className="flex items-center"><Brain className="mr-2 h-4 w-4" /> Therapist</div></SelectItem>
              <SelectItem value="Coach"><div className="flex items-center"><Zap className="mr-2 h-4 w-4" /> Coach</div></SelectItem>
              <SelectItem value="Friend"><div className="flex items-center"><Smile className="mr-2 h-4 w-4" /> Friend</div></SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isSessionSettingsOpen} onOpenChange={setIsSessionSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!currentDbSessionId} onClick={() => setEditableSessionTitle(sessionTitle)}>
                <Settings2 className="h-5 w-5" />
                <span className="sr-only">Session Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Session Settings</DialogTitle>
                <DialogDescription>Rename your journal session or delete it.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <label htmlFor="sessionTitleInput" className="text-sm font-medium">Session Title</label>
                <Input
                  id="sessionTitleInput"
                  value={editableSessionTitle}
                  onChange={(e) => setEditableSessionTitle(e.target.value)}
                  placeholder="Enter session title"
                />
              </div>
              <DialogFooter className="justify-between sm:justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="destructive" disabled={isDeletingSession}>
                      {isDeletingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Delete Session
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this journal session and all its messages. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSession} className={cn(buttonVariants({ variant: "destructive" }))}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsSessionSettingsOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveSessionTitle}>Save Title</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "group flex items-end gap-2.5 max-w-[80%] mb-5", 
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className="h-9 w-9 self-start"> 
              <AvatarImage src={msg.avatar || undefined} data-ai-hint={msg.sender === 'user' ? 'profile user' : 'ai bot'} />
              <AvatarFallback>
                {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "px-4 py-3 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out", 
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted text-foreground rounded-bl-none'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
               {msg.sender === 'ai' && msg.suggestedGoalText && !msg.isGoalAdded && (
                <div className="mt-3 pt-3 border-t border-foreground/20">
                  <p className="text-xs font-semibold text-foreground/80 mb-1">Mira's Goal Suggestion:</p>
                  <p className="text-sm text-foreground/90 italic">"{msg.suggestedGoalText}"</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs h-auto py-1 px-2 bg-background hover:bg-accent"
                    onClick={() => handleAddSuggestedGoal(msg.id, msg.suggestedGoalText!)}
                  >
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add this goal
                  </Button>
                </div>
              )}
              {msg.sender === 'ai' && msg.suggestedGoalText && msg.isGoalAdded && (
                  <div className="mt-3 pt-3 border-t border-green-500/30">
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        <CheckCircle className="mr-1.5 h-4 w-4" /> Goal added to your list!
                      </p>
                  </div>
              )}
              <p className={cn(
                  "text-xs mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200", 
                  msg.sender === 'user' ? 'text-primary-foreground/80 text-right' : 'text-muted-foreground/80 text-left'
                )}>
                {(msg.timestamp instanceof Date ? msg.timestamp : new Date((msg.timestamp as Timestamp).seconds * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoadingAiResponse && (
          <div className="flex items-end gap-2.5 mr-auto mb-5">
            <Avatar className="h-9 w-9 self-start">
                <AvatarImage src="/logo-ai.png" alt="Mira AI" data-ai-hint="ai bot" />
              <AvatarFallback><Brain className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="px-4 py-3 rounded-2xl shadow-md bg-muted text-foreground rounded-bl-none">
              <p className="text-sm italic">Mira is thinking...</p>
            </div>
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
        <div className="relative flex items-center">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your thoughts here..."
            className="pr-20 resize-none min-h-[60px] max-h-[120px] rounded-xl text-base"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => toast({title: "Not Implemented", description:"Voice input coming soon!"})}>
              <Mic className="h-5 w-5" />
              <span className="sr-only">Voice Input</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => toast({title: "Not Implemented", description:"File attachment coming soon!"})}>
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach File</span>
            </Button>
            <Button type="submit" size="icon" disabled={isLoadingAiResponse || !input.trim()}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send Message</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
