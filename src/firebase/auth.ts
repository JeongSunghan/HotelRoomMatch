/**
 * Firebase Admin 인증 모듈
 */
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './config';

export async function adminSignIn(email: string, password: string): Promise<User> {
    if (!auth) throw new Error('Firebase가 초기화되지 않았습니다.');

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function adminSignOut(): Promise<void> {
    if (!auth) return;
    await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
    if (!auth) {
        callback(null);
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
}

