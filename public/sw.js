/// <reference lib="webworker" />

// 📦 Precarga recursos estáticos y manejo offline (Workbox)
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
} catch (e) {
  console.warn('⚠️ No se pudo cargar Workbox CDN (posiblemente offline):', e);
}

if (typeof workbox !== 'undefined' && workbox) {
  // Precaching del bundle de la aplicación
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // 🌐 Navegación SPA Offline Fallback:
  // Cualquier navegación (ej: /wallet, /shopping, /settings) servirá index.html desde caché sin conexión
  try {
    const navigationHandler = workbox.precaching.createHandlerBoundToURL('/index.html');
    const navigationRoute = new workbox.routing.NavigationRoute(navigationHandler);
    workbox.routing.registerRoute(navigationRoute);
  } catch (err) {
    console.warn('⚠️ No se pudo registrar la ruta de navegación offline:', err);
  }

  // 🖼️ Caché de imágenes y estáticos
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'waddle-images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'font' || request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'waddle-assets-cache',
    })
  );
} else {
  console.error('❌ Workbox no se cargó correctamente');
}

// ⚡ Escuchar mensaje para saltar espera al actualizar
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 🔥 Firebase para push (protegido contra fallos de red al estar offline)
try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    firebase.initializeApp({
      apiKey: "AIzaSyBWqh2ml4INSiHpBhlN_GImjqsaCQA1YKg",
      authDomain: "waddle-rb-duck.firebaseapp.com",
      projectId: "waddle-rb-duck",
      storageBucket: "waddle-rb-duck.firebasestorage.app",
      messagingSenderId: "781257613224",
      appId: "1:781257613224:web:24893bae0c6827d3e4479d",
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log("📦 Mensaje recibido en background:", payload);

      const { title, body } = payload.notification || {};
      self.registration.showNotification(title || 'Notificación', {
        body: body || '',
        icon: '/pwa-192x192.png',
        tag: 'waddle-general',
        renotify: true
      });
    });
  }
} catch (err) {
  console.warn("⚠️ Firebase Messaging en SW no disponible sin conexión:", err);
}
