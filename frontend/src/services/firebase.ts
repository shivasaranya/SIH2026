/**
 * RAKSHA SETHU — Firebase Service Re-export (SIH26191)
 *
 * Imports initialized auth and db from src/lib/firebase.ts
 * Uses exclusively environment variables from .env
 */

import app, { auth, db } from '../lib/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export { app, auth, db };

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || '',
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || '',
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || '',
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
    appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '',
  };
}

export function saveFirebaseConfig(_cfg: FirebaseConfig): void {
  // Config is managed via .env
}

export function isFirebaseConfigured(): boolean {
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string) || '';
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || '';
  return apiKey.trim().length > 0 && projectId.trim().length > 0;
}

export function getFirebaseApp(): FirebaseApp {
  return app;
}

export function getFirebaseAuth(): Auth {
  return auth;
}

export async function getFirestoreDb(): Promise<Firestore> {
  return db;
}

export function isFirebaseReady(): boolean {
  return isFirebaseConfigured();
}

export default app;
