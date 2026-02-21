self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data ? event.data.text() : 'no data'}"`);

    try {
        if (event.data) {
            const data = event.data.json();

            const title = data.title || "Nouvelle Annonce H5";
            const options = {
                body: data.body || "Vous avez un nouveau message.",
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: '2'
                }
            };

            event.waitUntil(
                self.registration.showNotification(title, options)
            );
        }
    } catch (error) {
        console.error('[Service Worker] Push event error:', error);
        // Fallback notification if parsing fails
        event.waitUntil(
            self.registration.showNotification("Projet H5", { body: "Nouvelle notification reçue !" })
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/feed')
    );
});
