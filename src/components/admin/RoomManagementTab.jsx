import { useState } from 'react';
import { getGenderLabel } from '../../utils/genderUtils';

/**
 * 객실 관리 탭 컴포넌트
 */
export default function RoomManagementTab({
    assignedRooms,
    onRemoveGuest,
    onAddGuest
}) {
    // 유저 등록 모달 상태
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [newGuest, setNewGuest] = useState({ name: '', company: '', age: '' });
    const [isAdding, setIsAdding] = useState(false);

    // 1인실 유저 등록 모달 열기
    const handleOpenAddModal = (room) => {
        setSelectedRoom(room);
        setNewGuest({ name: '', company: '', age: '' });
        setShowAddModal(true);
    };

    // 유저 등록 처리
    const handleAddGuest = async () => {
        if (!newGuest.name.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }

        setIsAdding(true);
        try {
            const guestData = {
                name: newGuest.name.trim(),
                company: newGuest.company.trim(),
                gender: selectedRoom.gender,
                age: newGuest.age ? parseInt(newGuest.age) : null,
                sessionId: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                registeredAt: Date.now(),
                registeredByAdmin: true
            };

            await onAddGuest(selectedRoom.roomNumber, guestData);
            setShowAddModal(false);
            setSelectedRoom(null);
        } catch (error) {
            alert('등록에 실패했습니다: ' + error.message);
        } finally {
            setIsAdding(false);
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
                                        {/* 1인실 빈 방에 추가 버튼 */}
                                        {room.capacity === 1 && (
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
                                        )}
                                    </>
                                ) : (
                                    room.guests.map((guest, idx) => (
                                        <div
                                            key={idx}
                                            className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-lg
                                                ${guest.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                                            `}
                                        >
                                            <div>
                                                <span className="font-medium">{guest.name}</span>
                                                {guest.company && (
                                                    <span className="text-xs ml-1 opacity-70">({guest.company})</span>
                                                )}
                                                {guest.registeredByAdmin && (
                                                    <span className="text-xs ml-1 opacity-50">[관리자]</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => onRemoveGuest(room.roomNumber, guest.sessionId, guest.name)}
                                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                                title="삭제"
                                            >
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 1인실 유저 등록 모달 */}
            {showAddModal && selectedRoom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            🏨 1인실 유저 등록
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
                                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
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
                                    onChange={(e) => setNewGuest({ ...newGuest, company: e.target.value })}
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
                                    onChange={(e) => setNewGuest({ ...newGuest, age: e.target.value })}
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
        </>
    );
}
