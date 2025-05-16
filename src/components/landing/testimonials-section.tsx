import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah L.',
    role: 'User since 2023',
    imageHint: 'woman portrait',
    quote: "ThoughtReflex understood me better than I expected. It's like having a supportive friend available 24/7. The weekly recaps are incredibly insightful.",
  },
  {
    name: 'Michael B.',
    role: 'Early Adopter',
    imageHint: 'man profile',
    quote: "I was skeptical about AI therapy, but this app changed my mind. The 'Therapist' mode is genuinely helpful for deep reflection.",
  },
  {
    name: 'Jessica P.',
    role: 'Student User',
    imageHint: 'student happy',
    quote: "As a student, stress is constant. ThoughtReflex helps me process my anxiety in a private, non-judgmental space. The goal setting is a great motivator.",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="w-full py-16 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Loved by Users Like You
          </h2>
          <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Hear what our community is saying about their journey with ThoughtReflex.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={`https://placehold.co/100x100.png`} alt={testimonial.name} data-ai-hint={testimonial.imageHint} />
                    <AvatarFallback>{testimonial.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-foreground/70">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-foreground/80 italic">"{testimonial.quote}"</blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
