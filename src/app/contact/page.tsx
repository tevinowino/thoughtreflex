
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, FormEvent } from 'react';
import { Mail, MessageSquare, Send, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log({ name, email, message });

    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Message Sent!",
      description: "Thanks for reaching out. We'll get back to you as soon as possible.",
    });
    setName('');
    setEmail('');
    setMessage('');
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 max-w-lg sm:max-w-2xl">
      <Card className="shadow-xl sm:shadow-2xl rounded-xl sm:rounded-2xl">
        <CardHeader className="text-center p-4 sm:p-6">
          <Mail className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Get in Touch</CardTitle>
          <CardDescription className="text-base sm:text-lg text-foreground/80">
            We'd love to hear from you! Whether you have a question, feedback, or just want to say hello.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-foreground/90 text-sm">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Your Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="bg-muted/30 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-foreground/90 text-sm">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="bg-muted/30 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="message" className="text-foreground/90 text-sm">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Your message..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
                rows={5}
                className="bg-muted/30 text-sm sm:text-base"
              />
            </div>
            <Button type="submit" className="w-full shadow-md text-sm sm:text-base" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    