// src/components/landing/landing-footer.tsx
import Link from 'next/link';
import { Brain, Twitter, Github, Linkedin, Copyright } from 'lucide-react'; 

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 md:py-16 border-t bg-muted/50 text-foreground">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 items-start">
          <div className="flex flex-col items-start gap-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-semibold">
              <Brain className="h-7 w-7 text-primary" />
              ThoughtReflex
            </Link>
            <p className="text-sm text-foreground/70 max-w-sm">
              Your AI-powered therapist and emotional journal. Reflect deeply. Heal gently. Start your journey to self-awareness today.
            </p>
            <p className="text-xs text-primary font-semibold mt-1">
              Your thoughts are private. Always.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">Product</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/#features" className="text-foreground/70 hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-foreground/70 hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link href="/#therapist-modes" className="text-foreground/70 hover:text-primary transition-colors">AI Modes</Link></li>
              <li><Link href="/#testimonials" className="text-foreground/70 hover:text-primary transition-colors">Testimonials</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-foreground/70 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-foreground/70 hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="text-foreground/70 hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/privacy" className="text-foreground/70 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-foreground/70 hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-foreground/60 flex items-center">
            <Copyright className="h-3.5 w-3.5 mr-1.5" /> {currentYear} ThoughtReflex. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-5 sm:mt-0">
            <Link href="#" aria-label="Twitter" className="text-foreground/60 hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
            <Link href="#" aria-label="GitHub" className="text-foreground/60 hover:text-primary transition-colors"><Github className="h-5 w-5" /></Link>
            <Link href="#" aria-label="LinkedIn" className="text-foreground/60 hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
