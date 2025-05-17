
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Testimonial {
  id: string;
  displayName: string;
  photoURL?: string | null;
  testimonialText: string;
  rating: number;
  createdAt: Timestamp | Date; // Firestore timestamp or Date object
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTestimonials = async () => {
      setIsLoading(true);
      try {
        const testimonialsColRef = collection(db, 'testimonials');
        const q = query(
          testimonialsColRef,
          where('isApproved', '==', true),
          where('consentGiven', '==', true),
          orderBy('createdAt', 'desc'),
          limit(3) // Show latest 3 approved testimonials
        );
        const querySnapshot = await getDocs(q);
        const fetchedTestimonials = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName,
            photoURL: data.photoURL,
            testimonialText: data.testimonialText,
            rating: data.rating,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          } as Testimonial;
        });
        setTestimonials(fetchedTestimonials);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        toast({
          title: "Error Loading Testimonials",
          description: "Could not load testimonials at this time.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, [toast]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 1).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };


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

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={testimonial.photoURL || `https://placehold.co/100x100.png`} alt={testimonial.displayName} data-ai-hint="user avatar" />
                      <AvatarFallback>{getInitials(testimonial.displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.displayName}</p>
                      <p className="text-sm text-foreground/70">
                        Joined {testimonial.createdAt instanceof Date ? testimonial.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-5 w-5", i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50")} />
                    ))}
                  </div>
                  <blockquote className="text-foreground/80 italic line-clamp-5">"{testimonial.testimonialText}"</blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">No testimonials yet. Be the first to share your thoughts!</p>
            {/* Optionally, add a link to the feedback page for logged-in users, or a general CTA */}
          </div>
        )}
      </div>
    </section>
  );
}
