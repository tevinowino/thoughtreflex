// src/components/landing/how-it-works-section.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilLine, MessagesSquare, Repeat, Award, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: <PencilLine className="h-10 w-10 text-primary mb-3" />,
    title: '1. Start Journaling',
    description: 'Begin a session and share your thoughts, feelings, and experiences in a safe, private space with Mira, your AI companion.',
  },
  {
    icon: <MessagesSquare className="h-10 w-10 text-primary mb-3" />,
    title: '2. AI Conversation',
    description: 'Receive empathetic responses and guiding questions from Mira, adapting to your chosen Therapist, Coach, or Friend mode.',
  },
  {
    icon: <Repeat className="h-10 w-10 text-primary mb-3" />,
    title: '3. Discover Insights',
    description: 'Uncover recurring themes, emotional patterns, and personalized suggestions based on your entries over time.',
  },
  {
    icon: <Award className="h-10 w-10 text-primary mb-3" />,
    title: '4. Grow & Heal',
    description: 'Set and track healing goals, celebrate progress with weekly AI recaps, and foster self-awareness.',
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 }
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-16 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <motion.div 
          className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={sectionVariants}
        >
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium shadow-sm">Simple Steps</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">Your Journey with ThoughtReflex</h2>
          <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            An intuitive process designed to guide you towards emotional well-being and self-discovery.
          </p>
        </motion.div>
        <motion.div 
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
        >
          {steps.map((step, index) => (
            <motion.div key={step.title} variants={cardVariants}>
              <Card className="h-full text-center shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out rounded-2xl p-6 transform hover:-translate-y-1 flex flex-col">
                <div className="flex justify-center items-center p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-4">
                  {step.icon}
                </div>
                <CardTitle className="text-xl font-semibold mb-2">{step.title}</CardTitle>
                <CardDescription className="text-foreground/70 flex-grow">{step.description}</CardDescription>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg text-foreground/80">
            Start your path to a more mindful and emotionally balanced life today.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
