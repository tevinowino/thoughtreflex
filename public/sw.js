
// public/sw.js
self.addEventListener('install', (event) => {
  // console.log('ThoughtReflex Service Worker: Installing...');
  // This event is fired when the service worker is first installed.
  // You might pre-cache essential assets here if needed, but for a minimal setup,
  // just ensuring it installs is enough for PWA installability.
  self.skipWaiting(); // Ensures the new service worker activates immediately
});

self.addEventListener('activate', (event) => {
  // console.log('ThoughtReflex Service Worker: Activating...');
  // This event is fired when the service worker is activated.
  // It's a good place to clean up old caches.
  event.waitUntil(self.clients.claim()); // Ensures the SW takes control of clients without a page reload
});

self.addEventListener('fetch', (event) => {
  // console.log('ThoughtReflex Service Worker: Fetching ', event.request.url);
  // For a minimal PWA setup focused on installability, we don't need complex caching.
  // Next.js handles its own caching for JS/CSS chunks.
  // If you want offline capabilities, you'd implement caching strategies here.
  // For now, just let the browser handle the fetch as usual.
  return;
});
