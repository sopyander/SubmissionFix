import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

// Cache semua asset hasil build
precacheAndRoute(self.__WB_MANIFEST);

// Handle navigasi SPA
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

// ⚠️ Jangan cache API eksternal seperti Dicoding API
// Cache hanya untuk file lokal (origin sama)
registerRoute(
  ({ url }) => url.origin === self.location.origin,
  new StaleWhileRevalidate({
    cacheName: 'local-assets',
  })
);

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');

  let notificationData = {
    title: 'Notifikasi Baru',
    options: {
      body: 'Anda memiliki pesan baru di StoryMap App.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
    },
  };

  if (event.data) {
    try {
      const dataAsJson = event.data.json();
      notificationData.title = dataAsJson.title || notificationData.title;
      notificationData.options.body = dataAsJson.body || notificationData.options.body;
    } catch (e) {
      notificationData.options.body = event.data.text();
    }
  }

  const { title, options } = notificationData;
  event.waitUntil(self.registration.showNotification(title, options));
});
