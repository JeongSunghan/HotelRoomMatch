import { useState, useReducer } from 'react';
import { getGenderLabel } from '../../utils/genderUtils';
import { updateGuestInfo, checkDuplicateName, logGuestAdd, logGuestEdit } from '../../firebase/index';

// /admin 경로에서만 로깅 허용
const isAdminPath = () => window.location.pathname.includes('/admin');

// ============================================
// useReducer로 모달 상태 통합
// ============================================

const MODAL_ACTIONS = {
    OPEN_ADD: 'OPEN_ADD',
    OPEN_EDIT: 'OPEN_EDIT',
    CLOSE: 'CLOSE',
    UPDATE_FORM: 'UPDATE_FORM',
    SET_SUBMITTING: 'SET_SUBMITTING',
    RESET_FORM: 'RESET_FORM'
};

const initialModalState = {
    isOpen: false,
    mode: null, // 'add' | 'edit'
    room: null,
    guest: null, // edit 모드에서만 사용
    formData: { name: '', company: '', age: '', snoring: 'no' },
    isSubmitting: false
};

function modalReducer(state, action) {
    switch (action.type) {
        case MODAL_ACTIONS.OPEN_ADD:
            return {
                ...initialModalState,
                isOpen: true,
                mode: 'add',
                room: action.room
            };
        case MODAL_ACTIONS.OPEN_EDIT:
            return {
                ...initialModalState,
                isOpen: true,
                mode: 'edit',
                room: action.room,
                guest: action.guest,
                formData: {
                    name: action.guest.name || '',
                    company: action.guest.company || '',
                    age: action.guest.age || '',
                    snoring: action.guest.snoring || 'no'
                }
            };
        case MODAL_ACTIONS.CLOSE:
            return initialModalState;
        case MODAL_ACTIONS.UPDATE_FORM:
            return {
                ...state,
                formData: { ...state.formData, [action.field]: action.value }
            };
        case MODAL_ACTIONS.SET_SUBMITTING:
            return { ...state, isSubmitting: action.value };
        case MODAL_ACTIONS.RESET_FORM:
            return { ...state, formData: { name: '', company: '', age: '', snoring: 'no' } };
        default:
            return state;
    }
}

/**
 * 객실 관리 탭 컴포넌트
 * Refactored: 10개 useState → 1개 useReducer
 */
