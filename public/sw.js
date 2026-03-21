self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-icon.png',
    vibrate: [200, 100, 200],
    // QUICK REPLY LOGIC: Ye 'reply' action hi WhatsApp jaisa box khulega
    actions: [
      {
        action: 'reply',
        type: 'text',
        title: 'Reply Karo...',
        placeholder: 'Yahan likho...'
      }
    ],
    data: {
      url: data.url,
      senderId: data.senderId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click aur Reply handle karne ka logic
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'reply' && event.reply) {
    // Reply bhejnewali API ko call karo
    const replyText = event.reply;
    const senderId = event.notification.data.senderId;

    event.waitUntil(
      fetch('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ to: senderId, message: replyText, type: 'text' })
      })
    );
  } else {
    // Direct chat page kholo
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
