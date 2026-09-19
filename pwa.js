if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
    .then((reg) => console.log('Service worker registrado:', reg.scope))
    .catch((err) => console.error('Falha ao registrar service worker:', err));
}
