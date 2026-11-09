// Service worker do GBSFinances: guarda os arquivos do app no aparelho para
// abrir sem internet. Os dados ficam no prÃ³prio app (criptografados) e a
// sincronizaÃ§Ã£o com a nuvem (api.github.com) nunca passa por este cache.

const CACHE = "gbsfinances-20261109120235";
const FILES = [
    "./",
    "./index.html",
    "./gbsfinances.js",
    "./gbsfinances_bg.wasm",
    "./manifest.webmanifest",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png",
    "./icons/apple-touch-icon.png",
    "./icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith("gbsfinances-") && k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    const url = new URL(req.url);
    // SÃ³ os arquivos do prÃ³prio app; a nuvem vai direto para a rede.
    if (req.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }
    event.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const key = req.mode === "navigate" ? "./index.html" : req;
            const cached = await cache.match(key, { ignoreSearch: true });
            if (cached) {
                return cached;
            }
            try {
                const resp = await fetch(req);
                if (resp && resp.ok) {
                    cache.put(req, resp.clone());
                }
                return resp;
            } catch (e) {
                return cached || Response.error();
            }
        })
    );
});
