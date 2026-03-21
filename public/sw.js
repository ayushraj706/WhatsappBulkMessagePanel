// public/sw.js

// 1. App ko installable banane ke liye ye zaroori hai
self.addEventListener('fetch', function(event) {
    // Ye khali bhi rahega toh chalega, par hona zaroori hai
});

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Naya message aaya hai!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'reply', type: 'text', title: 'Reply Karo...', placeholder: 'Likhiye...' }
    ],
    data: { url: data.url || '/chat', senderId: data.senderId }
  };
  event.waitUntil(self.registration.showNotification(data.title || 'BaseKey', options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'reply' && event.reply) {
    const replyText = event.reply;
    const senderId = event.notification.data.senderId;
    event.waitUntil(
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: senderId, message: replyText, type: 'text' })
      })
    );
  } else {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
