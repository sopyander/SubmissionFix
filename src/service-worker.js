import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

// Cache untuk API stories dengan strategi StaleWhileRevalidate
registerRoute(
  ({ url }) => url.href.startsWith('https://story-api.dicoding.dev/v1/stories'),
  new StaleWhileRevalidate({
    cacheName: 'storymap-api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, // 1 hari
      }),
    ],
  })
);

// Cache untuk gambar dari API dengan strategi CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'storymap-images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
);

// Cache untuk peta (OpenStreetMap tiles)
registerRoute(
  ({ url }) => url.href.includes('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'storymap-map-tiles-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 hari
      }),
    ],
  })
);

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');

  let notificationData = {
    title: 'Notifikasi Baru',
    options: {
      body: 'Anda memiliki pesan baru di StoryMap App.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'storymap-push', // Prevent duplicate notifications
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
