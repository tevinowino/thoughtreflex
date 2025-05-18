
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, BookOpen, Loader2, ShieldCheck, Edit3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface JournalSession {
  id: string;
  title: string;
  createdAt: Timestamp | Date;
  lastUpdatedAt: Timestamp | Date;
  firstMessagePreview?: string;
  userId: string;
}

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const sessionsColRef = collection(db, 'users', user.uid, 'journalSessions');
    const q = query(sessionsColRef, orderBy('lastUpdatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || `Session from ${(data.createdAt?.toDate ? data.createdAt.toDate() : new Date()).toLocaleDateString()}`,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          lastUpdatedAt: data.lastUpdatedAt?.toDate ? data.lastUpdatedAt.toDate() : new Date(),
          firstMessagePreview: data.firstMessagePreview || 'No preview available.',
          userId: data.userId,
        } as JournalSession;
      });
      setSessions(fetchedSessions);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching journal sessions:", error);
      toast({ title: "Error", description: "Could not fetch journal sessions.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your AI Journal Sessions</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Review and continue your conversations with Mira.
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
          <Link href="/journal/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Start New Session
          </Link>
        </Button>
      </div>
      
      <Card className="bg-primary/5 border-primary/20 shadow-sm rounded-xl">
        <CardContent className="p-3 sm:p-4 text-sm text-primary-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-foreground/80">Your journal entries are private and confidential.</span>
        </CardContent>
      </Card>


      {sessions.length === 0 && !isLoading ? (
        <Card className="text-center py-12 sm:py-16 shadow-xl rounded-2xl border-border/50">
          <CardHeader>
            <div className="mx-auto bg-secondary/20 p-4 rounded-full w-fit mb-4">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <CardTitle className="mt-2 text-xl sm:text-2xl font-semibold">Your Journal is Ready</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground/90">Start a new session to begin your journey of reflection with Mira.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="shadow-md hover:shadow-lg">
              <Link href="/journal/new">
                <Edit3 className="mr-2 h-4 w-4" /> Create Your First Entry
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map(session => (
            <Card key={session.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-2xl flex flex-col bg-card border-border/50 transform hover:-translate-y-1">
              <CardHeader className="pb-3 px-4 sm:px-5 pt-4 sm:pt-5">
                <CardTitle className="text-lg sm:text-xl font-semibold text-primary truncate">{session.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground/80">
                  Last entry: { (session.lastUpdatedAt instanceof Date ? session.lastUpdatedAt : new Date((session.lastUpdatedAt as Timestamp).seconds * 1000)).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) }
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow px-4 sm:px-5 pt-1 pb-4">
                <p className="text-sm text-foreground/80 italic line-clamp-3 leading-relaxed">
                  "{session.firstMessagePreview}"
                </p>
              </CardContent>
              <CardFooter className="p-4 sm:p-5 border-t border-primary/10 mt-auto">
                <Button variant="outline" asChild className="w-full group shadow-sm hover:shadow-md hover:border-primary/50">
                  <Link href={`/journal/${session.id}`}>
                    Continue Session <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       <Card className="mt-8 sm:mt-12 shadow-xl rounded-2xl overflow-hidden border-border/50">
        <CardContent className="p-0 flex flex-col md:flex-row items-center">
          <div className="p-6 sm:p-8 flex-1 space-y-3">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground">Why Journal with Mira?</h3>
            <p className="text-foreground/80 text-sm sm:text-base">
              Conversational AI journaling can help you:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80 text-sm sm:text-base">
              <li>Gain deeper emotional clarity.</li>
              <li>Receive empathetic, non-judgmental reflections.</li>
              <li>Explore thought patterns and identify triggers.</li>
              <li>Work towards your self-improvement goals.</li>
            </ul>
            <p className="text-foreground/80 text-sm sm:text-base pt-1">
              Mira adapts to your needs, whether you seek a therapist's insight, a coach's motivation, or a friend's support.
            </p>
          </div>
          <div className="md:w-1/3 flex-shrink-0 w-full h-48 md:h-auto">
             <Image 
              src="/images/journal/ai-journaling-promo.png"
              alt="Abstract representation of AI-assisted journaling"
              width={400}
              height={350}
              className="object-cover w-full h-full"
              data-ai-hint="digital brain connection"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

