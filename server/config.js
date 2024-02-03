import { getApp, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyB0FuzeugfP9hnyiLTl8BGGDSXRC4wOmls",
  authDomain: "storyai-b4fb6.firebaseapp.com",
  projectId: "storyai-b4fb6",
  storageBucket: "storyai-b4fb6.appspot.com",
  messagingSenderId: "314101165018",
  appId: "1:314101165018:web:370c2b473ed965ddd2eee3",
  measurementId: "G-ELF4882LS4",
  storageBucket: "gs://storyai-b4fb6.appspot.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const firebaseApp = getApp();
const storage = getStorage(firebaseApp);
export { db, storage };
