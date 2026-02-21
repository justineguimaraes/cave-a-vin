// Version simple pour mise en cache des assets + offline de base

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("cave-vin-cache-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return (
        resp ||
        fetch(event.request).then((response) => {
          return response;
        })
      );
    })
  );
});