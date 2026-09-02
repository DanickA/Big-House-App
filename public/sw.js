const CACHE_NAME = 'hogarapp-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Fallo al pre-cachear algunos recursos:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar solicitudes GET
  if (event.request.method !== 'GET') return;

  // No interceptar peticiones de extensiones o protocolos no soportados
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la respuesta de red es válida y es un recurso estático (imágenes/iconos/manifest), cachear en segundo plano
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const url = new URL(event.request.url);
          if (url.pathname.startsWith('/icons/') || url.pathname.includes('manifest')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }
        return networkResponse;
      })
      .catch(async () => {
        // Si no hay conexión a internet, intentar responder con caché
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback para navegación de páginas si está desconectado
        if (event.request.mode === 'navigate') {
          return caches.match('/') || new Response('Sin conexión a Internet', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }
        return new Response('No disponible sin conexión', { status: 503 });
      })
  );
});
