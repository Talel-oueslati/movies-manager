import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAc_t8dMIwNIvI6qvvRl-K2gg2HSgk3vT0",
  authDomain: "movie-manager-6c95f.firebaseapp.com",
  projectId: "movie-manager-6c95f",
  storageBucket: "movie-manager-6c95f.firebasestorage.app",
  messagingSenderId: "892029561001",
  appId: "1:892029561001:web:ecadd93545364648fc21b8",
  measurementId: "G-780PZZ5G2N"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;