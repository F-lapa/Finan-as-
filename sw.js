const CACHE = "financas-smart-v7";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["./manifest.webmanifest"]).catch(() => {}))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // HTML sempre da rede (não ficar preso em versão antiga)
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    e.respondWith(
      fetch(req).then((res) => res).catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req))
  );
});

// ===== Notificações de lembretes (Finanças Smart) =====
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Finanças Smart", body: "Você tem um lembrete" };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (err) {
    try {
      data.body = event.data.text();
    } catch (e2) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Finanças Smart", {
      body: data.body || "",
      icon: "icon-512.png",
      badge: "icon-512.png",
      tag: data.tag || "fs-reminder",
      renotify: true,
      data: data
    })
  );
});
