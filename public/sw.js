// 1. App ko installable aur background mein zinda rakhne ke liye
self.addEventListener('fetch', (event) => {
    // Background requests handle karne ke liye zaroori hai
});

// 2. WhatsApp-Style Push Logic (Lock screen aur Background support)
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'Naya message aaya hai!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png', // Status bar ka chhota logo
    vibrate: [300, 100, 300], // Professional vibration pattern
    
    // WHATSAPP FEEL: Tag aur Renotify se har message par alert aayega
    tag: 'basekey-msg', 
    renotify: true,
    
    // Lock screen par content dikhane ke liye
    requireInteraction: true, 
    
    actions: [
      { 
        action: 'reply', 
        type: 'text', 
        title: 'Reply Karo...', 
        placeholder: 'Yahan likhiye...' 
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

// 3. Notification Click & Quick Reply Logic
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // HANDLE QUICK REPLY
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
  // HANDLE CLICK (Open App or Focus Existing Tab)
  else {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        // Agar pehle se chat khula hai toh wahi le jao
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.includes('/chat') && 'focus' in client) {
            return client.focus();
          }
        }
        // Nahi toh naya window kholo
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});
