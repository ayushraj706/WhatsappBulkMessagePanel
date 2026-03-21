importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "...", // Firebase Console -> General Settings se milega
  projectId: "success-points",
  messagingSenderId: "51177935348", // Screenshot mein 'Sender ID' hai
  appId: "..." // Firebase Console se milega
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
  });
});

