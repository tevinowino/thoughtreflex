
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, FormEvent } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // In a real app, you would send this data to a backend or email service
    console.log({ name, email, message });

    // Simulate API call
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
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-2xl">
      <Card className="shadow-2xl rounded-2xl">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-foreground">Get in Touch</CardTitle>
          <CardDescription className="text-lg text-foreground/80">
            We'd love to hear from you! Whether you have a question, feedback, or just want to say hello.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground/90">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Your Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/90">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-foreground/90">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Your message..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
                rows={5}
                className="bg-muted/30"
              />
            </div>
            <Button type="submit" className="w-full shadow-md" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <MessageSquare className="mr-2 h-4 w-4 animate-pulse" />
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
