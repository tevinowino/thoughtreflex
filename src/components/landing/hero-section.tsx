'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative w-full py-20 md:py-32 lg:py-40 xl:py-48 animated-gradient">
      <div className="container px-4 md:px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
            Talk to someone who listens. <span className="text-primary">Always.</span>
          </h1>
          <p className="text-lg text-foreground/80 md:text-xl">
            ThoughtReflex is your AI-powered therapist and emotional journal. Reflect deeply. Heal gently.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">
                Start Journaling
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="shadow-lg hover:shadow-xl transition-shadow bg-background/80 hover:bg-background">
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>
          <p className="text-sm text-foreground/70 pt-4">
            Example: "What’s something you’ve been avoiding lately?"
          </p>
        </div>
      </div>
    </section>
  );
}
