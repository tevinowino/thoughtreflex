
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState, FormEvent } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Send, Star as StarIcon } from 'lucide-react'; 

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testimonialText, setTestimonialText] = useState('');
  const [rating, setRating] = useState<string>('5'); 
  const [consentGiven, setConsentGiven] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit feedback.", variant: "destructive" });
      return;
    }
    if (!testimonialText.trim()) {
      toast({ title: "Error", description: "Please write your testimonial before submitting.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        // userId: user.uid, // Removed for anonymity
        displayName: 'Anonymous User', // Always anonymous
        photoURL: null, // Always anonymous
        testimonialText: testimonialText.trim(),
        rating: parseInt(rating, 10),
        consentGiven: consentGiven,
        isApproved: false, 
        createdAt: serverTimestamp(),
      });
      toast({ title: "Feedback Submitted!", description: "Thank you for sharing your thoughts. Your testimonial will be reviewed." });
      setTestimonialText('');
      setRating('5');
      setConsentGiven(true);
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      toast({ title: "Submission Failed", description: "Could not submit your testimonial. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 max-w-xl sm:max-w-2xl">
      <Card className="shadow-xl sm:shadow-2xl rounded-xl sm:rounded-2xl">
        <CardHeader className="text-center p-4 sm:p-6">
          <StarIcon className="h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-2 sm:mb-3" />
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">Share Your Experience</CardTitle>
          <CardDescription className="text-sm sm:text-md text-foreground/80">
            We'd love to hear about your journey with ThoughtReflex! Your feedback helps us grow and inspire others. All submissions are anonymous.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="testimonialText" className="text-sm">Your Testimonial</Label>
              <Textarea
                id="testimonialText"
                placeholder="Share your thoughts on how ThoughtReflex has helped you..."
                value={testimonialText}
                onChange={(e) => setTestimonialText(e.target.value)}
                rows={5}
                className="bg-muted/30 text-sm sm:text-base"
                required
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="rating" className="text-sm">Rating (out of 5 stars)</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger id="rating" className="w-[160px] sm:w-[180px] bg-muted/30 text-sm sm:text-base">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Stars (Excellent)</SelectItem>
                  <SelectItem value="4">4 Stars (Great)</SelectItem>
                  <SelectItem value="3">3 Stars (Good)</SelectItem>
                  <SelectItem value="2">2 Stars (Fair)</SelectItem>
                  <SelectItem value="1">1 Star (Poor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="consentGiven"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
              />
              <Label htmlFor="consentGiven" className="text-xs sm:text-sm font-normal text-foreground/80">
                I agree to let ThoughtReflex use my anonymous testimonial publicly on the website and in other marketing materials.
              </Label>
            </div>
            
            { !consentGiven && (
                <p className="text-xs text-muted-foreground">If not checked, your anonymous testimonial will only be used internally for feedback.</p>
            )}

            <Button type="submit" className="w-full shadow-md text-sm sm:text-base" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit Anonymous Testimonial'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
