
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function LoginForm() {
  const { signInWithEmail, loading, error } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmail(values.email, values.password);
      // Successful login is handled by AuthProvider redirect
    } catch (e: any) {
      // Error state is set by useAuth, and the Alert component below will show the primary error message.
      // A toast can be added here if desired for additional feedback, but it might be redundant.
      // toast({
      //   title: 'Login Failed',
      //   description: e.message || 'An unexpected error occurred.',
      //   variant: 'destructive',
      // });
    }
  }

  const getErrorMessage = () => {
    if (!error) return null;
    // Firebase error codes for common login issues:
    // auth/invalid-credential: General incorrect credential (can be email or password).
    // auth/wrong-password: Specifically the password was wrong.
    // auth/user-not-found: The email does not correspond to an existing user.
    // auth/invalid-email: Email format is invalid (though Zod usually catches this first).
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      return "Invalid email or password. Please check your credentials and try again.";
    }
    return error.message || "An unexpected error occurred. Please try again.";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} className="bg-muted/30"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="bg-muted/30"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Login Error</AlertTitle>
            <AlertDescription>
              {getErrorMessage()}
            </AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full shadow-md" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? 'Logging In...' : 'Log In'}
        </Button>
      </form>
    </Form>
  );
}