export default function RoomManagementTab({
    assignedRooms,
    onRemoveGuest,
    onAddGuest
}) {
    // 단일 useReducer로 모든 모달 상태 관리
    const [modal, dispatch] = useReducer(modalReducer, initialModalState);

    // 모달 열기 핸들러
    const handleOpenAddModal = (room) => {
        dispatch({ type: MODAL_ACTIONS.OPEN_ADD, room });
    };

    const handleOpenEditModal = (room, guest) => {
        dispatch({ type: MODAL_ACTIONS.OPEN_EDIT, room, guest });
    };

    const handleCloseModal = () => {
        dispatch({ type: MODAL_ACTIONS.CLOSE });
    };

    const handleFormChange = (field, value) => {
        dispatch({ type: MODAL_ACTIONS.UPDATE_FORM, field, value });
    };

    // 중복 이름 체크 후 등록
    const handleAddGuest = async () => {
        if (!modal.formData.name.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }

        dispatch({ type: MODAL_ACTIONS.SET_SUBMITTING, value: true });
        try {
            // 중복 이름 체크
            const { isDuplicate, roomNumber } = await checkDuplicateName(modal.formData.name.trim());
            if (isDuplicate) {
                const proceed = window.confirm(
                    `⚠️ 동일한 이름이 ${roomNumber}호에 이미 존재합니다.\n\n그래도 등록하시겠습니까?`
                );
                if (!proceed) {
                    dispatch({ type: MODAL_ACTIONS.SET_SUBMITTING, value: false });
                    return;
                }
            }

            const guestData = {
                name: modal.formData.name.trim(),
                company: modal.formData.company.trim(),
                gender: modal.room.gender,
                age: modal.formData.age ? parseInt(modal.formData.age) : null,
                snoring: modal.formData.snoring,
                sessionId: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                registeredAt: Date.now(),
                registeredByAdmin: true
            };

            await onAddGuest(modal.room.roomNumber, guestData);

            // 히스토리 로깅 (관리자 경로에서만)
            if (isAdminPath()) {
                await logGuestAdd(modal.room.roomNumber, guestData, 'admin');
            }

            handleCloseModal();
        } catch (error) {
            alert('등록에 실패했습니다: ' + error.message);
        } finally {
            dispatch({ type: MODAL_ACTIONS.SET_SUBMITTING, value: false });
        }
    };

    // 유저 정보 수정 처리
    const handleEditGuest = async () => {
        if (!modal.formData.name.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }

        dispatch({ type: MODAL_ACTIONS.SET_SUBMITTING, value: true });
        try {
            // 중복 이름 체크 (자기 자신 제외)
            const { isDuplicate, roomNumber } = await checkDuplicateName(
                modal.formData.name.trim(),
                modal.guest.sessionId
            );
            if (isDuplicate) {
                const proceed = window.confirm(
                    `⚠️ 동일한 이름이 ${roomNumber}호에 이미 존재합니다.\n\n그래도 수정하시겠습니까?`
                );
                if (!proceed) {
                    dispatch({ type: MODAL_ACTIONS.SET_SUBMITTING, value: false });
                    return;
                }
            }

            await updateGuestInfo(modal.room.roomNumber, modal.guest.sessionId, {
                name: modal.formData.name.trim(),
                company: modal.formData.company.trim(),
                age: modal.formData.age ? parseInt(modal.formData.age) : null,
                snoring: modal.formData.snoring
            });

            // 히스토리 로깅 (관리자 경로에서만)
            if (isAdminPath()) {
                await logGuestEdit(modal.room.roomNumber, modal.guest, {
                    name: modal.formData.name.trim(),
                    company: modal.formData.company.trim(),
                    snoring: modal.formData.snoring
                });
            }

            handleCloseModal();
        } catch (error) {
            alert('수정에 실패했습니다: ' + error.message);
        } finally {
            dispatch({ type: MODAL_ACTIONS.SET_SUBMITTING, value: false });
        }
    };

    // 폼 제출 핸들러 (모드에 따라 분기)
    const handleSubmit = () => {
        if (modal.mode === 'add') {
            handleAddGuest();
        } else if (modal.mode === 'edit') {
            handleEditGuest();
        }
    };

    const snoringLabels = { 'no': '코골이X', 'yes': '코골이O' };

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
                                                    <span className="font-medium mr-1">{guest.name}</span>
                                                    <span className="text-xs opacity-70">
                                                        {[
                                                            guest.company,
                                                            guest.age ? `${guest.age}세` : null,
                                                            guest.snoring === 'yes' ? '코골이' : null
                                                        ].filter(Boolean).join(', ')}
                                                    </span>
                                                    {guest.registeredByAdmin && (
                                                        <span className="text-xs ml-1 opacity-50">[관리자]</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
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

            {/* 통합 모달 (등록/수정) */}
            {modal.isOpen && modal.room && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            {modal.mode === 'add' ? '🏨 유저 등록' : '✏️ 유저 정보 수정'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            <strong>{modal.room.roomNumber}호</strong> ({modal.room.roomType}) - {getGenderLabel(modal.room.gender)} 전용
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    이름 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={modal.formData.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
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
                                    value={modal.formData.company}
                                    onChange={(e) => handleFormChange('company', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="소속/회사"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        출생연도 (선택)
                                    </label>
                                    <input
                                        type="number"
                                        value={modal.formData.age}
                                        onChange={(e) => handleFormChange('age', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="예: 1990"
                                        min="1900"
                                        max="2010"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        코골이 여부
                                    </label>
                                    <select
                                        value={modal.formData.snoring}
                                        onChange={(e) => handleFormChange('snoring', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="no">없음</option>
                                        <option value="yes">있음</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                disabled={modal.isSubmitting}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={modal.isSubmitting || !modal.formData.name.trim()}
                                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${modal.mode === 'add'
                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                            >
                                {modal.isSubmitting
                                    ? (modal.mode === 'add' ? '등록 중...' : '수정 중...')
                                    : (modal.mode === 'add' ? '등록하기' : '수정하기')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
