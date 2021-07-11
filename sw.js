const CACHE_NAME = 'cache-v4';
const FILES_TO_CACHE = [
  '/static/offline.html',
  '/static/media/icon_512.png',
  '/static/media/more.png',
  '/static/media/leave.png',
  '/static/media/send_buttton_disabled.png',
  '/static/media/sure.png',
  '/static/media/logo.png',
  '/static/media/logo_inv.png',
  '/static/media/hat_0.png',
  '/static/media/hat_1.png',
  '/static/media/hat_2.png',
  '/static/media/hat_3.png',
  '/static/media/hat_4.png',
  '/static/media/hat_5.png',
  '/static/media/hat_6.png'
];


self.addEventListener('install', (evt) => {
	console.log('[ServiceWorker] Install');

	evt.waitUntil(caches.open(CACHE_NAME).then((cache) => {
		console.log('[ServiceWorker] Pre-caching offline page');
		return cache.addAll(FILES_TO_CACHE);
	}));

	self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
	console.log('[ServiceWorker] Activate');

	evt.waitUntil(caches.keys().then((keyList) => {
		return Promise.all(keyList.map((key) => {
			if (key !== CACHE_NAME) {
				console.log('[ServiceWorker] Removing old cache', key);
				return caches.delete(key);
			}
		}));
	}));

	self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
	//console.log('[ServiceWorker] Fetch', evt.request.url);

	if (evt.request.mode !== 'navigate') return;
	evt.respondWith(fetch(evt.request).catch(() => {
		return caches.open(CACHE_NAME).then((cache) => {
			return cache.match('/static/offline.html');
		});
	}));
});

