// Bump this whenever the app files change so the old cache is purged.
var CACHE = "gtt-v3";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) {
        return k !== CACHE;
      }).map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Network-first so a fresh deploy shows up as soon as the device is online,
// falling back to the cache when offline (e.g. at the range). The cache is
// refreshed on every successful fetch.
self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function(resp) {
      if (resp && resp.status === 200 && resp.type === "basic") {
        var copy = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
      }
      return resp;
    }).catch(function() {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
