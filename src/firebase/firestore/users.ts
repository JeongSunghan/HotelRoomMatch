/**
 * Firestore users 컬렉션 관리
 * 관리자에 의해 사전 등록된 사용자 정보 관리
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config';
import {
  FirestoreUser,
  FirestoreUserCreateData,
  nowTimestamp,
  isFirestoreUser,
} from '../../types/firestore';
import { debug, logError } from '../../utils/debug';

// ==================== 컬렉션 참조 ====================

const USERS_COLLECTION = 'users';

/**
 * users 컬렉션 참조 가져오기
 */
function getUsersCollection() {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }
  return collection(firestore, USERS_COLLECTION);
}

// ==================== CRUD 함수 ====================

/**
 * 유저 생성 (관리자 전용)
 * @param userId - 사용자 ID (Document ID)
 * @param data - 유저 생성 데이터
 * @returns 생성된 유저 ID
 */
export async function createUser(
  userId: string,
  data: FirestoreUserCreateData
): Promise<string> {
  try {
    debug.log('createUser: Creating user', { userId, email: data.email });

    // 이메일 중복 확인
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      throw new Error(`이메일이 이미 존재합니다: ${data.email}`);
    }

    const usersCol = getUsersCollection();
    const userDoc = doc(usersCol, userId);

    const userData: FirestoreUser = {
      ...data,
      createdAt: nowTimestamp(),
    };

    await setDoc(userDoc, userData);

    debug.info({ action: 'createUser', data: { userId } });
    return userId;
  } catch (error) {
    logError(error, { action: 'createUser', data: { userId } });
    throw error;
  }
}

/**
 * 이메일로 유저 조회
 * @param email - 이메일 주소
 * @returns 유저 데이터 (없으면 null)
 */
export async function getUserByEmail(
  email: string
): Promise<(FirestoreUser & { id: string }) | null> {
  try {
    debug.log('getUserByEmail: Fetching user by email', { email });

    const usersCol = getUsersCollection();
    const q = query(usersCol, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      debug.log('getUserByEmail: User not found', { email });
      return null;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (!isFirestoreUser(userData)) {
      logError(new Error('Invalid user data'), { action: 'getUserByEmail', data: { email } });
      return null;
    }

    return {
      id: userDoc.id,
      ...userData,
    };
  } catch (error) {
    logError(error, { action: 'getUserByEmail', data: { email } });
    throw error;
  }
}

/**
 * ID로 유저 조회
 * @param userId - 사용자 ID
 * @returns 유저 데이터 (없으면 null)
 */
export async function getUserById(
  userId: string
): Promise<(FirestoreUser & { id: string }) | null> {
  try {
    debug.log('getUserById: Fetching user by ID', { userId });

    const usersCol = getUsersCollection();
    const userDoc = doc(usersCol, userId);
    const snapshot = await getDoc(userDoc);

    if (!snapshot.exists()) {
      debug.log('getUserById: User not found', { userId });
      return null;
    }

    const userData = snapshot.data();

    if (!isFirestoreUser(userData)) {
      logError(new Error('Invalid user data'), { action: 'getUserById', data: { userId } });
      return null;
    }

    return {
      id: snapshot.id,
      ...userData,
    };
  } catch (error) {
    logError(error, { action: 'getUserById', data: { userId } });
    throw error;
  }
}

/**
 * 유저 업데이트 (관리자 전용)
 * @param userId - 사용자 ID
 * @param data - 업데이트할 데이터
 */
export async function updateUser(
  userId: string,
  data: Partial<FirestoreUserCreateData>
): Promise<void> {
  try {
    debug.log('updateUser: Updating user', { userId, data });

    // 이메일 변경 시 중복 확인
    if (data.email) {
      const existingUser = await getUserByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error(`이메일이 이미 존재합니다: ${data.email}`);
      }
    }

    const usersCol = getUsersCollection();
    const userDoc = doc(usersCol, userId);

    await updateDoc(userDoc, data);

    debug.info({ action: 'updateUser', data: { userId } });
  } catch (error) {
    logError(error, { action: 'updateUser', data: { userId } });
    throw error;
  }
}

/**
 * 유저 삭제 (관리자 전용)
 * @param userId - 사용자 ID
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    debug.log('deleteUser: Deleting user', { userId });

    const usersCol = getUsersCollection();
    const userDoc = doc(usersCol, userId);

    await deleteDoc(userDoc);

    debug.info({ action: 'deleteUser', data: { userId } });
  } catch (error) {
    logError(error, { action: 'deleteUser', data: { userId } });
    throw error;
  }
}

/**
 * 전체 유저 조회 (관리자용)
 * @returns 전체 유저 배열
 */
