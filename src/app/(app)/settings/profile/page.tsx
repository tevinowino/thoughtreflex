
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is effectively handled by the main /settings page.
// We can redirect or show a message. For simplicity, redirect.
export default function ProfileSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="ml-4 text-muted-foreground">Redirecting to settings...</p>
    </div>
  );
}
