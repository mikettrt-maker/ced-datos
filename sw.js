var CACHE_CED = 'ced-v3';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_CED).then(function (cache) {
      return cache.addAll(['logo.png', 'logo.svg', 'manifest.json']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(
        nombres.filter(function (n) { return n !== CACHE_CED; })
          .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.url.indexOf('script.google.com') !== -1) return;
  e.respondWith(
    fetch(e.request).then(function (respuesta) {
      if (respuesta.ok && e.request.method === 'GET') {
        var clon = respuesta.clone();
        caches.open(CACHE_CED).then(function (cache) {
          cache.put(e.request, clon);
        });
      }
      return respuesta;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('push', function (e) {
  var datos = { titulo: 'CED', cuerpo: 'Tienes un aviso nuevo.' };
  if (e.data) {
    try {
      var json = e.data.json();
      datos.titulo = json.titulo || datos.titulo;
      datos.cuerpo = json.cuerpo || json.mensaje || datos.cuerpo;
      datos.url = json.url || 'inicio.html';
    } catch (err) {
      datos.cuerpo = e.data.text();
    }
  }
  e.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: 'logo.png',
      badge: 'logo.png',
      tag: 'ced-aviso',
      requireInteraction: false,
      data: { url: datos.url || 'inicio.html' }
    })
  );
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = 'inicio.html';
  if (e.notification.data && e.notification.data.url) {
    url = e.notification.data.url;
  }
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ventanas) {
      for (var i = 0; i < ventanas.length; i++) {
        var v = ventanas[i];
        if (v.url.indexOf('inicio.html') !== -1 && 'focus' in v) {
          return v.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
