// src/components/landing/features-section.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, MessageSquare, ShieldCheck, CalendarCheck, Target, TrendingUp } from 'lucide-react'; // Updated icons
import { motion } from 'framer-motion';

const features = [
  {
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
    title: 'AI Journaling (Mira)',
    description: 'Engage in empathetic, chat-based conversations with Mira, your AI companion.',
  },
  {
    icon: <BrainCircuit className="h-10 w-10 text-primary" />,
    title: 'Adaptive AI Modes',
    description: 'Tailor Mira\'s style: Therapist, Coach, or Friend, for personalized support.',
  },
  {
    icon: <Target className="h-10 w-10 text-primary" />,
    title: 'Goal Setting & Tracking',
    description: 'Define, manage, and track your personal growth milestones with AI suggestions.',
  },
  {
    icon: <CalendarCheck className="h-10 w-10 text-primary" />,
    title: 'Weekly AI Recaps',
    description: 'Receive personalized weekly summaries of your journal entries and progress.',
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-primary" />,
    title: 'Personalized Insights',
    description: 'Uncover emotional trends, recurring themes, and get key suggestions.',
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Secure & Private',
    description: 'Your thoughts are confidential, encrypted and stored securely.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <motion.div 
          className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary font-medium shadow-sm">Key Features</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Everything You Need for Mindful Reflection
          </h2>
          <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            ThoughtReflex offers a unique blend of AI-powered tools designed for your emotional well-being and personal growth.
          </p>
        </motion.div>
        <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={cardVariants}
            >
              <Card className="h-full shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out rounded-2xl overflow-hidden transform hover:-translate-y-1">
                <CardHeader className="flex flex-col items-center text-center gap-4 p-6 bg-muted/50">
                  {feature.icon}
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-foreground/70 text-center">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
