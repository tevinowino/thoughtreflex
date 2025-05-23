
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Brain, Lightbulb, Users, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4 sm:mb-6" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">About ThoughtReflex</h1>
          <p className="text-base sm:text-lg md:text-xl text-foreground/80 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">
            Discover the story behind ThoughtReflex and our mission to make mental wellness accessible through AI-powered journaling.
          </p>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <Image
                src="/images/about/team-collaboration-visual.png"
                alt="Team collaborating on ideas for ThoughtReflex"
                width={600}
                height={400}
                className="rounded-xl sm:rounded-2xl shadow-xl object-cover"
              />
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Our Mission</div>
              <h2 className="text-2xl sm:text-3xl font-bold">Empowering Minds, One Reflection at a Time</h2>
              <p className="text-foreground/80 text-base sm:text-lg">
                At ThoughtReflex, we believe in the transformative power of introspection. Our mission is to provide a safe, accessible, and intelligent space for individuals to explore their thoughts and emotions, fostering self-awareness and promoting mental well-being.
              </p>
              <p className="text-foreground/80 text-base sm:text-lg">
                We leverage cutting-edge AI to offer empathetic guidance and insightful feedback, making the benefits of therapeutic journaling available to everyone, anytime, anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why ThoughtReflex Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Why We Built ThoughtReflex</h2>
            <p className="text-base sm:text-lg text-foreground/80 max-w-2xl sm:max-w-3xl mx-auto mt-3 sm:mt-4">
              Mental health is a journey, and everyone deserves a supportive companion. We created ThoughtReflex to bridge the gap between daily life stressors and the need for reflective practice.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
              <Lightbulb className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl mb-2">Accessibility</CardTitle>
              <CardContent className="text-foreground/70 text-sm sm:text-base">
                Providing on-demand mental wellness support that fits into your life, without the barriers of traditional therapy.
              </CardContent>
            </Card>
            <Card className="shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
              <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl mb-2">Innovation</CardTitle>
              <CardContent className="text-foreground/70 text-sm sm:text-base">
                Utilizing AI to create a deeply personal and adaptive journaling experience that grows with you.
              </CardContent>
            </Card>
            <Card className="shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl mb-2">Empathy</CardTitle>
              <CardContent className="text-foreground/70 text-sm sm:text-base">
                Building a tool that listens without judgment, encouraging open and honest self-expression.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Join Our Community</h2>
          <p className="text-base sm:text-lg text-foreground/80 max-w-md sm:max-w-xl mx-auto mb-6 sm:mb-8">
            Start your journey towards greater self-understanding and emotional balance with ThoughtReflex.
          </p>
          <Button size="lg" asChild className="shadow-lg text-sm sm:text-base">
            <Link href="/signup">Get Started for Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

    