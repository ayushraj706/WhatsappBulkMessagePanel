// 1. App background logic
self.addEventListener('fetch', (event) => {
    // Empty but required for PWA installation
});

// 2. Heads-up Notification Logic (Top-down Pop-up)
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'Naya message aaya hai!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    
    // ASALI WHATSAPP FEEL: 
    // Is vibrate pattern se phone zor se vibrate hoga aur upar se banner girega
    vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
    
    tag: 'basekey-msg', 
    renotify: true,
    requireInteraction: true, // Jab tak aap swipe nahi karoge, upar hi rahega
    
    // ACTION BUTTONS (Exactly like your screenshot)
    actions: [
      { 
        action: 'reply', 
        type: 'text', 
        title: 'Reply', 
        placeholder: 'Yahan likhiye...' 
      },
      { 
        action: 'mark-read', 
        title: 'Mark as read' 
      }
    ],
    data: {
      url: data.url || '/chat',
      senderId: data.senderId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BaseKey Messenger', options)
  );
});

// 3. Notification Actions (Reply aur Mark as Read handle karna)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // A. AGAR USER REPLY KARTA HAI
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
  } 
  // B. AGAR USER MARK AS READ DABATA HAI (Abhi ke liye sirf band hoga)
  else if (event.action === 'mark-read') {
      console.log("Message marked as read");
  }
  // C. AGAR USER DIRECT CLICK KARTA HAI
  else {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.includes('/chat') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});
