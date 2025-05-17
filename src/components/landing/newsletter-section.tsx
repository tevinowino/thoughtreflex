// src/components/landing/newsletter-section.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { MailOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 }
  },
};

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Basic regex for email validation
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    console.log('Newsletter signup for:', email);
    toast({
      title: "Subscribed!",
      description: "You'll receive thoughtful insights and updates from ThoughtReflex.",
    });
    setEmail('');
  };

  return (
    <section id="newsletter" className="w-full py-16 md:py-24 lg:py-32 bg-background border-t">
      <motion.div 
        className="container grid items-center justify-center gap-6 px-4 text-center md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={sectionVariants}
      >
        <MailOpen className="h-12 w-12 text-primary mx-auto" />
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-foreground">
            Stay Connected with ThoughtReflex
          </h2>
          <p className="mx-auto max-w-[600px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Subscribe for occasional updates, insightful articles, and new feature announcements to support your mental wellness journey.
          </p>
        </div>
        <div className="mx-auto w-full max-w-md space-y-3">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1 py-3 px-4 text-base rounded-lg" // Increased padding and text size
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email for newsletter"
              required
            />
            <Button type="submit" size="lg" className="shadow-md sm:py-3 sm:px-6">Subscribe</Button>
          </form>
          <p className="text-xs text-foreground/60">
            We respect your privacy. Unsubscribe at any time. No spam, ever.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
