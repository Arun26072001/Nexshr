importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyDkAZ8MPklBfkTZjCihJycDQTv_R9ilJYk",
    authDomain: "nexshr-webnexs.firebaseapp.com",
    projectId: "nexshr-webnexs",
    storageBucket: "nexshr-webnexs.firebasestorage.app",
    messagingSenderId: "577850784263",
    appId: "1:577850784263:web:3f30f14587c537637508a2",
    measurementId: "G-XEMD2PYY77"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("📩 Received background message:", payload);
    const { title, body } = payload.data;
    self.registration.showNotification(title, {
        body,
        icon: "./webnexs_logo.png",  // Update with your app icon
    });
});
