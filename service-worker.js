// Service worker do Zeuvastec Language.
//
// Estratégia "rede primeiro, cache de reserva" (2026-09-20). A versão
// anterior usava "cache primeiro" e nunca renovava: quem já tinha aberto o
// app (inclusive o app da Play Store, que é só um atalho para este site)
// ficava preso na versão antiga para sempre, mesmo depois de um deploy.
// Agora toda abertura tenta a rede; o cache só é usado sem internet.
const CACHE_NAME = 'zeuvastec-language-v3-rede-primeiro';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // CDN (three.js etc.): o navegador cuida
  if (req.headers.has('range')) return;            // áudio/vídeo parcial: não mexe

  event.respondWith(
    fetch(req)
      .then((resposta) => {
        if (resposta && resposta.status === 200 && resposta.type === 'basic') {
          const copia = resposta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copia)).catch(() => {});
        }
        return resposta;
      })
      .catch(() => caches.match(req).then((guardado) => guardado || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
