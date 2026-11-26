// Service worker de l'appli de Dorian : toujours la dernière version publiée.
// À chaque ouverture, il demande la page au site (le téléphone ne garde plus une ancienne copie
// pendant 10 minutes). Sans connexion, il montre la dernière version connue.
const CACHE = "mis-deberes";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // Google, voix… : on ne touche à rien
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((rep) => {
        if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put(req, copie)); }
        return rep;
      })
      .catch(() => caches.match(req, { ignoreSearch: false }).then((r) => r || caches.match(req, { ignoreSearch: true })))
  );
});