export async function getAllUsers(): Promise<(FirestoreUser & { id: string })[]> {
  try {
    debug.log('getAllUsers: Fetching all users');

    const usersCol = getUsersCollection();
    const snapshot = await getDocs(usersCol);

    const users = snapshot.docs
      .map((docSnap) => {
        const userData = docSnap.data();
        if (isFirestoreUser(userData)) {
          return {
            id: docSnap.id,
            ...userData,
          };
        }
        return null;
      })
      .filter((user): user is FirestoreUser & { id: string } => user !== null);

    debug.info({ action: 'getAllUsers', data: { count: users.length } });
    return users;
  } catch (error) {
    logError(error, { action: 'getAllUsers' });
    throw error;
  }
}

/**
 * 특정 유저 실시간 구독
 * @param userId - 사용자 ID
 * @param callback - 데이터 변경 시 호출될 콜백
 * @returns 구독 해제 함수
 */
export function subscribeToUser(
  userId: string,
  callback: (user: (FirestoreUser & { id: string }) | null) => void
): Unsubscribe {
  try {
    debug.log('subscribeToUser: Subscribing to user', { userId });

    const usersCol = getUsersCollection();
    const userDoc = doc(usersCol, userId);

    return onSnapshot(
      userDoc,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(null);
          return;
        }

        const userData = snapshot.data();
        if (isFirestoreUser(userData)) {
          callback({
            id: snapshot.id,
            ...userData,
          });
        } else {
          logError(new Error('Invalid user data'), { action: 'subscribeToUser', data: { userId } });
          callback(null);
        }
      },
      (error) => {
        logError(error, { action: 'subscribeToUser', data: { userId } });
      }
    );
  } catch (error) {
    logError(error, { action: 'subscribeToUser', data: { userId } });
    throw error;
  }
}

/**
 * 전체 유저 실시간 구독 (관리자용)
 * @param callback - 데이터 변경 시 호출될 콜백
 * @returns 구독 해제 함수
 */
export function subscribeToAllUsers(
  callback: (users: (FirestoreUser & { id: string })[]) => void
): Unsubscribe {
  try {
    debug.log('subscribeToAllUsers: Subscribing to all users');

    const usersCol = getUsersCollection();

    return onSnapshot(
      usersCol,
      (snapshot) => {
        const users = snapshot.docs
          .map((docSnap) => {
            const userData = docSnap.data();
            if (isFirestoreUser(userData)) {
              return {
                id: docSnap.id,
                ...userData,
              };
            }
            return null;
          })
          .filter((user): user is FirestoreUser & { id: string } => user !== null);

        callback(users);
      },
      (error) => {
        logError(error, { action: 'subscribeToAllUsers' });
      }
    );
  } catch (error) {
    logError(error, { action: 'subscribeToAllUsers' });
    throw error;
  }
}

// ==================== 유틸리티 함수 ====================

/**
 * 이메일 중복 확인
 * @param email - 확인할 이메일
 * @returns 중복 여부 (true: 중복, false: 사용 가능)
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    return user !== null;
  } catch (error) {
    logError(error, { action: 'checkEmailExists', data: { email } });
    throw error;
  }
}

/**
 * 성별별 유저 수 조회
 * @returns 성별별 유저 수 { M: number, F: number }
 */
export async function getUserCountByGender(): Promise<{ M: number; F: number }> {
  try {
    const users = await getAllUsers();
    const maleCount = users.filter((user) => user.gender === 'M').length;
    const femaleCount = users.filter((user) => user.gender === 'F').length;

    return { M: maleCount, F: femaleCount };
  } catch (error) {
    logError(error, { action: 'getUserCountByGender' });
    throw error;
  }
}

// ==================== 인증 및 검증 함수 ====================

/**
 * 이메일로 사용자 검증 (로그인용)
 * @param email - 이메일 주소
 * @returns 검증 결과
 */
