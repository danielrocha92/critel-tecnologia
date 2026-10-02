import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Padrão Singleton para evitar reinicialização múltipla no ambiente Serverless/Next.js
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 20) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  } else {
    throw new Error('Chave da API ausente ou no formato de placeholder');
  }
} catch (error) {
  console.warn('⚠️ Firebase desabilitado (Credenciais ausentes ou inválidas). Funcionalidades dependentes do Firebase não funcionarão.', error);
  // Exporta mocks vazios para evitar quebra em tempo de importação de módulos
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
  auth = {} as Auth;
}

export { app, db, storage, auth };
