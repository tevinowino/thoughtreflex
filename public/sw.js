
// public/sw.js
self.addEventListener('install', (event) => {
  console.log('ThoughtReflex Service Worker: Installing...');
  // Add caching strategies here if needed in the future
  // For now, just activate
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('ThoughtReflex Service Worker: Activating...');
  // Claim clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic pass-through fetch handler.
  // Next.js handles most caching. For more advanced offline, this needs expansion.
  // event.respondWith(fetch(event.request));
});

self.addEventListener('notificationclick', (event) => {
  console.log('ThoughtReflex Service Worker: Notification clicked.');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(client => client.navigate(urlToOpen));
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('ThoughtReflex Service Worker: Notification closed.', event.notification);
});
