const cacheName = 'cache-v4';
const OFFLINE_URL = '/static/offline.html';
const precacheResources = [
  '/static/offline.html',
  '/static/media/icon_512.png',
  '/static/media/more.png',
  '/static/media/leave.png',
  '/static/media/send_buttton_disabled.png',
  '/static/media/sure.png'
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
