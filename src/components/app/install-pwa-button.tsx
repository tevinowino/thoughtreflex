
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
      setIsInstallable(true);
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
        title: 'Already Installed or Not Available',
        description: 'The app might already be installed, or your browser may not support this feature right now.',
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
    } else {
      toast({
        title: 'Installation Dismissed',
        description: 'You can install the app later from your browser menu or settings.',
        variant: 'default',
      });
    }
    // We can only use the deferred prompt once.
    setDeferredPrompt(null);
    setIsInstallable(false); // Hide button after prompt is shown, regardless of outcome
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
        <CheckCircle className="h-5 w-5" />
        <span>App Installed!</span>
      </div>
    );
  }

  if (!isInstallable) {
    return (
        <p className="text-sm text-muted-foreground">
            If your browser supports PWA installation, an option may appear in the address bar or browser menu.
        </p>
    );
  }

  return (
    <Button onClick={handleInstallClick} className="w-full sm:w-auto shadow-md">
      <DownloadCloud className="mr-2 h-5 w-5" />
      Install ThoughtReflex App
    </Button>
  );
}
