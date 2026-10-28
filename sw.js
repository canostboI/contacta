// Service worker de Contacta: guarda la app para que abra sin conexión.
// Los datos de proveedores los guarda la propia app (localStorage), no este archivo.
const CACHE = 'contacta-v1.12.5';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './config.js', './manifest.webmanifest',
  './img.js', './favicon.ico',
  './marca/contacta_horizontal_blanco.svg', './marca/contacta_icono_blanco.svg', './marca/contacta_icono_cuadrado_oscuro.svg', './marca/contacta_icono_oscuro_192.png', './marca/contacta_icono_oscuro_512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.endsWith('supabase.co')) return; // datos: siempre a la red
  // App: primero la red (para coger versiones nuevas) y, si no hay, la copia guardada.
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then((r) => { // no-cache: pregunta siempre si hay versión nueva
      if (r.ok && (url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net')) {
        const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match('./index.html')))
  );
});
