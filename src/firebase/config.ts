// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCH3NSH_EB-AX9hunvkdqrj0vS34IbDKpQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vrisham-cad24.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vrisham-cad24",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vrisham-cad24.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "404878904416",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:404878904416:web:e48d6d054a35ecb5de8705",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HG1367QCEK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Set authentication persistence to local storage
setPersistence(auth, browserLocalPersistence).then(() => {
  console.log('🔐 Firebase Auth persistence set to LOCAL');
}).catch((error) => {
  console.error('❌ Failed to set Firebase Auth persistence:', error);
});

export { app, analytics, db, storage, auth };


