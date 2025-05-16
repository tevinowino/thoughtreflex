'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react'; // Or any other suitable logo icon
import { ModeToggle } from '@/components/mode-toggle';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            ThoughtReflex
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="#features" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Features
          </Link>
          <Link href="#how-it-works" className="text-foreground/60 transition-colors hover:text-foreground/80">
            How It Works
          </Link>
          <Link href="#testimonials" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Testimonials
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ModeToggle />
          <Button asChild variant="outline">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
