
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Brain, Mic, Settings2, Smile, Zap, User, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth, UserProfile } from '@/contexts/auth-context'; // Import UserProfile
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getTherapistResponse, TherapistModeInput } from '@/ai/flows/therapist-modes';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, Timestamp, setDoc, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Timestamp | Date; 
  avatar?: string | null;
  name: string;
}

type TherapistMode = 'Therapist' | 'Coach' | 'Friend';

interface AiChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

const MAX_HISTORY_MESSAGES = 10; 

// Helper to get date string in YYYY-MM-DD format
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
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentTherapistMode, setCurrentTherapistMode] = useState<TherapistMode>('Therapist');
  const [currentDbSessionId, setCurrentDbSessionId] = useState<string | null>(initialSessionId === 'new' ? null : initialSessionId);

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
      setMessages([
        { id: '0', text: "Welcome! I'm Mira. I'm here to listen. What's on your mind today?", sender: 'ai', timestamp: new Date(), name: 'Mira', avatar: '/logo-ai.png' },
      ]);
      setIsLoadingSession(false);
      setCurrentDbSessionId(null); 
    } else {
      setIsLoadingSession(true);
      setCurrentDbSessionId(initialSessionId);
      const sessionDocRef = doc(db, 'users', user.uid, 'journalSessions', initialSessionId);

      getDoc(sessionDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setSessionTitle(docSnap.data().title || `Session from ${(docSnap.data().createdAt.toDate() as Date).toLocaleDateString()}`);
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
      // It's important to get the LATEST user profile data from Firestore for streak calculation
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
            newCurrentStreak = 1; // Streak broken or first journal in a while
          }
        } else {
          newCurrentStreak = 1; // First journal entry ever
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
        if (refreshUserProfile) { // Refresh user profile in AuthContext
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
      let isFirstMessageToday = false; // Flag to check if this is the first message of the day for streak

      if (!actualSessionId) {
        const sessionColRef = collection(db, 'users', user.uid, 'journalSessions');
        const newSessionDoc = await addDoc(sessionColRef, {
          title: `Journal - ${new Date().toLocaleDateString()}`,
          createdAt: serverTimestamp(),
          lastUpdatedAt: serverTimestamp(),
          userId: user.uid,
          firstMessagePreview: userMessageText.substring(0, 100),
        });
        actualSessionId = newSessionDoc.id;
        setCurrentDbSessionId(actualSessionId);
        router.replace(`/journal/${actualSessionId}`, { scroll: false });
        setSessionTitle(`Journal - ${new Date().toLocaleDateString()}`);
        isFirstMessageToday = true; // New session implies first message of the day for this session context
      } else {
        // For existing sessions, we check if this is the first message of *today* to update streak.
        // This simple check might not be perfect if user jumps between old sessions.
        // A more robust way is to check the user's lastJournalDate directly.
        const sessionDocRef = doc(db, 'users', user.uid, 'journalSessions', actualSessionId);
        const sessionSnap = await getDoc(sessionDocRef);
        if (sessionSnap.exists()) {
            const lastUpdated = (sessionSnap.data().lastUpdatedAt as Timestamp).toDate();
            if (getISODateString(lastUpdated) !== getISODateString(new Date())) {
                isFirstMessageToday = true;
            }
        }
      }


      const userMsgRef = await addDoc(collection(db, 'users', user.uid, 'journalSessions', actualSessionId!, 'messages'), userMessageData);
      setMessages(prev => prev.map(m => m.id === tempUserMessageId ? {...m, id: userMsgRef.id} : m));
      
      // Call streak update logic. It will internally check if an update is needed for today.
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
      };
      await addDoc(collection(db, 'users', user.uid, 'journalSessions', actualSessionId!, 'messages'), aiMessageData);

      await updateDoc(doc(db, 'users', user.uid, 'journalSessions', actualSessionId!), {
        lastUpdatedAt: serverTimestamp()
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

  const modeIcons = {
    Therapist: <Brain className="mr-2 h-4 w-4" />,
    Coach: <Zap className="mr-2 h-4 w-4" />,
    Friend: <Smile className="mr-2 h-4 w-4" />,
  };

  if (authLoading || isLoadingSession && initialSessionId !== 'new') {
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
          <Button variant="ghost" size="icon" onClick={() => toast({title: "Not Implemented", description: "Session settings are not yet available."})}>
            <Settings2 className="h-5 w-5" />
            <span className="sr-only">Session Settings</span>
          </Button>
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
