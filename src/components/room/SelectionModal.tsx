import { useState, ChangeEvent } from 'react';
import { roomData } from '../../data/roomData';
import { getGenderLabel } from '../../utils/genderUtils';
import { User, RoomStatus, RoomInfo } from '../../types';

interface SelectionModalProps {
    roomNumber: string;
    roomStatus: RoomStatus | null;
    user: User;
    onConfirm: (roomNumber: string, roommateInfo: { hasRoommate: boolean; roommateName?: string; roommateCompany?: string }) => void;
    onCancel: () => void;
}

interface RoommateInfo {
    hasRoommate: boolean;
    roommateName?: string;
    roommateCompany?: string;
}

/**
 * 객실 선택 확인 모달 - 룸메이트 선택 기능 추가
 */
export default function SelectionModal({
    roomNumber,
    roomStatus,
    user,
    onConfirm,
    onCancel
}: SelectionModalProps) {
    const room: RoomInfo | undefined = roomData[roomNumber];
    const [hasRoommate, setHasRoommate] = useState<'yes' | 'no' | null>(null);
    const [roommateName, setRoommateName] = useState<string>('');
    const [roommateCompany, setRoommateCompany] = useState<string>('');

    if (!room) return null;

    const isDoubleRoom = room.capacity === 2;
    const isEmptyDoubleRoom = isDoubleRoom && (roomStatus?.guestCount || 0) === 0;

    // 2인실 빈 방 선택 시 룸메이트 질문 필요
    const needRoommateQuestion = isEmptyDoubleRoom;

    // 확정 가능 여부
    const canConfirm = !needRoommateQuestion ||
        hasRoommate === 'no' ||
        (hasRoommate === 'yes' && roommateName.trim().length >= 2);

    const handleConfirm = (): void => {
        const roommateInfo: RoommateInfo = hasRoommate === 'yes' && roommateName.trim()
            ? {
                hasRoommate: true,
                roommateName: roommateName.trim(),
                roommateCompany: roommateCompany.trim() || undefined
            }
            : { hasRoommate: false };
        
        onConfirm(roomNumber, roommateInfo);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onCancel} />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-5">
                    객실 선택 확인
                </h2>

                {/* 객실 정보 */}
                <div className="bg-gray-50 rounded-lg p-5 mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold gradient-text">{roomNumber}호</span>
                        <span className={`
                            px-3 py-1 rounded-full text-sm font-medium
                            ${room.capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}
                        `}>
                            {room.capacity === 2 ? '2인실' : '1인실'}
                        </span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">층</span>
                            <span className="text-gray-800 font-medium">{room.floor}층</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">객실 타입</span>
                            <span className="text-gray-800 font-medium">{room.roomType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">구역</span>
                            <span className={`font-medium ${room.gender === 'M' ? 'text-blue-600' : 'text-pink-600'}`}>
                                {getGenderLabel(room.gender)} 전용
                            </span>
                        </div>
                    </div>
                </div>

                {/* 사용자 정보 */}
                <div className="info-box mb-5">
                    <p className="text-sm text-gray-500 mb-1">선택자</p>
                    <p className="font-semibold text-gray-800">
                        {user.name}
                        {user.company && <span className="text-gray-500 font-normal ml-1">({user.company})</span>}
                        <span className="ml-2 text-sm text-gray-500">
                            {getGenderLabel(user.gender)}
                            {user.age && `, ${user.age}세`}
                        </span>
                    </p>
                </div>

                {/* 기존 투숙객 정보 (2인실 반배정) */}
                {isDoubleRoom && !isEmptyDoubleRoom && roomStatus?.guests?.[0] && (() => {
                    const existingGuest = roomStatus.guests[0];
                    const ageDiff = user.age && existingGuest.age ? Math.abs(user.age - existingGuest.age) : null;
                    const hasAgeWarning = ageDiff !== null && ageDiff > 5;
                    const snoringLabel: Record<string, string> = {
                        'no': '😴 없음',
                        'sometimes': '😪 가끔',
                        'yes': '😤 자주'
                    };
                    const hasSnoringConflict =
                        (existingGuest.snoring === 'yes' && user.snoring !== 'yes') ||
                        (user.snoring === 'yes' && existingGuest.snoring !== 'yes');

                    return (
                        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="font-medium text-blue-800 mb-3">
                                👤 현재 투숙객 정보
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">이름</span>
                                    <span className="font-medium">{existingGuest.name} {existingGuest.company && `(${existingGuest.company})`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">나이</span>
                                    <span className={`font-medium ${hasAgeWarning ? 'text-amber-600' : ''}`}>
                                        {existingGuest.age ? `${existingGuest.age}세` : '미공개'}
                                        {ageDiff !== null && ` (차이: ${ageDiff}세)`}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">코골이</span>
                                    <span className={`font-medium ${existingGuest.snoring === 'yes' ? 'text-red-600' : ''}`}>
                                        {existingGuest.snoring ? snoringLabel[existingGuest.snoring] : '미공개'}
                                    </span>
                                </div>
                            </div>

                            {/* 호환성 경고 */}
                            {(hasAgeWarning || hasSnoringConflict) && (
                                <div className="mt-3 space-y-2">
                                    {hasAgeWarning && (
                                        <div className="p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800">
                                            ⚠️ 나이 차이가 {ageDiff}세입니다. (권장: 5세 이내)
                                        </div>
                                    )}
                                    {hasSnoringConflict && (
                                        <div className="p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                                            ⚠️ 코골이 호환성에 문제가 있을 수 있습니다.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* 2인실 룸메이트 질문 */}
                {needRoommateQuestion && (
                    <div className="mb-5 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="font-medium text-purple-800 mb-3">
                            👥 룸메이트가 있습니까?
                        </p>

                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setHasRoommate('yes')}
                                className={`
                                    flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                                    ${hasRoommate === 'yes'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'}
                                `}
                            >
                                예
                            </button>
                            <button
                                type="button"
                                onClick={() => setHasRoommate('no')}
                                className={`
                                    flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                                    ${hasRoommate === 'no'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'}
                                `}
                            >
                                아니오
                            </button>
                        </div>

                        {/* 룸메이트 정보 입력 */}
                        {hasRoommate === 'yes' && (
                            <div className="space-y-3 pt-2 border-t border-purple-200">
                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-1">
                                        룸메이트 이름 *
                                    </label>
                                    <input
                                        type="text"
                                        value={roommateName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setRoommateName(e.target.value)}
                                        placeholder="룸메이트 이름"
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-1">
                                        룸메이트 소속
                                    </label>
                                    <input
                                        type="text"
                                        value={roommateCompany}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setRoommateCompany(e.target.value)}
                                        placeholder="회사명 (선택)"
                                        className="input-field"
                                    />
                                </div>
                                <p className="text-xs text-purple-600">
                                    * 룸메이트도 별도로 등록해야 배정이 완료됩니다.
                                </p>
                            </div>
                        )}

                        {/* 아니오 선택 시 안내 */}
                        {hasRoommate === 'no' && (
                            <p className="text-sm text-purple-600 pt-2 border-t border-purple-200">
                                다른 참가자가 합류할 수 있습니다.
                            </p>
                        )}
                    </div>
                )}

                {/* 경고 메시지 */}
                <div className="p-4 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg mb-5">
                    <p className="text-red-700 text-sm font-medium mb-1">⚠️ 최종 확인</p>
                    <p className="text-xs text-red-600">
                        선택 후에는 <strong>변경이 불가능</strong>합니다.
                        <br />정말 이 객실을 선택하시겠습니까?
                    </p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 btn-secondary rounded-lg font-medium"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        선택 확정
                    </button>
                </div>
            </div>
        </div>
    );
}

