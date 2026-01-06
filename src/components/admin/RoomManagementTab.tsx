import { useState, ChangeEvent, MouseEvent } from 'react';
import { getGenderLabel } from '../../utils/genderUtils';
import { updateGuestInfo, checkDuplicateName, logGuestAdd, logGuestEdit } from '../../firebase/index';
import type { Guest, RoomInfo, Gender } from '../../types';

interface AssignedRoom extends RoomInfo {
    roomNumber: string;
    guests: Guest[];
    isFull: boolean;
}

interface RoomManagementTabProps {
    assignedRooms: AssignedRoom[];
    onRemoveGuest: (roomNumber: string, sessionId: string, guestName: string) => void;
    onAddGuest: (roomNumber: string, guestData: Guest) => Promise<void>;
}

interface GuestForm {
    name: string;
    company: string;
    age: string;
}

// /admin 경로에서만 로깅 허용
const isAdminPath = (): boolean => window.location.pathname.includes('/admin');

/**
 * 객실 관리 탭 컴포넌트
 */
export default function RoomManagementTab({
    assignedRooms,
    onRemoveGuest,
    onAddGuest
}: RoomManagementTabProps) {
    // 유저 등록 모달 상태
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [selectedRoom, setSelectedRoom] = useState<AssignedRoom | null>(null);
    const [newGuest, setNewGuest] = useState<GuestForm>({ name: '', company: '', age: '' });
    const [isAdding, setIsAdding] = useState<boolean>(false);

    // 유저 수정 모달 상태
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
    const [editData, setEditData] = useState<GuestForm>({ name: '', company: '', age: '' });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    // 유저 등록 모달 열기
    const handleOpenAddModal = (room: AssignedRoom): void => {
        setSelectedRoom(room);
        setNewGuest({ name: '', company: '', age: '' });
        setShowAddModal(true);
    };

    // 유저 수정 모달 열기
    const handleOpenEditModal = (room: AssignedRoom, guest: Guest): void => {
        setSelectedRoom(room);
        setEditingGuest(guest);
        setEditData({
            name: guest.name || '',
            company: guest.company || '',
            age: guest.age ? guest.age.toString() : ''
        });
        setShowEditModal(true);
    };

    // 중복 이름 체크 후 등록
    const handleAddGuest = async (): Promise<void> => {
        if (!newGuest.name.trim() || !selectedRoom) {
            alert('이름을 입력해주세요.');
            return;
        }

        setIsAdding(true);
        try {
            // 중복 이름 체크
            const { isDuplicate, roomNumber } = await checkDuplicateName(newGuest.name.trim());
            if (isDuplicate) {
                const proceed = window.confirm(
                    `⚠️ 동일한 이름이 ${roomNumber}호에 이미 존재합니다.\n\n그래도 등록하시겠습니까?`
                );
                if (!proceed) {
                    setIsAdding(false);
                    return;
                }
            }

            const guestData: Guest = {
                name: newGuest.name.trim(),
                company: newGuest.company.trim() || undefined,
                gender: selectedRoom.gender,
                age: newGuest.age ? parseInt(newGuest.age, 10) : undefined,
                sessionId: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                registeredAt: Date.now()
            };

            await onAddGuest(selectedRoom.roomNumber, guestData);

            // 히스토리 로깅 (관리자 경로에서만)
            if (isAdminPath()) {
                await logGuestAdd(selectedRoom.roomNumber, guestData, 'admin');
            }

            setShowAddModal(false);
            setSelectedRoom(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert('등록에 실패했습니다: ' + errorMessage);
        } finally {
            setIsAdding(false);
        }
    };

    // 유저 정보 수정 처리
    const handleEditGuest = async (): Promise<void> => {
        if (!editData.name.trim() || !selectedRoom || !editingGuest) {
            alert('이름을 입력해주세요.');
            return;
        }

        setIsEditing(true);
        try {
            // 중복 이름 체크 (자기 자신 제외)
            const { isDuplicate, roomNumber } = await checkDuplicateName(
                editData.name.trim(),
                editingGuest.sessionId
            );
            if (isDuplicate) {
                const proceed = window.confirm(
                    `⚠️ 동일한 이름이 ${roomNumber}호에 이미 존재합니다.\n\n그래도 수정하시겠습니까?`
                );
                if (!proceed) {
                    setIsEditing(false);
                    return;
                }
            }

            await updateGuestInfo(selectedRoom.roomNumber, editingGuest.sessionId, {
                name: editData.name.trim(),
                company: editData.company.trim() || undefined,
                age: editData.age ? parseInt(editData.age, 10) : undefined
            });

            // 히스토리 로깅 (관리자 경로에서만)
            if (isAdminPath()) {
                await logGuestEdit(selectedRoom.roomNumber, editingGuest, {
                    name: editData.name.trim(),
                    company: editData.company.trim() || undefined
                });
            }

            setShowEditModal(false);
            setEditingGuest(null);
            setSelectedRoom(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert('수정에 실패했습니다: ' + errorMessage);
        } finally {
            setIsEditing(false);
        }
    };

    if (assignedRooms.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>검색 결과가 없습니다.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {assignedRooms.map(room => (
                    <div
                        key={room.roomNumber}
                        className={`
                            p-4 rounded-lg border bg-white transition-colors
                            ${room.isFull
                                ? room.gender === 'M'
                                    ? 'border-blue-300'
                                    : 'border-pink-300'
                                : room.guests.length > 0
                                    ? 'border-gray-300'
                                    : 'border-gray-200'
                            }
                        `}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white
                                    ${room.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
                                `}>
                                    {room.roomNumber}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800">{room.floor}층</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500 text-sm">{room.roomType}</span>
                                        <span className={`
                                            text-xs px-2 py-0.5 rounded-full font-medium
                                            ${room.capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {room.capacity === 2 ? '2인실' : '1인실'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {getGenderLabel(room.gender)} 전용 • {room.guests.length}/{room.capacity} 배정
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                {room.guests.length === 0 ? (
                                    <>
                                        <span className="text-gray-400 text-sm italic">빈 방</span>
                                        <button
                                            onClick={() => handleOpenAddModal(room)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                                            title="유저 등록"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            등록
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {room.guests.map((guest, idx) => (
                                            <div
                                                key={idx}
                                                className={`
                                                    flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity
                                                    ${guest.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                                                `}
                                                onClick={() => handleOpenEditModal(room, guest)}
                                                title="클릭하여 수정"
                                            >
                                                <div>
                                                    <span className="font-medium">{guest.name}</span>
                                                    {guest.company && (
                                                        <span className="text-xs ml-1 opacity-70">({guest.company})</span>
                                                    )}
                                                    {(guest as Guest & { registeredByAdmin?: boolean }).registeredByAdmin && (
                                                        <span className="text-xs ml-1 opacity-50">[관리자]</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                                        e.stopPropagation();
                                                        onRemoveGuest(room.roomNumber, guest.sessionId, guest.name);
                                                    }}
                                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                                    title="삭제"
                                                >
                                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                        {room.capacity === 2 && room.guests.length < room.capacity && (
                                            <button
                                                onClick={() => handleOpenAddModal(room)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                title="추가 등록"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                추가
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 유저 등록 모달 */}
            {showAddModal && selectedRoom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            🏨 {selectedRoom.capacity === 1 ? '1인실' : '2인실'} 유저 등록
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            <strong>{selectedRoom.roomNumber}호</strong> ({selectedRoom.roomType}) - {getGenderLabel(selectedRoom.gender)} 전용
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    이름 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newGuest.name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewGuest({ ...newGuest, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="이름 입력"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    소속 (선택)
                                </label>
                                <input
                                    type="text"
                                    value={newGuest.company}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewGuest({ ...newGuest, company: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="소속/회사"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    출생연도 (선택)
                                </label>
                                <input
                                    type="number"
                                    value={newGuest.age}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewGuest({ ...newGuest, age: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="예: 1990"
                                    min="1900"
                                    max="2010"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                disabled={isAdding}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleAddGuest}
                                disabled={isAdding || !newGuest.name.trim()}
                                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAdding ? '등록 중...' : '등록하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 유저 수정 모달 */}
            {showEditModal && selectedRoom && editingGuest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            ✏️ 유저 정보 수정
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            <strong>{selectedRoom.roomNumber}호</strong> ({selectedRoom.roomType}) - {getGenderLabel(selectedRoom.gender)} 전용
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    이름 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="이름 입력"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    소속 (선택)
                                </label>
                                <input
                                    type="text"
                                    value={editData.company}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, company: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="소속/회사"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    출생연도 (선택)
                                </label>
                                <input
                                    type="number"
                                    value={editData.age}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, age: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="예: 1990"
                                    min="1900"
                                    max="2010"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                disabled={isEditing}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleEditGuest}
                                disabled={isEditing || !editData.name.trim()}
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isEditing ? '수정 중...' : '수정하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

