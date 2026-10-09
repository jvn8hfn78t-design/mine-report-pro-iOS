
const CACHE_NAME = "mine-report-ios-v1";
const APP_URL = "/app";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await self.skipWaiting();

      try {
        const response = await fetch(APP_URL, {
          cache: "reload",
        });

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(APP_URL, response);
        }
      } catch (error) {
        console.warn("La aplicación se precargará cuando haya conexión.");
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("mine-report-ios-") &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());

            if (url.pathname === APP_URL) {
              await cache.put(APP_URL, response.clone());
            }
          }

          return response;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached =
            (await cache.match(request)) ||
            (await cache.match(APP_URL));

          if (cached) {
            return cached;
          }

          return new Response(
            "Mine Report todavía no tiene esta página disponible sin conexión. Abre la aplicación con internet y vuelve a intentarlo.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
              },
            }
          );
        }
      })()
    );

    return;
  }

  const isStaticAsset =
    /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(
      url.pathname
    );

  
if (isStaticAsset) {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      } catch {
        return new Response(
          "Recurso no disponible sin conexión.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          }
        );
      }
    })()
  );
}
});
