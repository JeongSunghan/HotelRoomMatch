/**
 * Firebase 기본 설정 및 초기화
 * Realtime Database와 Firestore 병행 사용 (마이그레이션 기간)
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database, ref, onValue, set, update, get, runTransaction, push, query, orderByChild, limitToLast, remove } from 'firebase/database';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

const firebaseConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

let app: FirebaseApp | null = null;
let database: Database | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

try {
    if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
        app = initializeApp(firebaseConfig);
        database = getDatabase(app);
        firestore = getFirestore(app);
        auth = getAuth(app);
    }
} catch (error) {
    // Firebase 초기화 실패 - 로컬 모드로 동작
    console.error('Firebase 초기화 실패:', error);
}

export function isFirebaseInitialized(): boolean {
    return database !== null;
}

export function isFirestoreInitialized(): boolean {
    return firestore !== null;
}

// Realtime Database exports (기존 호환성 유지)
export { app, database, auth, ref, onValue, set, update, get, runTransaction, push, query, orderByChild, limitToLast, remove };

// Firestore exports (신규)
export { firestore };

