/**
 * Firestore userStays 컬렉션 관리
 * 사용자의 숙박 및 방 배정 정보 관리
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config';
import {
  FirestoreUserStay,
  FirestoreUserStayCreateData,
  FirestoreUserStayUpdateData,
  nowTimestamp,
  isFirestoreUserStay,
} from '../../types/firestore';
import { debug, logError } from '../../utils/debug';
import { getUserById } from './users';

// ==================== 컬렉션 참조 ====================

const USER_STAYS_COLLECTION = 'userStays';

/**
 * userStays 컬렉션 참조 가져오기
 */
function getUserStaysCollection() {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }
  return collection(firestore, USER_STAYS_COLLECTION);
}

// ==================== CRUD 함수 ====================

/**
 * userStay 생성
 * @param data - userStay 생성 데이터
 * @returns 생성된 userStay ID
 */
export async function createUserStay(
  data: FirestoreUserStayCreateData
): Promise<string> {
  try {
    debug.log('createUserStay: Creating userStay', { userId: data.userId });

    // userId 유효성 검증 (users 컬렉션에 존재하는지 확인)
    const user = await getUserById(data.userId);
    if (!user) {
      throw new Error(`유효하지 않은 userId입니다: ${data.userId}`);
    }

    // 이미 userStay가 존재하는지 확인
    const existingStay = await getUserStayByUserId(data.userId);
    if (existingStay) {
      throw new Error(`이미 userStay가 존재합니다: userId ${data.userId}`);
    }

    const userStaysCol = getUserStaysCollection();

    const stayData: Omit<FirestoreUserStay, 'assignedAt'> = {
      ...data,
      createdAt: nowTimestamp(),
    };

    const docRef = await addDoc(userStaysCol, stayData);

    debug.info({
      action: 'createUserStay',
      data: { stayId: docRef.id, userId: data.userId },
    });
    return docRef.id;
  } catch (error) {
    logError(error, { action: 'createUserStay', data: { userId: data.userId } });
    throw error;
  }
}

/**
 * userId로 userStay 조회
 * @param userId - 사용자 ID
 * @returns userStay 데이터 (없으면 null)
 */
export async function getUserStayByUserId(
  userId: string
): Promise<(FirestoreUserStay & { id: string }) | null> {
  try {
    debug.log('getUserStayByUserId: Fetching userStay by userId', { userId });

    const userStaysCol = getUserStaysCollection();
    const q = query(userStaysCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      debug.log('getUserStayByUserId: UserStay not found', { userId });
      return null;
    }

    const stayDoc = snapshot.docs[0];
    const stayData = stayDoc.data();

    if (!isFirestoreUserStay(stayData)) {
      logError(new Error('Invalid userStay data'), { action: 'getUserStayByUserId', data: { userId } });
      return null;
    }

    return {
      id: stayDoc.id,
      ...stayData,
    };
  } catch (error) {
    logError(error, { action: 'getUserStayByUserId', data: { userId } });
    throw error;
  }
}

/**
 * ID로 userStay 조회
 * @param stayId - userStay ID
 * @returns userStay 데이터 (없으면 null)
 */
export async function getUserStayById(
  stayId: string
): Promise<(FirestoreUserStay & { id: string }) | null> {
  try {
    debug.log('getUserStayById: Fetching userStay by ID', { stayId });

    const userStaysCol = getUserStaysCollection();
    const stayDoc = doc(userStaysCol, stayId);
    const snapshot = await getDoc(stayDoc);

    if (!snapshot.exists()) {
      debug.log('getUserStayById: UserStay not found', { stayId });
      return null;
    }

    const stayData = snapshot.data();

    if (!isFirestoreUserStay(stayData)) {
      logError(new Error('Invalid userStay data'), { action: 'getUserStayById', data: { stayId } });
      return null;
    }

    return {
      id: snapshot.id,
      ...stayData,
    };
  } catch (error) {
    logError(error, { action: 'getUserStayById', data: { stayId } });
    throw error;
  }
}

/**
 * userStay 업데이트
 * @param stayId - userStay ID
 * @param data - 업데이트할 데이터
 */
