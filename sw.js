const CACHE_NAME = 'pea-stock-v2';
const urlsToCache = [ './', './manifest.json' ];

// เมื่อติดตั้ง Service Worker ให้ทำการบังคับใช้ทันที (skipWaiting)
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil( caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)) );
});

// เคลียร์ Cache ตัวเก่าทิ้งเมื่อมีการอัปเดตเวอร์ชันใหม่
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// กลยุทธ์ Network First: พยายามโหลดจากเว็บ (GitHub) ก่อนเสมอ ถ้าเน็ตหลุดถึงจะไปเอาจาก Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // หากโหลดสำเร็จ ให้เอาไปอัปเดตใน Cache ด้วย
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => { cache.put(event.request, responseToCache); });
        }
        return response;
      })
      .catch(() => {
        // ถ้าไม่มีเน็ต ค่อยดึงของเก่าจาก Cache
        return caches.match(event.request);
      })
  );
});
