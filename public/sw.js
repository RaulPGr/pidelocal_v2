// public/sw.js

self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    const data = event.data ? event.data.json() : {};
    const title = data.title || 'PideLocal';
    const message = data.body || 'Tienes una nueva notificación.';
    const icon = data.icon || '/icon-192x192.png';
    const tag = data.tag || 'simple-push';
    const url = data.url || '/admin/orders';

    const options = {
        body: message,
        icon: icon,
        badge: '/icon-192x192.png',
        tag: tag,
        data: { url: url },
        vibrate: [200, 100, 200, 100, 200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                if (client.url === urlToOpen) {
                    return client.focus();
                } else {
                    client.focus();
                    return client.navigate(urlToOpen);
                }
            }
            return clients.openWindow(urlToOpen);
        })
    );
});
