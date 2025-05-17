
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, ThumbsUp, Wind, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { WeeklyRecap } from '../page'; // Import the interface
import { useToast } from '@/hooks/use-toast';

export default function RecapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const recapId = params.recapId as string;
  const { user, loading: authLoading } = useAuth();

  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    if (recapId && user) {
      setIsLoading(true);
      const recapDocRef = doc(db, 'users', user.uid, 'weeklyRecaps', recapId);
      getDoc(recapDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRecap({
            id: docSnap.id,
            ...data,
            generatedAt: (data.generatedAt as Timestamp)?.toDate ? (data.generatedAt as Timestamp).toDate() : new Date(),
          } as WeeklyRecap);
        } else {
          toast({ title: "Error", description: "Recap not found.", variant: "destructive" });
          router.push('/recaps');
        }
        setIsLoading(false);
      }).catch(error => {
        console.error("Error fetching recap details:", error);
        toast({ title: "Error", description: "Could not load recap details.", variant: "destructive" });
        setIsLoading(false);
        router.push('/recaps');
      });
    }
  }, [recapId, user, authLoading, router, toast]);

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.32))]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))]">
        <p className="text-muted-foreground mb-4">Recap not found.</p>
        <Button asChild variant="outline">
          <Link href="/recaps"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Recaps</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recaps">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Recaps</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">{recap.title}</h1>
      </div>
      
      <Card className="shadow-xl rounded-2xl">
        <CardHeader>
          <CardDescription className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" /> 
            {recap.weekOf} (Generated: {recap.generatedAt.toLocaleDateString()})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Summary of Your Week:</h3>
            <p className="text-foreground/80 whitespace-pre-wrap">{recap.summary}</p>
          </div>

          {recap.emotionalHigh && (
            <div className="p-4 bg-green-500/10 rounded-lg">
              <h4 className="font-semibold text-md text-green-700 dark:text-green-400 flex items-center mb-1">
                <ThumbsUp className="h-5 w-5 mr-2"/>Emotional High
              </h4>
              <p className="text-sm text-foreground/70">{recap.emotionalHigh}</p>
            </div>
          )}

          {recap.struggleOfTheWeek && (
            <div className="p-4 bg-red-500/10 rounded-lg">
              <h4 className="font-semibold text-md text-red-700 dark:text-red-400 flex items-center mb-1">
                <Wind className="h-5 w-5 mr-2"/>Struggle of the Week
              </h4>
              <p className="text-sm text-foreground/70">{recap.struggleOfTheWeek}</p>
            </div>
          )}

          {recap.growthMoment && (
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <h4 className="font-semibold text-md text-blue-700 dark:text-blue-400 flex items-center mb-1">
                <Zap className="h-5 w-5 mr-2"/>Growth Moment
              </h4>
              <p className="text-sm text-foreground/70">{recap.growthMoment}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    