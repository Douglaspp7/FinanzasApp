const CACHE = 'sindeudas-v19';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './i18n.js',
  './auth.js',
  './manifest.json',
  './assets/logo_sindeudas.png',
  './assets/auth_bg.png',
  './assets/onb_step1.png',
  './assets/onb_step2.png',
  './assets/app_logo.png',
  './assets/btn_registrar.png',
  './assets/btn_dividas.png',
  './assets/btn_metas.png',
  './assets/btn_perfil.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Permite forçar atualização imediata a partir da página
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const url = new URL(req.url);

  // O "shell de código" (navegação + HTML/JS/CSS do próprio site) usa NETWORK-FIRST,
  // para que toda atualização publicada seja recebida na hora (com fallback offline).
  const sameOrigin = url.origin === self.location.origin;
  const isCodeShell = sameOrigin && (req.mode === 'navigate' || /\.(?:html|js|css)$/.test(url.pathname));

  if (isCodeShell) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Demais recursos (imagens, fontes, etc.): CACHE-FIRST.
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
