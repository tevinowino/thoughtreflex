
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ThoughtReflex SW registered: ', registration);
        }).catch(registrationError => {
          console.log('ThoughtReflex SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  return null; // This component doesn't render anything visible
}
