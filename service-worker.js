const CACHE_NAME = 'zeuvastec-language-v2-iphone-mic';
const APP_FILES = [
  './', './index.html', './style.css', './voice.css', './fix.css', './levels.css', './profile.css',
  './home-redesign.css', './flashcard-flip.css', './hero-illustration.css',
  './app.js', './interaction-fix.js', './guided-voice.js', './pwa.js', './profile.js', './audio-unlock.js',
  './simulador-bank.js', './exam.js', './audio-unlock.js', './sound-fix.js', './startup.css', './startup-image.png',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
