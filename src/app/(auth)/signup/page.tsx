import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SignupForm } from '@/components/auth/signup-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md shadow-2xl rounded-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold">Create Your Account</CardTitle>
        <CardDescription>Join ThoughtReflex and start your path to emotional wellness.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <OAuthButtons />
         <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign up with email
            </span>
          </div>
        </div>
        <SignupForm />
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log In
          </Link>
        </p>
        <p className="px-8 text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
        </p>
      </CardFooter>
    </Card>
  );
}
