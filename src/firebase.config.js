import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0IQnLjnvkgCbRlCwLHBm9PKbeB_Xp9mM",
  authDomain: "exam-library-7c6df.firebaseapp.com",
  projectId: "exam-library-7c6df",
  storageBucket: "exam-library-7c6df.firebasestorage.app",
  messagingSenderId: "399954649438",
  appId: "1:399954649438:web:991627aebf5c7881ddafcf",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
