import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqCRvQJ69Lrg-oQ_ZILPSh62vPsF0sD1s",
  authDomain: "scholar-gat.firebaseapp.com",
  projectId: "scholar-gat",
  storageBucket: "scholar-gat.firebasestorage.app",
  messagingSenderId: "217295585236",
  appId: "1:217295585236:web:ccd5e09a49028202052041",
  measurementId: "G-GH3FZ9H76F"
};

let app;
let auth;
let googleProvider;
let db;
let analytics = null;
let isFirebaseEnabled = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getFirestore(app);
  isFirebaseEnabled = true;
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { 
  auth, 
  googleProvider, 
  db,
  analytics,
  isFirebaseEnabled, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot
};
