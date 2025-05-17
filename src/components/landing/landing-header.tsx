// src/components/landing/landing-header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Brain, Menu } from 'lucide-react'; 
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useState } from 'react';

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#therapist-modes", label: "AI Modes" },
  { href: "#testimonials", label: "Testimonials" },
];

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Brain className="h-7 w-7 text-primary" />
          <span className="font-bold sm:inline-block text-xl text-foreground">
            ThoughtReflex
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link 
              key={link.label}
              href={link.href} 
              className="text-foreground/70 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <ModeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/signup">Sign Up</Link>
          </Button>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open mobile menu">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6 bg-card">
                <div className="flex flex-col space-y-5 mt-6">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.label}>
                      <Link 
                        href={link.href} 
                        className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="border-t pt-5 space-y-3">
                     <SheetClose asChild>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/login">Log In</Link>
                        </Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button asChild className="w-full">
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
