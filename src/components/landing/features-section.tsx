import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, TrendingUp, Mail, BrainCircuit, MessageSquare, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: <Handshake className="h-10 w-10 text-primary" />,
    title: 'Human-Like Chat',
    description: 'Engage in natural, empathetic conversations with an AI that understands.',
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-primary" />,
    title: 'Progress Tracking',
    description: 'Identify recurring patterns and track your emotional growth over time.',
  },
  {
    icon: <Mail className="h-10 w-10 text-primary" />,
    title: 'Weekly Recaps',
    description: 'Receive personalized weekly summaries of your reflections and progress.',
  },
  {
    icon: <BrainCircuit className="h-10 w-10 text-primary" />,
    title: 'Therapist Modes',
    description: 'Switch between Therapist, Coach, or Friend modes for tailored support.',
  },
  {
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
    title: 'Goal Setting',
    description: 'Define and work towards your healing goals with AI guidance.',
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Secure & Private',
    description: 'Your thoughts are encrypted and stored securely, ensuring utmost privacy.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Key Features</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Why Choose ThoughtReflex?
          </h2>
          <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            ThoughtReflex offers a unique blend of AI-powered therapy tools designed for your emotional well-being and personal growth.
          </p>
        </div>
        <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {feature.icon}
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