export async function updateUserStay(
  stayId: string,
  data: FirestoreUserStayUpdateData
): Promise<void> {
  try {
    debug.log('updateUserStay: Updating userStay', { stayId, data });

    const userStaysCol = getUserStaysCollection();
    const stayDoc = doc(userStaysCol, stayId);

    // 배정 상태 변경 시 assignedAt 자동 설정
    if (data.status === 'ASSIGNED' && !data.assignedAt) {
      data.assignedAt = nowTimestamp();
    }

    await updateDoc(stayDoc, data);

    debug.info({ action: 'updateUserStay', data: { stayId } });
  } catch (error) {
    logError(error, { action: 'updateUserStay', data: { stayId } });
    throw error;
  }
}

/**
 * userStay 삭제 (관리자 전용)
 * @param stayId - userStay ID
 */
export async function deleteUserStay(stayId: string): Promise<void> {
  try {
    debug.log('deleteUserStay: Deleting userStay', { stayId });

    const userStaysCol = getUserStaysCollection();
    const stayDoc = doc(userStaysCol, stayId);

    await deleteDoc(stayDoc);

    debug.info({ action: 'deleteUserStay', data: { stayId } });
  } catch (error) {
    logError(error, { action: 'deleteUserStay', data: { stayId } });
    throw error;
  }
}

/**
 * 전체 userStay 조회 (관리자용)
 * @returns 전체 userStay 배열
 */
export async function getAllUserStays(): Promise<
  (FirestoreUserStay & { id: string })[]
> {
  try {
    debug.log('getAllUserStays: Fetching all userStays');

    const userStaysCol = getUserStaysCollection();
    const snapshot = await getDocs(userStaysCol);

    const stays = snapshot.docs
      .map((docSnap) => {
        const stayData = docSnap.data();
        if (isFirestoreUserStay(stayData)) {
          return {
            id: docSnap.id,
            ...stayData,
          };
        }
        return null;
      })
      .filter(
        (stay): stay is FirestoreUserStay & { id: string } => stay !== null
      );

    debug.info({ action: 'getAllUserStays', data: { count: stays.length } });
    return stays;
  } catch (error) {
    logError(error, { action: 'getAllUserStays' });
    throw error;
  }
}

/**
 * 상태별 userStay 조회
 * @param status - 배정 상태 (UNASSIGNED | ASSIGNED)
 * @returns 해당 상태의 userStay 배열
 */
export async function getUserStaysByStatus(
  status: 'UNASSIGNED' | 'ASSIGNED'
): Promise<(FirestoreUserStay & { id: string })[]> {
  try {
    debug.log('getUserStaysByStatus: Fetching userStays by status', { status });

    const userStaysCol = getUserStaysCollection();
    const q = query(userStaysCol, where('status', '==', status));
    const snapshot = await getDocs(q);

    const stays = snapshot.docs
      .map((docSnap) => {
        const stayData = docSnap.data();
        if (isFirestoreUserStay(stayData)) {
          return {
            id: docSnap.id,
            ...stayData,
          };
        }
        return null;
      })
      .filter(
        (stay): stay is FirestoreUserStay & { id: string } => stay !== null
      );

    debug.info({
      action: 'getUserStaysByStatus',
      data: { status, count: stays.length },
    });
    return stays;
  } catch (error) {
    logError(error, { action: 'getUserStaysByStatus', data: { status } });
    throw error;
  }
}

/**
 * 특정 userId의 userStay 실시간 구독
 * @param userId - 사용자 ID
 * @param callback - 데이터 변경 시 호출될 콜백
 * @returns 구독 해제 함수
 */
