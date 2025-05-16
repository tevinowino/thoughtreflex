'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Brain, Mic, Settings2, Smile, Zap, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
// import { getTherapistResponse, TherapistModeInput } from '@/ai/flows/therapist-modes'; // This will be used when server actions are set up
// import { doc, getDoc, updateDoc, arrayUnion, Timestamp, setDoc, collection } from 'firebase/firestore';
// import { db } from '@/lib/firebase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  avatar?: string;
  name: string;
}

type TherapistMode = 'Therapist' | 'Coach' | 'Friend';


export default function JournalSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionTitle, setSessionTitle] = useState('Loading session...');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const [currentTherapistMode, setCurrentTherapistMode] = useState<TherapistMode>('Therapist');

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock function to get initials
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().substring(0,2);
  };
  
  // Effect to load session data (mocked for now)
  useEffect(() => {
    if (sessionId === 'new') {
      setSessionTitle('New Journal Session');
      setMessages([
        { id: '0', text: "Welcome! I'm here to listen. What's on your mind today?", sender: 'ai', timestamp: new Date(), name: 'ThoughtReflex AI', avatar: '/logo-ai.png' },
      ]);
    } else {
      // In a real app, fetch from Firestore
      setSessionTitle(`Session ${sessionId}`);
      // Mock messages
      setMessages([
        { id: '0', text: "Welcome back! Let's continue where we left off.", sender: 'ai', timestamp: new Date(), name: 'ThoughtReflex AI', avatar: '/logo-ai.png' },
        { id: '1', text: "I was thinking about what we discussed yesterday...", sender: 'user', timestamp: new Date(Date.now() - 100000), name: user?.displayName || 'User', avatar: user?.photoURL || undefined },
        { id: '2', text: "That's a good starting point. Tell me more about those thoughts.", sender: 'ai', timestamp: new Date(Date.now() - 50000), name: 'ThoughtReflex AI', avatar: '/logo-ai.png' },
      ]);
    }
  }, [sessionId, user]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
      name: user.displayName || 'User',
      avatar: user.photoURL || undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoadingAiResponse(true);

    // Simulate AI response (replace with actual API call via Server Action)
    // const aiFlowInput: TherapistModeInput = { userInput: input, mode: currentTherapistMode };
    // const aiResponse = await getTherapistResponse(aiFlowInput); // This would be a server action call

    // Mock AI response
    setTimeout(() => {
      let aiText = "I'm processing that...";
      if (currentTherapistMode === 'Therapist') {
        aiText = `That's an interesting point, ${user.displayName?.split(' ')[0]}. Could you elaborate on what "${input.substring(0,15)}..." means to you in this context?`;
      } else if (currentTherapistMode === 'Coach') {
        aiText = `Okay, ${user.displayName?.split(' ')[0]}, thanks for sharing that. How does this relate to your goal of [example goal]? What's one action step you can take?`;
      } else { // Friend
        aiText = `Gotcha, ${user.displayName?.split(' ')[0]}. I hear you. It sounds like you're going through a lot with "${input.substring(0,15)}...". Want to talk more about it or just vent?`;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
        name: 'ThoughtReflex AI',
        avatar: '/logo-ai.png', // Placeholder AI avatar
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoadingAiResponse(false);
    }, 1500);

    // Firestore logic would go here (saving userMessage and aiMessage)
    // if (sessionId === 'new') { ... create new session ... } else { ... update existing session ... }
  };
  
  const modeIcons = {
    Therapist: <Brain className="mr-2 h-4 w-4" />,
    Coach: <Zap className="mr-2 h-4 w-4" />,
    Friend: <Smile className="mr-2 h-4 w-4" />,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.32))] md:h-[calc(100vh-theme(spacing.24))] bg-card rounded-2xl shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-xl truncate">{sessionTitle}</CardTitle>
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
          <Button variant="ghost" size="icon">
            <Settings2 className="h-5 w-5" />
            <span className="sr-only">Session Settings</span>
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-2 max-w-[75%]",
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={msg.avatar} data-ai-hint={msg.sender === 'user' ? 'profile user' : 'ai bot'} />
              <AvatarFallback>
                {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "p-3 rounded-2xl shadow",
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted text-foreground rounded-bl-none'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={cn(
                  "text-xs mt-1",
                  msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70 text-left'
                )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoadingAiResponse && (
          <div className="flex items-end gap-2 mr-auto">
            <Avatar className="h-8 w-8">
              <AvatarFallback><Brain className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="p-3 rounded-2xl shadow bg-muted text-foreground rounded-bl-none">
              <p className="text-sm italic">AI is thinking...</p>
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
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Mic className="h-5 w-5" />
              <span className="sr-only">Voice Input</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
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
