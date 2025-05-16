'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic email validation
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    // Placeholder for newsletter signup logic
    console.log('Newsletter signup for:', email);
    toast({
      title: "Subscribed!",
      description: "You'll receive weekly prompts in your inbox soon.",
    });
    setEmail('');
  };

  return (
    <section id="newsletter" className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-foreground">
            Get Weekly Prompts in Your Inbox
          </h2>
          <p className="mx-auto max-w-[600px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Subscribe to our newsletter for thoughtful prompts and updates to inspire your journaling practice.
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-2">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="max-w-lg flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email for newsletter"
            />
            <Button type="submit" className="shadow-md">Subscribe</Button>
          </form>
          <p className="text-xs text-foreground/60">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
