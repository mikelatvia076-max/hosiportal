// Agnes Memorial Medical Hospital - service worker (lets the app install)
const CACHE = "agnes-hospital-v1";
const SHELL = ["./", "hospital-login.html", "login.css", "login.js", "config.js", "pwa.js", "pwa.css", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  // add files one by one so a missing file never blocks the install
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((f) => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first, cache only as a fallback. Only this site's own files are handled.
// Backend (API) calls are on another address, so they always go straight to the network.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.searchParams.has("ping")) return;   // connection check: always ask the real network
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === "navigate" ? caches.match("hospital-login.html") : Response.error())
        )
      )
  );
});