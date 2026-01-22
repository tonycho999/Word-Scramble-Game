const CACHE_NAME = 'word-game-v2'; // 버전을 올려서 강제 업데이트

self.addEventListener('install', (event) => {
  self.skipWaiting(); // 즉시 활성화
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
