import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy,
  getDoc,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0883054189",
  appId: "1:805790851857:web:a55cfc81b0a93bc650a2b0",
  apiKey: "AIzaSyBjgOXJdiKUCNUo_5VyJ5hjQ4aTJdbRdfs",
  authDomain: "gen-lang-client-0883054189.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-8ace2559-df7d-4c32-998b-89baf5db60ff",
  storageBucket: "gen-lang-client-0883054189.firebasestorage.app",
  messagingSenderId: "805790851857"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Ensures the user is signed in anonymously if they aren't already signed in,
 * and returns their user ID (uid) as a Promise.
 */
export function ensureAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    // If already signed in, resolve immediately with current uid
    if (auth.currentUser) {
      resolve(auth.currentUser.uid);
      return;
    }

    // Wait for the auth state to initialize
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe(); // Stop listening to further auth state changes
        if (user) {
          resolve(user.uid);
        } else {
          try {
            const userCredential = await signInAnonymously(auth);
            resolve(userCredential.user.uid);
          } catch (error) {
            reject(error);
          }
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

export {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  getDoc,
  getDocs,
  deleteDoc
};
