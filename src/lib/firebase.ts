
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics"; // Aggiunto import per Analytics

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfh9UUNP8TACXtT_c3V3newFJ37KUXwPQ",
  authDomain: "telepilotapp.firebaseapp.com",
  projectId: "telepilotapp",
  storageBucket: "telepilotapp.firebasestorage.app",
  messagingSenderId: "757191218741",
  appId: "1:757191218741:web:bc520b535f6d54343d437c",
  measurementId: "G-XBKDFXYYHW"
};

// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics | null = null; // Inizializza analytics a null

if (typeof window !== 'undefined') { // Firebase Analytics funziona solo nel browser
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
  } else {
    app = getApp();
    // Prova a ottenere Analytics per l'app esistente, se non già inizializzato
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.warn("Firebase Analytics could not be initialized for the existing app instance.", e);
    }
  }
} else { // Sul server, inizializza solo l'app se non esiste
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
}


const db: Firestore = getFirestore(app);

export { app, db, analytics };
