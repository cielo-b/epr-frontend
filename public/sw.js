// Service Worker for Push Notifications
self.addEventListener('push', function (event) {
    console.log('Push notification received:', event);

    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        console.error('Error parsing push data:', e);
        data = {
            title: 'New Notification',
            body: event.data.text(),
        };
    }

    const options = {
        body: data.body,
        icon: data.icon || '/logo.png',
        badge: data.badge || '/logo.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        tag: data.tag || 'notification',
        requireInteraction: false,
        timestamp: data.timestamp || Date.now(),
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification clicked:', event);
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If a window is already open, focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

self.addEventListener('notificationclose', function (event) {
    console.log('Notification closed:', event);
});
