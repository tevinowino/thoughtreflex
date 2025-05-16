'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Placeholder for session data structure
interface JournalSession {
  id: string;
  title: string;
  date: string;
  excerpt: string;
}

const mockSessions: JournalSession[] = [
  { id: '1', title: 'Reflections on a Busy Week', date: 'October 26, 2023', excerpt: 'Felt a bit overwhelmed today but managed to...' },
  { id: '2', title: 'Morning Thoughts', date: 'October 25, 2023', excerpt: 'Woke up feeling grateful for the small things...' },
  { id: '3', title: 'Processing Difficult Emotions', date: 'October 23, 2023', excerpt: 'Today was challenging. I explored feelings of...' },
];


export default function JournalPage() {
  // In a real app, fetch sessions from Firestore
  const sessions = mockSessions; // Using mock data for now

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Journal</h1>
          <p className="text-muted-foreground">
            A private space for your thoughts, reflections, and conversations.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/journal/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Start New Session
          </Link>
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-12 shadow-lg rounded-2xl">
          <CardHeader>
            <div className="mx-auto bg-secondary p-3 rounded-full w-fit">
                <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4">Your Journal is Empty</CardTitle>
            <CardDescription>Start a new session to begin your journey of reflection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/journal/new">Create Your First Entry</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map(session => (
            <Card key={session.id} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{session.title}</CardTitle>
                <CardDescription>{session.date}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-foreground/80 line-clamp-3">{session.excerpt}</p>
              </CardContent>
              <div className="p-6 pt-0">
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/journal/${session.id}`}>Open Session</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
       <Card className="mt-12 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0 md:p-0 flex flex-col md:flex-row">
          <div className="p-6 md:p-8 flex-1 space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">Why Journal?</h3>
            <p className="text-foreground/80">
              Journaling is a powerful tool for self-discovery. It can help you:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li>Understand your emotions</li>
              <li>Reduce stress and anxiety</li>
              <li>Identify negative thought patterns</li>
              <li>Promote self-awareness and growth</li>
            </ul>
            <p className="text-foreground/80">
              ThoughtReflex enhances this by providing AI-guided conversations to deepen your reflections.
            </p>
          </div>
          <div className="md:w-1/3 flex-shrink-0">
             <Image 
              src="https://placehold.co/400x300.png"
              alt="Person journaling peacefully"
              width={400}
              height={300}
              className="object-cover w-full h-full"
              data-ai-hint="journal writing"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
