/**
 * Firestore 방 배정 로직
 * userStays 업데이트 및 배정 완료 처리
 */

import { Timestamp } from 'firebase/firestore';
import {
    getUserStayByUserId,
    updateUserStay,
    getUserStaysByRoomId
} from './userStays';
import { getUserById } from './users';
import { debug, logError } from '../../utils/debug';
import type { FirestoreUserStay } from '../../types/firestore';

// ==================== 방 배정 함수 ====================

/**
 * 방 배정 완료
 * userStay 업데이트 (roomId, roomType, status, assignedAt, snoring)
 * 
 * @param userId - 사용자 ID (이메일)
 * @param roomId - 방 번호
 * @param roomType - 방 타입 (SINGLE | SHARED)
 * @param snoring - 코골이 여부
 * @returns 배정 성공 여부
 */
export async function assignRoom(
    userId: string,
    roomId: string,
    roomType: 'SINGLE' | 'SHARED',
    snoring: boolean
): Promise<{
    success: boolean;
    message: string;
    stay?: FirestoreUserStay;
}> {
    try {
        debug.log('assignRoom: Assigning room', { userId, roomId, roomType, snoring });

        // 1. 사용자 존재 확인
        const user = await getUserById(userId);
        if (!user) {
            return {
                success: false,
                message: '사용자를 찾을 수 없습니다.',
            };
        }

        // 2. 1인실 권한 체크
        if (roomType === 'SINGLE' && !user.singleAllowed) {
            return {
                success: false,
                message: '1인실 선택 권한이 없습니다.',
            };
        }

        // 3. userStay 조회
        const staysCol = await import('firebase/firestore').then(m => m.collection);
        const q = await import('firebase/firestore').then(m => m.query);
        const where = await import('firebase/firestore').then(m => m.where);
        const getDocs = await import('firebase/firestore').then(m => m.getDocs);
        const { firestore } = await import('../config');

        if (!firestore) {
            throw new Error('Firestore가 초기화되지 않았습니다.');
        }

        const userStaysCol = staysCol(firestore, 'userStays');
        const stayQuery = q(userStaysCol, where('userId', '==', userId));
        const snapshot = await getDocs(stayQuery);

        if (snapshot.empty) {
            return {
                success: false,
                message: 'userStay를 찾을 수 없습니다.',
            };
        }

        const stayDoc = snapshot.docs[0];
        const stayId = stayDoc.id;
        const currentStay = stayDoc.data() as FirestoreUserStay;

        // 4. 이미 배정된 경우 체크
        if (currentStay.status === 'ASSIGNED' && currentStay.roomId) {
            return {
                success: false,
                message: `이미 ${currentStay.roomId}호에 배정되어 있습니다.`,
            };
        }

        // 5. 방 배정 업데이트
        await updateUserStay(stayId, {
            roomId,
            roomType,
            snoring,
            status: 'ASSIGNED',
            assignedAt: Timestamp.now(),
        });

        debug.info({
            action: 'assignRoom',
            data: { userId, roomId, roomType, snoring, stayId },
        });

        // 6. 업데이트된 stay 조회
        const updatedStay = await getUserStayByUserId(userId);

        return {
            success: true,
            message: '방 배정이 완료되었습니다.',
            stay: updatedStay || undefined,
        };
    } catch (error) {
        logError(error, { action: 'assignRoom', data: { userId, roomId, roomType } });
        return {
            success: false,
            message: '방 배정 중 오류가 발생했습니다.',
        };
    }
}

/**
 * 방 배정 취소
 * userStay를 UNASSIGNED 상태로 변경
 * 
 * @param userId - 사용자 ID (이메일)
 * @returns 취소 성공 여부
 */
export async function unassignRoom(userId: string): Promise<{
    success: boolean;
    message: string;
}> {
    try {
        debug.log('unassignRoom: Unassigning room', { userId });

        // userStay 조회
        const staysCol = await import('firebase/firestore').then(m => m.collection);
        const q = await import('firebase/firestore').then(m => m.query);
        const where = await import('firebase/firestore').then(m => m.where);
        const getDocs = await import('firebase/firestore').then(m => m.getDocs);
        const { firestore } = await import('../config');

        if (!firestore) {
            throw new Error('Firestore가 초기화되지 않았습니다.');
        }

        const userStaysCol = staysCol(firestore, 'userStays');
        const stayQuery = q(userStaysCol, where('userId', '==', userId));
        const snapshot = await getDocs(stayQuery);

        if (snapshot.empty) {
            return {
                success: false,
                message: 'userStay를 찾을 수 없습니다.',
            };
        }

        const stayDoc = snapshot.docs[0];
        const stayId = stayDoc.id;

        // 배정 취소
        await updateUserStay(stayId, {
            roomId: null,
            roomType: null,
            status: 'UNASSIGNED',
            assignedAt: null,
        });

        debug.info({
            action: 'unassignRoom',
            data: { userId, stayId },
        });

        return {
            success: true,
            message: '방 배정이 취소되었습니다.',
        };
    } catch (error) {
        logError(error, { action: 'unassignRoom', data: { userId } });
        return {
            success: false,
            message: '방 배정 취소 중 오류가 발생했습니다.',
        };
    }
}

