// ReproSense service worker (A6). What it keeps on the device, and what it never does:
// - Static files (/_next/static, /images, fonts): cache first; they are versioned and hold no personal data.
// - Public demo pages (/, /demo, /trust, /pricing, /status): network first, last good copy when offline.
// - /offline.html: a self-contained page (no scripts), shown when a page cannot load offline.
// - Her app, the clinic, the admin areas, shared reports and every /api call: NEVER cached. They go to the network
//   only; offline, her pages show /offline.html instead. Nothing she logged is stored here.
// - A daily "time to log?" notification, only after she turned reminders on (permission asked on her tap).
const VERSION = "rs-pwa-v1";
const PUBLIC = ["/", "/demo", "/trust", "/pricing", "/status", "/offline.html"];
const OFFLINE = "/offline.html";
const PRIVATE = /^\/(app|clinic|clinic-admin|admin|shared|clinic-invite|join|signin|api)(\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      // One page failing (the API still waking) must not stop the install.
      .then((c) => Promise.all(PUBLIC.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/images/") || /\.(woff2|png|svg|ico)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVATE.test(url.pathname)) {
    // Network only. A page of hers that cannot load offline shows the offline page, never a stored copy.
    if (req.mode === "navigate") event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return; // client-side navigation payloads
  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }
  if (req.mode === "navigate" && PUBLIC.includes(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(url.pathname, res.clone()));
          return res;
        })
        .catch(() => caches.match(url.pathname).then((hit) => hit || caches.match(OFFLINE))),
    );
    return;
  }
  if (req.mode === "navigate") event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
});

// Reminders: neutral wording on purpose (a lock screen is not private). Opens her calendar.
function remind() {
  return self.registration.showNotification("ReproSense", {
    body: "A moment to log today?",
    icon: "/images/brand/derived/icon-192.png",
    badge: "/images/brand/derived/favicon-32.png",
    tag: "rs-log-reminder",
    data: { url: "/app/log" },
  });
}
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "rs-log-reminder") event.waitUntil(remind());
});
self.addEventListener("message", (event) => {
  if (event.data === "rs-remind-now") event.waitUntil(remind());
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/app/log"));
});
