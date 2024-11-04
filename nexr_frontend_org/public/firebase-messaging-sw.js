// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAm9qiB-UCaoTZRyi3KYrkDM1O53iBoyfg",
    authDomain: "baseapp-push-notification.firebaseapp.com",
    projectId: "baseapp-push-notification",
    storageBucket: "baseapp-push-notification.firebasestorage.app",
    messagingSenderId: "249140294297",
    appId: "1:249140294297:web:fcfd26472e877485ef7e08",
    measurementId: "G-GNPM5KXE2M"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgrondMessage(function (payload) {
    console.log("Teset Verified push notification", payload)
});