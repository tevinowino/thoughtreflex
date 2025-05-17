
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
import { Loader2, Send, Star as StarIcon } from 'lucide-react'; // Renamed to avoid conflict

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testimonialText, setTestimonialText] = useState('');
  const [rating, setRating] = useState<string>('5'); // Default to 5 stars
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
        userId: user.uid,
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || null,
        testimonialText: testimonialText.trim(),
        rating: parseInt(rating, 10),
        consentGiven: consentGiven,
        isApproved: false, // Requires admin approval
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
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-2xl">
      <Card className="shadow-2xl rounded-2xl">
        <CardHeader className="text-center">
          <StarIcon className="h-10 w-10 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl font-bold text-foreground">Share Your Experience</CardTitle>
          <CardDescription className="text-md text-foreground/80">
            We'd love to hear about your journey with ThoughtReflex! Your feedback helps us grow and inspire others.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="testimonialText">Your Testimonial</Label>
              <Textarea
                id="testimonialText"
                placeholder="Share your thoughts on how ThoughtReflex has helped you..."
                value={testimonialText}
                onChange={(e) => setTestimonialText(e.target.value)}
                rows={6}
                className="bg-muted/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rating">Rating (out of 5 stars)</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger id="rating" className="w-[180px] bg-muted/30">
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consentGiven"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
              />
              <Label htmlFor="consentGiven" className="text-sm font-normal text-foreground/80">
                I agree to let ThoughtReflex use my testimonial (with my display name and avatar) publicly on the website and in other marketing materials.
              </Label>
            </div>
            
            { !consentGiven && (
                <p className="text-xs text-muted-foreground">If not checked, your testimonial will only be used internally for feedback.</p>
            )}

            <Button type="submit" className="w-full shadow-md" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
