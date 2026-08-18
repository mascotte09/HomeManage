self.addEventListener("push", (event) => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = {
            title: "Quản Trọ",
            body: event.data?.text() || "Bạn có thông báo mới.",
        };
    }

    event.waitUntil(
        self.registration.showNotification(
            data.title || "Quản Trọ",
            {
                body: data.body || "",
                icon: "/logo192.png",
                badge: "/logo192.png",
                data: data.url || "/",
            }
        )
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(
            event.notification.data || "/"
        )
    );
});