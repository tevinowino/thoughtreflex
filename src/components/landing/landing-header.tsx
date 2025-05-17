// src/components/landing/landing-header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react'; 
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Brain className="h-7 w-7 text-primary" />
          <span className="font-bold sm:inline-block text-xl text-foreground">
            ThoughtReflex
          </span>
        </Link>
        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="#features" className="text-foreground/70 transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="#how-it-works" className="text-foreground/70 transition-colors hover:text-primary">
            How It Works
          </Link>
          <Link href="#therapist-modes" className="text-foreground/70 transition-colors hover:text-primary">
            AI Modes
          </Link>
          <Link href="#testimonials" className="text-foreground/70 transition-colors hover:text-primary">
            Testimonials
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <ModeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign Up</Link>
          </Button>
          {/* Add a mobile menu trigger here if needed for smaller screens, using Sheet component from ShadCN */}
        </div>
      </div>
    </header>
  );
}
