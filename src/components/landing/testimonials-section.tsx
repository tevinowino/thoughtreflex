
// src/components/landing/testimonials-section.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Testimonial {
  id: string;
  displayName: string; // Will be "Anonymous User"
  photoURL?: string | null; // Will be null
  testimonialText: string;
  rating: number;
  createdAt: Timestamp | Date; 
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
};

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
          limit(3) 
        );
        const querySnapshot = await getDocs(q);
        const fetchedTestimonials = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || "Anonymous User", // Should always be "Anonymous User" from submission
            photoURL: data.photoURL || null, // Should always be null from submission
            testimonialText: data.testimonialText,
            rating: data.rating,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          } as Testimonial;
        });
        setTestimonials(fetchedTestimonials);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        // toast({ // Consider if toast is needed here, or just fallback UI
        //   title: "Error Loading Testimonials",
        //   description: "Could not load testimonials at this time.",
        //   variant: "destructive",
        // });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, [toast]);

  const getInitials = (name: string | null | undefined) => {
    if (!name || name === "Anonymous User") return 'A'; // Default for "Anonymous User" or truly null/undefined
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 1).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };


  return (
    <section id="testimonials" className="w-full py-16 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <motion.div 
          className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={sectionVariants}
        >
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium shadow-sm">Community Voices</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Loved by Users Like You
          </h2>
          <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Hear what our community is saying about their journey with ThoughtReflex.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
              >
                <Card className="h-full shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out rounded-2xl overflow-hidden transform hover:-translate-y-1">
                  <CardContent className="p-6 flex flex-col">
                    <div className="flex items-center mb-4">
                      <Avatar className="h-12 w-12 mr-4 border-2 border-primary/20">
                        <AvatarImage src={testimonial.photoURL || undefined} alt={testimonial.displayName} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">{getInitials(testimonial.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.displayName}</p>
                        <div className="flex mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("h-4 w-4", i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-foreground/80 italic flex-grow line-clamp-6">"{testimonial.testimonialText}"</blockquote>
                    <p className="text-xs text-muted-foreground mt-4 text-right">
                        Shared on {testimonial.createdAt instanceof Date ? testimonial.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="text-center py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <MessageCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No testimonials shared yet.</p>
            <p className="text-sm text-muted-foreground">Be the first to share your experience!</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

