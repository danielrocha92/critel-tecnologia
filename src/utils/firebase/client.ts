import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.trim().length > 0);

// Padrão Singleton para evitar reinicialização múltipla no ambiente Serverless/Next.js.
// Se as variáveis do Firebase não estiverem configuradas no ambiente, o app não tenta
// inicializar a SDK e evita quebrar o build em ambientes de desenvolvimento sem credenciais.
const app = hasFirebaseConfig ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;

export const isFirebaseConfigured = hasFirebaseConfig;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
