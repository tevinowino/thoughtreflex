'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Chrome } from 'lucide-react'; // Using Chrome as a generic browser icon for Google

export function OAuthButtons() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={loading}
      >
        <Chrome className="mr-2 h-4 w-4" />
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Button>
      {/* Add other OAuth providers here if needed */}
    </div>
  );
}
