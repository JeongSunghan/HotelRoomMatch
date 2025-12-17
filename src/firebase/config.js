/**
 * Firebase 기본 설정 및 초기화
 */
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, get, runTransaction } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let database = null;
let auth = null;

try {
    if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
        app = initializeApp(firebaseConfig);
        database = getDatabase(app);
        auth = getAuth(app);
    }
} catch (error) {
    // Firebase 초기화 실패 - 로컬 모드로 동작
}

export function isFirebaseInitialized() {
    return database !== null;
}

export { app, database, auth, ref, onValue, set, update, get, runTransaction };