export function subscribeToUserStay(
  userId: string,
  callback: (stay: (FirestoreUserStay & { id: string }) | null) => void
): Unsubscribe {
  try {
    debug.log('subscribeToUserStay: Subscribing to userStay', { userId });

    const userStaysCol = getUserStaysCollection();
    const q = query(userStaysCol, where('userId', '==', userId));

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(null);
          return;
        }

        const stayDoc = snapshot.docs[0];
        const stayData = stayDoc.data();

        if (isFirestoreUserStay(stayData)) {
          callback({
            id: stayDoc.id,
            ...stayData,
          });
        } else {
          logError(new Error('Invalid userStay data'), { action: 'subscribeToUserStay', data: { userId } });
          callback(null);
        }
      },
      (error) => {
        logError(error, { action: 'subscribeToUserStay', data: { userId } });
      }
    );
  } catch (error) {
    logError(error, { action: 'subscribeToUserStay', data: { userId } });
    throw error;
  }
}

/**
 * 전체 userStay 실시간 구독 (관리자용)
 * @param callback - 데이터 변경 시 호출될 콜백
 * @returns 구독 해제 함수
 */
export function subscribeToAllUserStays(
  callback: (stays: (FirestoreUserStay & { id: string })[]) => void
): Unsubscribe {
  try {
    debug.log('subscribeToAllUserStays: Subscribing to all userStays');

    const userStaysCol = getUserStaysCollection();

    return onSnapshot(
      userStaysCol,
      (snapshot) => {
        const stays = snapshot.docs
          .map((docSnap) => {
            const stayData = docSnap.data();
            if (isFirestoreUserStay(stayData)) {
              return {
                id: docSnap.id,
                ...stayData,
              };
            }
            return null;
          })
          .filter(
            (stay): stay is FirestoreUserStay & { id: string } => stay !== null
          );

        callback(stays);
      },
      (error) => {
        logError(error, { action: 'subscribeToAllUserStays' });
      }
    );
  } catch (error) {
    logError(error, { action: 'subscribeToAllUserStays' });
    throw error;
  }
}

// ==================== 로그인 및 인증 관련 함수 ====================

/**
 * userStay 가져오기 또는 생성
 * 로그인 시 사용: userStay가 없으면 기본 상태로 생성
 * 
 * @param userId - 사용자 ID
 * @param initialData - 초기 데이터 (선택사항)
 * @returns userStay 데이터 및 신규 생성 여부
 */
export async function getOrCreateUserStay(
  userId: string,
  initialData?: {
    birthDate?: string;
    age?: number;
  }
): Promise<{
  stay: FirestoreUserStay;
  isNew: boolean;
  stayId: string;
}> {
  try {
    debug.log('getOrCreateUserStay: Checking userStay', { userId });

    // 기존 userStay 조회
    const existingStay = await getUserStayByUserId(userId);
    
    if (existingStay) {
      // 기존 stay의 document ID를 찾기
      const staysCol = getUserStaysCollection();
      const q = query(staysCol, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const stayId = snapshot.docs[0]?.id || '';

      debug.info({
        action: 'getOrCreateUserStay',
        data: { userId, found: true, stayId },
      });

      return {
        stay: existingStay,
        isNew: false,
        stayId,
      };
    }

    // 새로운 userStay 생성
    debug.log('getOrCreateUserStay: Creating new userStay', { userId });

    const newStayData: FirestoreUserStayCreateData = {
      userId,
      birthDate: initialData?.birthDate || '', // 빈 문자열로 시작 (나중에 입력)
      age: initialData?.age || 0,
      snoring: false,
      roomType: null,
      roomId: null,
      status: 'UNASSIGNED',
    };

    const stayId = await createUserStay(newStayData);
    const createdStay = await getUserStayById(stayId);

    if (!createdStay) {
      throw new Error('userStay 생성 후 조회 실패');
    }

    debug.info({
      action: 'getOrCreateUserStay',
      data: { userId, created: true, stayId },
    });

    return {
      stay: createdStay,
      isNew: true,
      stayId,
    };
  } catch (error) {
    logError(error, { action: 'getOrCreateUserStay', data: { userId } });
    throw error;
  }
}

/**
 * userStay에 생년월일 업데이트
 * 
 * @param userId - 사용자 ID
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @param age - 나이
 * @returns 업데이트 성공 여부
 */
export async function updateUserStayBirthDate(
  userId: string,
  birthDate: string,
  age: number
): Promise<boolean> {
  try {
    debug.log('updateUserStayBirthDate: Updating birthDate', { userId, birthDate, age });

    // userStay 조회
    const staysCol = getUserStaysCollection();
    const q = query(staysCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error(`userStay를 찾을 수 없습니다: userId ${userId}`);
    }

    const stayDoc = snapshot.docs[0];
    const stayId = stayDoc.id;

    // 업데이트
    await updateUserStay(stayId, { birthDate, age });

    debug.info({
      action: 'updateUserStayBirthDate',
      data: { userId, stayId, birthDate, age },
    });

    return true;
  } catch (error) {
    logError(error, { action: 'updateUserStayBirthDate', data: { userId, birthDate } });
    throw error;
  }
}

// ==================== FK 관계 관리 ====================

/**
 * userId 유효성 검증 (users 컬렉션에 존재하는지 확인)
 * @param userId - 검증할 userId
 * @returns 유효 여부
 */
export async function validateUserId(userId: string): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    return user !== null;
  } catch (error) {
    logError(error, { action: 'validateUserId', data: { userId } });
    return false;
  }
}

