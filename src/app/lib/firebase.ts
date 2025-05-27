import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyDVaIz3YTe6nAD1xpaHfNYSEg8N4nOXKFk",
  authDomain: "facturation-app-786eb.firebaseapp.com",
  projectId: "facturation-app-786eb",
  storageBucket: "facturation-app-786eb.firebasestorage.app",
  messagingSenderId: "962415382169",
  appId: "1:962415382169:web:bf6ff313b247138c6c7208"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
