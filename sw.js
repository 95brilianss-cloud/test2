const CACHE_NAME = 'turbine-v8-cache'; // Ubah versi setiap ada update besar
const assets = ['./', './index.html', './style.css', './manifest.json'];

self.addEventListener('install', e => {
  // skipWaiting memaksa SW baru segera menggantikan yang lama
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('activate', e => {
  // Mengambil kendali penuh halaman segera
  e.waitUntil(clients.claim().then(() => {
    // Membersihkan cache lama
    return caches.keys().then(keys => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    });
  }));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // Ambil dari cache, tapi tetap fetch dari network untuk update cache di latar belakang
      const fetchPromise = fetch(e.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      });
      return cachedResponse || fetchPromise;
    })
  );
});
