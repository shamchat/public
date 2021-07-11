const cacheName = 'cache-v4';
const OFFLINE_URL = '../offline.html';
const precacheResources = [
  '../offline.html',
  '../media/icon_512.png'
];

self.addEventListener('install', event => {
  console.log('Service worker install event!');
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        return cache.addAll(precacheResources);
      })
  );
});

self.addEventListener('fetch', event => {
  console.log('Fetch intercepted for:', event.request.url);
  event.respondWith(caches.match(event.request)
    .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => caches.match(OFFLINE_URL))
        .catch(error => {
        console.log(error);
        
        });
    }));
  if (event.request.mode === 'navigate') {
  return event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
    }
});