export async function verifyUserByEmail(email: string): Promise<{
  valid: boolean;
  user: FirestoreUser | null;
  message: string;
}> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    debug.log('verifyUserByEmail: Verifying user', { email: normalizedEmail });

    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return {
        valid: false,
        user: null,
        message: '사전 등록된 이메일이 아닙니다. 관리자에게 문의해주세요.',
      };
    }

    debug.info({
      action: 'verifyUserByEmail',
      data: { email: normalizedEmail, found: true },
    });

    return {
      valid: true,
      user,
      message: '인증 성공',
    };
  } catch (error) {
    logError(error, { action: 'verifyUserByEmail', data: { email } });
    return {
      valid: false,
      user: null,
      message: '사용자 확인 중 오류가 발생했습니다.',
    };
  }
}

// ==================== 일괄 처리 함수 ====================

/**
 * 일괄 유저 생성 (배치 처리)
 * Firestore 배치 쓰기 제한: 최대 500개 작업
 * 
 * @param users - 유저 생성 데이터 배열
 * @param options - 옵션
 * @param options.onProgress - 진행률 콜백 (current, total)
 * @param options.skipDuplicates - 중복 이메일 스킵 여부 (true: 스킵, false: 에러)
 * @returns 일괄 등록 결과
 */
export async function bulkCreateUsers(
  users: FirestoreUserCreateData[],
  options?: {
    onProgress?: (current: number, total: number) => void;
    skipDuplicates?: boolean;
  }
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ index: number; email: string; error: string }>;
}> {
  try {
    debug.log('bulkCreateUsers: Starting bulk user creation', { count: users.length });

    const skipDuplicates = options?.skipDuplicates ?? false;
    const onProgress = options?.onProgress;
    
    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ index: number; email: string; error: string }> = [];

    // Firestore 배치 쓰기 제한: 최대 500개
    const BATCH_LIMIT = 500;
    const totalBatches = Math.ceil(users.length / BATCH_LIMIT);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_LIMIT;
      const endIndex = Math.min(startIndex + BATCH_LIMIT, users.length);
      const batchUsers = users.slice(startIndex, endIndex);

      const batch = writeBatch(firestore!);
      let batchOperations = 0;

      // 배치에 작업 추가
      for (let i = 0; i < batchUsers.length; i++) {
        const userData = batchUsers[i];
        const actualIndex = startIndex + i;

        try {
          // 중복 이메일 확인 (스킵 옵션이 활성화된 경우)
          if (skipDuplicates) {
            const existingUser = await getUserByEmail(userData.email);
            if (existingUser) {
              failedCount++;
              errors.push({
                index: actualIndex,
                email: userData.email,
                error: '이메일이 이미 존재합니다 (스킵됨)',
              });
              continue;
            }
          }

          // Document ID는 이메일로 사용
          const userDocRef = doc(getUsersCollection(), userData.email.toLowerCase());
          
          const userDataWithTimestamp: FirestoreUser = {
            ...userData,
            createdAt: nowTimestamp(),
          };

          batch.set(userDocRef, userDataWithTimestamp);
          batchOperations++;
          successCount++;

          // 진행률 콜백 호출
          if (onProgress) {
            onProgress(actualIndex + 1, users.length);
          }
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          errors.push({
            index: actualIndex,
            email: userData.email,
            error: errorMessage,
          });
          logError(error, {
            action: 'bulkCreateUsers',
            data: { index: actualIndex, email: userData.email },
          });
        }
      }

      // 배치 커밋 (작업이 있는 경우만)
      if (batchOperations > 0) {
        try {
          await batch.commit();
          debug.info({
            action: 'bulkCreateUsers',
            data: {
              batch: batchIndex + 1,
              totalBatches,
              operations: batchOperations,
            },
          });
        } catch (error) {
          // 배치 커밋 실패 시 해당 배치의 모든 작업 실패 처리
          logError(error, {
            action: 'bulkCreateUsers',
            data: { batch: batchIndex + 1, operations: batchOperations },
          });
          
          // 배치 실패 시 성공으로 카운트된 작업들을 실패로 변경
          for (let i = 0; i < batchOperations; i++) {
            const actualIndex = startIndex + i;
            const userData = batchUsers[i];
            if (userData) {
              successCount--;
              failedCount++;
              errors.push({
                index: actualIndex,
                email: userData.email,
                error: '배치 등록 실패',
              });
            }
          }
        }
      }
    }

    debug.info({
      action: 'bulkCreateUsers',
      data: { success: successCount, failed: failedCount, total: users.length },
    });

    return {
      success: successCount,
      failed: failedCount,
      errors,
    };
  } catch (error) {
    logError(error, { action: 'bulkCreateUsers', data: { count: users.length } });
    throw error;
  }
}

