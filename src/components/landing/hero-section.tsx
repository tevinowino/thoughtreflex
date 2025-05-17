// src/components/landing/hero-section.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function HeroSection() {
  const heroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
  };

  const pVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, delay: 0.2, ease: "easeOut" }
    },
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, delay: 0.4, ease: "easeOut" }
    },
  };


  return (
    <section className="relative w-full py-24 md:py-32 lg:py-44 xl:py-56 animated-gradient overflow-hidden">
      <div className="container px-4 md:px-6 text-center relative z-10">
         <motion.div
          className="mx-auto max-w-3xl space-y-8"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
          <motion.div variants={heroVariants} className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Introducing Mira, Your AI Companion
          </motion.div>
          <motion.h1 
            variants={heroVariants}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight"
          >
            Your Safe Space to Reflect. <span className="text-primary">Your AI Guide to Grow.</span>
          </motion.h1>
          <motion.p 
            variants={pVariants}
            className="text-lg text-foreground/80 md:text-xl max-w-2xl mx-auto"
          >
            ThoughtReflex offers AI-powered journaling with Mira, designed to help you understand your emotions, set goals, and foster well-being.
          </motion.p>
          <motion.div 
            variants={buttonVariants}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105">
              <Link href="/signup">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out bg-background/80 hover:bg-background transform hover:scale-105">
              <Link href="#features">Discover Features</Link>
            </Button>
          </motion.div>
          <motion.p 
            variants={pVariants} 
            className="text-sm text-foreground/70 pt-4"
          >
            Begin by sharing what's on your mind. Mira is here to listen.
          </motion.p>
        </motion.div>
      </div>
      {/* Optional: Add subtle background shapes or elements if desired */}
    </section>
  );
}
