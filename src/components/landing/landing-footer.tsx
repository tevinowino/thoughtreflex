import Link from 'next/link';
import { Brain, Twitter, Github, Linkedin } from 'lucide-react'; // Or other social icons

export function LandingFooter() {
  return (
    <footer className="w-full py-12 md:py-16 border-t bg-muted">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="flex flex-col items-start gap-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <Brain className="h-6 w-6 text-primary" />
              ThoughtReflex
            </Link>
            <p className="text-sm text-foreground/70">
              Your AI-powered therapist and emotional journal. Reflect deeply. Heal gently.
            </p>
            <p className="text-sm text-foreground/80 font-medium mt-2">
              Your thoughts are private. Always.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Product</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#features" className="text-foreground/70 hover:text-primary">Features</Link></li>
              <li><Link href="#how-it-works" className="text-foreground/70 hover:text-primary">How It Works</Link></li>
              <li><Link href="/pricing" className="text-foreground/70 hover:text-primary">Pricing (Example)</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-foreground/70 hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="text-foreground/70 hover:text-primary">Contact</Link></li>
              <li><Link href="/careers" className="text-foreground/70 hover:text-primary">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/privacy" className="text-foreground/70 hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-foreground/70 hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between border-t pt-8 sm:flex-row">
          <p className="text-sm text-foreground/70">© {new Date().getFullYear()} ThoughtReflex. All rights reserved.</p>
          <div className="mt-4 flex space-x-4 sm:mt-0">
            <Link href="#" aria-label="Twitter" className="text-foreground/70 hover:text-primary"><Twitter className="h-5 w-5" /></Link>
            <Link href="#" aria-label="GitHub" className="text-foreground/70 hover:text-primary"><Github className="h-5 w-5" /></Link>
            <Link href="#" aria-label="LinkedIn" className="text-foreground/70 hover:text-primary"><Linkedin className="h-5 w-5" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
