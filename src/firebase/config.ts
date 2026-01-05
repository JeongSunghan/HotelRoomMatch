/**
 * Firebase 기본 설정 및 초기화
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database, ref, onValue, set, update, get, runTransaction, push, query, orderByChild, limitToLast, remove } from 'firebase/database';
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
let auth: Auth | null = null;

try {
    if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
        app = initializeApp(firebaseConfig);
        database = getDatabase(app);
        auth = getAuth(app);
    }
} catch (error) {
    // Firebase 초기화 실패 - 로컬 모드로 동작
}

export function isFirebaseInitialized(): boolean {
    return database !== null;
}

export { app, database, auth, ref, onValue, set, update, get, runTransaction, push, query, orderByChild, limitToLast, remove };

