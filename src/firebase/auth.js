/**
 * Firebase Admin 인증 모듈
 */
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';

export async function adminSignIn(email, password) {
    if (!auth) throw new Error('Firebase가 초기화되지 않았습니다.');

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function adminSignOut() {
    if (!auth) return;
    await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback) {
    if (!auth) {
        callback(null);
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
}
