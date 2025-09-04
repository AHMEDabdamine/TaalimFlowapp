import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

// Firebase initialization promise
let firebaseInitPromise: Promise<void> | null = null;

const initializeFirebase = async () => {
  if (firebaseInitPromise) return firebaseInitPromise;
  
  firebaseInitPromise = (async () => {
    try {
      const response = await fetch('/api/firebase-config');
      if (!response.ok) {
        throw new Error('Failed to fetch Firebase config');
      }
      
      const firebaseConfig = await response.json();
      
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.warn("Firebase initialization failed, app will work without Firebase features:", error);
    }
  })();
  
  return firebaseInitPromise;
};

// Initialize Firebase on module load
initializeFirebase();

// Helper function to ensure Firebase is initialized before use
export const ensureFirebaseInitialized = async () => {
  await initializeFirebase();
  return { auth, db, storage };
};

export { auth, db, storage };
export default app;
