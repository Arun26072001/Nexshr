import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDkAZ8MPklBfkTZjCihJycDQTv_R9ilJYk",
    authDomain: "nexshr-webnexs.firebaseapp.com",
    projectId: "nexshr-webnexs",
    storageBucket: "nexshr-webnexs.firebasestorage.app",
    messagingSenderId: "577850784263",
    appId: "1:577850784263:web:3f30f14587c537637508a2",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
console.log("Firebase App Initialized:", firebaseApp);

const messaging = getMessaging(firebaseApp);
export { messaging };