/**
 * 참조 무결성 체크 (userStay의 userId가 users에 존재하는지 확인)
 * @param stayId - userStay ID
 * @returns 무결성 여부
 */
export async function checkReferentialIntegrity(stayId: string): Promise<boolean> {
  try {
    const stay = await getUserStayById(stayId);
    if (!stay) {
      return false;
    }

    return await validateUserId(stay.userId);
  } catch (error) {
    logError(error, { action: 'checkReferentialIntegrity', data: { stayId } });
    return false;
  }
}

/**
 * Cascade 삭제: userId에 연결된 userStay 삭제 (선택사항)
 * @param userId - 사용자 ID
 */
export async function cascadeDeleteUserStay(userId: string): Promise<void> {
  try {
    debug.log('cascadeDeleteUserStay: Cascade deleting userStay', { userId });

    const stay = await getUserStayByUserId(userId);
    if (stay) {
      await deleteUserStay(stay.id);
      debug.info({
        action: 'cascadeDeleteUserStay',
        data: { userId, stayId: stay.id },
      });
    }
  } catch (error) {
    logError(error, { action: 'cascadeDeleteUserStay', data: { userId } });
    throw error;
  }
}

// ==================== 유틸리티 함수 ====================

/**
 * roomId로 userStay 조회
 * @param roomId - 방 번호
 * @returns 해당 방에 배정된 userStay 배열
 */
export async function getUserStaysByRoomId(
  roomId: string
): Promise<(FirestoreUserStay & { id: string })[]> {
  try {
    debug.log('getUserStaysByRoomId: Fetching userStays by roomId', { roomId });

    const userStaysCol = getUserStaysCollection();
    const q = query(userStaysCol, where('roomId', '==', roomId));
    const snapshot = await getDocs(q);

    const stays = snapshot.docs
      .map((docSnap) => {
        const stayData = docSnap.data();
        if (isFirestoreUserStay(stayData)) {
          return {
            id: docSnap.id,
            ...stayData,
          };
        }
        return null;
      })
      .filter(
        (stay): stay is FirestoreUserStay & { id: string } => stay !== null
      );

    debug.info({
      action: 'getUserStaysByRoomId',
      data: { roomId, count: stays.length },
    });
    return stays;
  } catch (error) {
    logError(error, { action: 'getUserStaysByRoomId', data: { roomId } });
    throw error;
  }
}

/**
 * 배정 통계 조회
 * @returns 배정 통계 { total, assigned, unassigned }
 */
export async function getUserStayStats(): Promise<{
  total: number;
  assigned: number;
  unassigned: number;
}> {
  try {
    const allStays = await getAllUserStays();
    const assigned = allStays.filter((stay) => stay.status === 'ASSIGNED').length;
    const unassigned = allStays.filter((stay) => stay.status === 'UNASSIGNED').length;

    return {
      total: allStays.length,
      assigned,
      unassigned,
    };
  } catch (error) {
    logError(error, { action: 'getUserStayStats' });
    throw error;
  }
}

