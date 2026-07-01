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
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