/**
 * 방 변경 (기존 배정 취소 + 새로운 방 배정)
 * 
 * @param userId - 사용자 ID (이메일)
 * @param newRoomId - 새로운 방 번호
 * @param newRoomType - 새로운 방 타입
 * @param snoring - 코골이 여부
 * @returns 변경 성공 여부
 */
export async function changeRoom(
    userId: string,
    newRoomId: string,
    newRoomType: 'SINGLE' | 'SHARED',
    snoring: boolean
): Promise<{
    success: boolean;
    message: string;
    stay?: FirestoreUserStay;
}> {
    try {
        debug.log('changeRoom: Changing room', { userId, newRoomId, newRoomType });

        // 기존 배정 취소
        const unassignResult = await unassignRoom(userId);
        if (!unassignResult.success) {
            return unassignResult;
        }

        // 새로운 방 배정
        const assignResult = await assignRoom(userId, newRoomId, newRoomType, snoring);
        return assignResult;
    } catch (error) {
        logError(error, { action: 'changeRoom', data: { userId, newRoomId, newRoomType } });
        return {
            success: false,
            message: '방 변경 중 오류가 발생했습니다.',
        };
    }
}

/**
 * 방 배정 통계 조회
 * 
 * @param roomId - 방 번호
 * @returns 방 배정 통계
 */
export async function getRoomAssignmentStats(roomId: string): Promise<{
    total: number;
    users: Array<{
        userId: string;
        snoring: boolean;
        assignedAt: Timestamp | null;
    }>;
}> {
    try {
        const stays = await getUserStaysByRoomId(roomId);
        
        return {
            total: stays.length,
            users: stays.map(stay => ({
                userId: stay.userId,
                snoring: stay.snoring,
                assignedAt: stay.assignedAt,
            })),
        };
    } catch (error) {
        logError(error, { action: 'getRoomAssignmentStats', data: { roomId } });
        return {
            total: 0,
            users: [],
        };
    }
}

/**
 * 방 배정 가능 여부 체크
 * - 사용자가 이미 배정되어 있는지
 * - 1인실 권한이 있는지
 * - 방 정원이 초과되지 않는지
 * 
 * @param userId - 사용자 ID (이메일)
 * @param roomId - 방 번호
 * @param roomType - 방 타입
 * @param roomCapacity - 방 정원
 * @returns 배정 가능 여부 및 메시지
 */
export async function canAssignRoom(
    userId: string,
    roomId: string,
    roomType: 'SINGLE' | 'SHARED',
    roomCapacity: number
): Promise<{
    canAssign: boolean;
    message: string;
}> {
    try {
        // 1. 사용자 확인
        const user = await getUserById(userId);
        if (!user) {
            return {
                canAssign: false,
                message: '사용자를 찾을 수 없습니다.',
            };
        }

        // 2. 1인실 권한 체크
        if (roomType === 'SINGLE' && !user.singleAllowed) {
            return {
                canAssign: false,
                message: '1인실 선택 권한이 없습니다.',
            };
        }

        // 3. 이미 배정된 경우 체크
        const currentStay = await getUserStayByUserId(userId);
        if (currentStay && currentStay.status === 'ASSIGNED' && currentStay.roomId) {
            return {
                canAssign: false,
                message: `이미 ${currentStay.roomId}호에 배정되어 있습니다.`,
            };
        }

        // 4. 방 정원 체크
        const stats = await getRoomAssignmentStats(roomId);
        if (stats.total >= roomCapacity) {
            return {
                canAssign: false,
                message: '방 정원이 초과되었습니다.',
            };
        }

        return {
            canAssign: true,
            message: '배정 가능합니다.',
        };
    } catch (error) {
        logError(error, { action: 'canAssignRoom', data: { userId, roomId, roomType } });
        return {
            canAssign: false,
            message: '배정 가능 여부 확인 중 오류가 발생했습니다.',
        };
    }
}

