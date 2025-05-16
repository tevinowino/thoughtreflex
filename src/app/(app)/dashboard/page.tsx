'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { BookText, Target, Sparkles, CalendarCheck, Edit3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!</h1>
          <p className="text-muted-foreground">
            Ready to reflect and grow? Here's your space.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/journal/new">
            <Edit3 className="mr-2 h-5 w-5" /> Start New Journal Session
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookText className="h-6 w-6 text-primary" />
              Recent Journals
            </CardTitle>
            <CardDescription>Continue your reflections or start a new entry.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent journal entries */}
            <p className="text-sm text-muted-foreground">No recent journal entries found.</p>
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/journal">View All Journals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Your Goals
            </CardTitle>
            <CardDescription>Track your progress towards emotional well-being.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for goals */}
            <p className="text-sm text-muted-foreground">You haven't set any goals yet.</p>
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/goals">Manage Goals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />
              Weekly Recap
            </CardTitle>
            <CardDescription>Review your emotional trends and victories from last week.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for weekly recap */}
            <p className="text-sm text-muted-foreground">Your weekly recap is not yet available.</p>
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/recaps">View Recaps</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl overflow-hidden">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Discover Insights
            </CardTitle>
            <CardDescription>Uncover patterns and gain deeper understanding of your emotional landscape.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-3">
            <p className="text-foreground/80">
              ThoughtReflex helps you identify recurring themes like anxiety, burnout, or moments of joy. 
              These insights can empower you to make positive changes.
            </p>
            <Button variant="outline" asChild>
              <Link href="/insights">Explore Your Insights</Link>
            </Button>
          </div>
           <div className="flex-shrink-0">
            <Image 
              src="https://placehold.co/300x200.png" 
              alt="Abstract representation of insights" 
              width={300} 
              height={200} 
              className="rounded-lg object-cover"
              data-ai-hint="abstract mind"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
