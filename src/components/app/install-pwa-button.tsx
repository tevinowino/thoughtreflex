
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadCloud, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only set installable if not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches && !(window.navigator as any).standalone) {
        setIsInstallable(true);
      }
      console.log('`beforeinstallprompt` event was fired.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log('ThoughtReflex PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false); 
      setDeferredPrompt(null); 
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check if running in standalone mode (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'Installation Not Available',
        description: 'The app install prompt is not available right now. Your browser might not support it, or it might already be installed.',
        variant: 'default',
      });
      return;
    }
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      toast({
        title: 'Installation Started!',
        description: 'ThoughtReflex is being added to your device.',
      });
      // The 'appinstalled' event will set isInstalled to true
    } else {
      toast({
        title: 'Installation Dismissed',
        description: 'You can install the app later from your browser menu or settings.',
        variant: 'default',
      });
    }
    // We can only use the deferred prompt once.
    setDeferredPrompt(null);
    setIsInstallable(false); 
  };

  if (isInstalled) {
    return null; // Hide the component completely if installed
  }

  if (!isInstallable) {
    // Optionally, you can return a message or null if you don't want to show anything when not installable
    // For the request to "hide this", returning null is appropriate here too.
    return null; 
  }

  return (
    <Button onClick={handleInstallClick} className="w-full sm:w-auto shadow-md" variant="outline" size="sm">
      <DownloadCloud className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
