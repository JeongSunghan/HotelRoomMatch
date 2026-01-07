/**
 * Firestore 기반 방 선택 모달
 * 코골이 선택 단순화 (boolean), 1인실 제어 로직 포함
 */

import { useState, ChangeEvent, FormEvent } from 'react';
import type { FirestoreUser } from '../../types/firestore';
import { roomData } from '../../data/roomData';

interface FirestoreRoomSelectionModalProps {
    user: FirestoreUser;
    roomNumber: string;
    currentSnoring: boolean;
    onConfirm: (data: {
        roomNumber: string;
        roomType: 'SINGLE' | 'SHARED';
        snoring: boolean;
    }) => Promise<void>;
    onCancel: () => void;
}

/**
 * Firestore 기반 방 선택 확인 모달
 */
export default function FirestoreRoomSelectionModal({
    user,
    roomNumber,
    currentSnoring,
    onConfirm,
    onCancel
}: FirestoreRoomSelectionModalProps) {
    const [snoring, setSnoring] = useState<boolean>(currentSnoring);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const room = roomData[roomNumber];
    if (!room) return null;

    const isSingleRoom = room.capacity === 1;
    const isSharedRoom = room.capacity === 2;

    // 1인실 선택 가능 여부 체크
    const canSelectSingle = user.singleAllowed;

    // 제출 핸들러
    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');

        // 1인실 권한 체크
        if (isSingleRoom && !canSelectSingle) {
            setError('1인실 선택 권한이 없습니다. 관리자에게 문의해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            await onConfirm({
                roomNumber,
                roomType: isSingleRoom ? 'SINGLE' : 'SHARED',
                snoring
            });
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || '방 선택 중 오류가 발생했습니다.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="absolute inset-0" onClick={onCancel} />
            <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                {/* 헤더 */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        방 선택 확인
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {roomNumber}호 ({room.type} - {isSingleRoom ? '1인실' : '2인실'})
                    </p>
                </div>

                {/* 사용자 정보 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-600">
                                {user.org} · {user.position}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 1인실 권한 경고 */}
                {isSingleRoom && !canSelectSingle && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800 mb-1">
                                    1인실 선택 권한 없음
                                </p>
                                <p className="text-sm text-red-700">
                                    1인실은 관리자가 지정한 사용자만 선택할 수 있습니다.
                                    <br />
                                    2인실을 선택하거나 관리자에게 문의해주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 코골이 선택 폼 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            코골이 여부
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="snoring"
                                    checked={!snoring}
                                    onChange={() => setSnoring(false)}
                                    className="w-5 h-5 text-blue-600"
                                />
                                <div className="flex-1">
                                    <span className="font-medium text-gray-800">😴 없음</span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        코골이가 없거나 거의 없습니다
                                    </p>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="snoring"
                                    checked={snoring}
                                    onChange={() => setSnoring(true)}
                                    className="w-5 h-5 text-blue-600"
                                />
                                <div className="flex-1">
                                    <span className="font-medium text-gray-800">😤 있음</span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        코골이가 있습니다
                                    </p>
                                </div>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            {isSharedRoom 
                                ? '2인실 배정 시 참고자료로 사용됩니다.'
                                : '1인실이므로 참고용입니다.'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (isSingleRoom && !canSelectSingle)}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {isSubmitting ? '처리 중...' : '선택 완료'}
                        </button>
                    </div>
                </form>

                {/* 안내 문구 */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        방 선택 후 변경을 원하시면
                        <br />
                        관리자에게 문의해주세요.
                    </p>
                </div>
            </div>
        </div>
    );
}

