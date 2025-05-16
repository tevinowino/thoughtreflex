import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilLine, MessagesSquare, Repeat, Award } from 'lucide-react';

const steps = [
  {
    icon: <PencilLine className="h-8 w-8 text-primary mb-2" />,
    title: '1. Start Journaling',
    description: 'Begin a session and share your thoughts, feelings, and experiences in a safe space.',
  },
  {
    icon: <MessagesSquare className="h-8 w-8 text-primary mb-2" />,
    title: '2. AI-Powered Conversation',
    description: 'Receive empathetic responses and guiding questions from your AI therapist.',
  },
  {
    icon: <Repeat className="h-8 w-8 text-primary mb-2" />,
    title: '3. Identify Patterns',
    description: 'Discover recurring themes and insights from your journal entries over time.',
  },
  {
    icon: <Award className="h-8 w-8 text-primary mb-2" />,
    title: '4. Grow & Heal',
    description: 'Work towards your healing goals with personalized support and weekly recaps.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-16 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">How ThoughtReflex Works</h2>
          <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            A simple, intuitive process to guide you on your journey to emotional well-being.
          </p>
        </div>
        <div className="relative">
          {/* Optional: Add a connecting line later if desired */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={step.title} className="text-center shadow-lg hover:shadow-xl transition-shadow rounded-2xl p-6">
                <div className="flex justify-center">
                  {step.icon}
                </div>
                <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
