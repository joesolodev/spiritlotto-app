// Offline support: everything is fetched fresh when online, falling back to the last cached
// copy when offline.
const CACHE = "spiritlotto-v4";
const SHELL = [
  "./", "index.html", "styles.css", "manifest.webmanifest", "icon.svg",
  "js/main.js", "js/art.js", "js/ritual.js", "js/stage2.js", "js/practice.js", "js/journal.js", "js/meditations.js", "js/bowl.js", "js/voice.js", "js/games.js", "js/random.js", "js/picker.js", "js/ev.js", "js/budget.js",
  "data/model.json", "data/jackpots.json", "data/past_winners.json", "data/results.json", "data/practice.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const fonts = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  if (e.request.method !== "GET" || (url.origin !== location.origin && !fonts)) return;
  // Network first, so updates show up right away; the cache is the offline fallback.
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
