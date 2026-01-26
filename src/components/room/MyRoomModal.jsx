import { useState, useReducer, useMemo } from 'react';
import { roomData } from '../../data/roomData';
import { getGenderLabel } from '../../utils/genderUtils';
import { updateUser } from '../../firebase/index';
import { SNORING_LABELS } from '../../utils/constants';
import { useToast } from '../ui/Toast';

// ============================================
// useReducer로 모달 상태 통합
// ============================================

const ACTIONS = {
    SET_TAB: 'SET_TAB',
    OPEN_REQUEST_FORM: 'OPEN_REQUEST_FORM',
    OPEN_REINVITE_FORM: 'OPEN_REINVITE_FORM',
    SET_EDITING: 'SET_EDITING',
    CLOSE_FORM: 'CLOSE_FORM',
    UPDATE_FIELD: 'UPDATE_FIELD',
    SET_SUBMITTING: 'SET_SUBMITTING',
    RESET: 'RESET'
};

function createInitialState(user) {
    return {
        activeTab: 'room', // 'room' | 'profile'
        activeForm: null,  // 'request' | 'reinvite' | null
        isEditing: false,  // 프로필 편집 모드
        isSubmitting: false,
        requestForm: { type: 'change', phone: '', reason: '' },
        reinviteForm: { name: '' },
        editForm: {
            snoring: user?.snoring || 'no',
            company: user?.company || '',
            ageTolerance: user?.ageTolerance || 5
        }
    };
}

function modalReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_TAB:
            return {
                ...state,
                activeTab: action.tab,
                activeForm: null,
                isEditing: false
            };
        case ACTIONS.OPEN_REQUEST_FORM:
            return {
                ...state,
                activeForm: 'request',
                requestForm: { ...state.requestForm, type: action.requestType || 'change' }
            };
        case ACTIONS.OPEN_REINVITE_FORM:
            return { ...state, activeForm: 'reinvite' };
        case ACTIONS.SET_EDITING:
            return { ...state, isEditing: action.value };
        case ACTIONS.CLOSE_FORM:
            return { ...state, activeForm: null, isEditing: false };
        case ACTIONS.UPDATE_FIELD:
            return {
                ...state,
                [action.form]: { ...state[action.form], [action.field]: action.value }
            };
        case ACTIONS.SET_SUBMITTING:
            return { ...state, isSubmitting: action.value };
        case ACTIONS.RESET:
            return createInitialState(action.user);
        default:
            return state;
    }
}

/**
 * 내 객실 정보 모달
 * Refactored: 10개 useState → 1개 useReducer
 */
export default function MyRoomModal({
    user,
    roomGuests,
    onRequestChange,
    onReinvite,
    onClose
}) {
    const toast = useToast();
    const [state, dispatch] = useReducer(modalReducer, user, createInitialState);

    // 방 배정 여부
    const hasRoom = !!user?.selectedRoom;
    const room = hasRoom ? roomData[user.selectedRoom] : null;

    // guests 처리
    const guests = useMemo(() => {
        if (!hasRoom) return [];
        let g = roomGuests[user.selectedRoom] || [];
        if (g && !Array.isArray(g)) g = Object.values(g);
        return g;
    }, [hasRoom, roomGuests, user?.selectedRoom]);

    // 현재 사용자 및 룸메이트
    const currentUser = useMemo(() => {
        return hasRoom ? (guests.find(g => g.sessionId === user.sessionId) || user) : user;
    }, [hasRoom, guests, user]);

    const roommate = useMemo(() => {
        return hasRoom ? guests.find(g => g.sessionId !== user.sessionId) : null;
    }, [hasRoom, guests, user?.sessionId]);

    // 핸들러
    const handleSubmitRequest = async () => {
        const { phone, reason, type } = state.requestForm;
        if (!phone.trim()) {
            toast.warning('연락처를 입력해주세요.');
            return;
        }
        dispatch({ type: ACTIONS.SET_SUBMITTING, value: true });
        try {
            await onRequestChange({
                type,
                phoneNumber: phone,
                reason,
                roomNumber: user.selectedRoom,
                userName: user.name,
                sessionId: user.sessionId
            });
            toast.success(type === 'change' ? '방 변경 요청이 전송되었습니다.' : '배정 취소 요청이 전송되었습니다.');
            dispatch({ type: ACTIONS.CLOSE_FORM });
        } catch (error) {
            toast.error('요청 실패: ' + error.message);
        } finally {
            dispatch({ type: ACTIONS.SET_SUBMITTING, value: false });
        }
    };

    const handleSaveProfile = async () => {
        if (!user?.sessionId) return;
        dispatch({ type: ACTIONS.SET_SUBMITTING, value: true });
        try {
            await updateUser(user.sessionId, {
                snoring: state.editForm.snoring,
                company: state.editForm.company.trim(),
                ageTolerance: parseInt(state.editForm.ageTolerance) || 5
            });
            toast.success('정보가 수정되었습니다.');
            dispatch({ type: ACTIONS.SET_EDITING, value: false });
        } catch (error) {
            toast.error('수정 실패: ' + error.message);
        } finally {
            dispatch({ type: ACTIONS.SET_SUBMITTING, value: false });
        }
    };

    const handleReinvite = async () => {
        const name = state.reinviteForm.name.trim();
        if (!name) {
            toast.warning('룸메이트 이름을 입력해주세요.');
            return;
        }
        if (name.length < 2) {
            toast.warning('이름은 2자 이상 입력해주세요.');
            return;
        }
        dispatch({ type: ACTIONS.SET_SUBMITTING, value: true });
        try {
            await onReinvite(name);
            toast.success(`${name}님에게 초대를 보냈습니다.`);
            dispatch({ type: ACTIONS.CLOSE_FORM });
            dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'reinviteForm', field: 'name', value: '' });
        } catch (error) {
            toast.error('초대 전송 실패: ' + error.message);
        } finally {
            dispatch({ type: ACTIONS.SET_SUBMITTING, value: false });
        }
    };

    // 편집 취소 시 폼 초기화
    const handleCancelEdit = () => {
        dispatch({ type: ACTIONS.SET_EDITING, value: false });
        dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'editForm', field: 'snoring', value: currentUser.snoring || 'no' });
        dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'editForm', field: 'company', value: currentUser.company || '' });
        dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'editForm', field: 'ageTolerance', value: currentUser.ageTolerance || 5 });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-800">내 객실 정보</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                        ✕
                    </button>
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex border-b border-gray-200 mb-5">
                    <button
                        onClick={() => dispatch({ type: ACTIONS.SET_TAB, tab: 'room' })}
                        className={`flex-1 py-2.5 px-4 font-medium text-sm transition-colors ${state.activeTab === 'room'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🏠 방 정보
                    </button>
                    <button
                        onClick={() => dispatch({ type: ACTIONS.SET_TAB, tab: 'profile' })}
                        className={`flex-1 py-2.5 px-4 font-medium text-sm transition-colors ${state.activeTab === 'profile'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        👤 내 정보
                    </button>
                </div>

                {/* 방 정보 탭 */}
                {state.activeTab === 'room' && (
                    <>
                        {hasRoom ? (
                            <>
                                {/* 방 정보 카드 */}
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 mb-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-3xl font-bold gradient-text">{user.selectedRoom}호</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${room?.capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {room?.capacity === 2 ? '2인실' : '1인실'}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">층</span>
                                            <span className="text-gray-800 font-medium">{room?.floor}층</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">객실 타입</span>
                                            <span className="text-gray-800 font-medium">{room?.roomType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">구역</span>
                                            <span className={`font-medium ${room?.gender === 'M' ? 'text-blue-600' : 'text-pink-600'}`}>
                                                {getGenderLabel(room?.gender)} 전용
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 투숙객 정보 */}
                                <div className="mb-5">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">투숙객</h3>
                                    <div className="space-y-2">
                                        {/* 본인 */}
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {currentUser.name}
                                                    {currentUser.company && <span className="text-gray-500 text-sm ml-1">({currentUser.company})</span>}
                                                </p>
                                                <p className="text-xs text-emerald-600">본인</p>
                                            </div>
                                        </div>

                                        {/* 룸메이트 */}
                                        {roommate ? (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">👤</div>
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {roommate.name}
                                                        {roommate.company && <span className="text-gray-500 text-sm ml-1">({roommate.company})</span>}
                                                    </p>
                                                    <p className="text-xs text-blue-600">룸메이트</p>
                                                </div>
                                            </div>
                                        ) : room?.capacity === 2 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm">?</div>
                                                    <p className="text-gray-500 text-sm">룸메이트 대기 중...</p>
                                                </div>
                                                {onReinvite && state.activeForm !== 'reinvite' && (
                                                    <button
                                                        onClick={() => dispatch({ type: ACTIONS.OPEN_REINVITE_FORM })}
                                                        className="w-full py-2 px-4 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                                                    >
                                                        👥 룸메이트 초대하기
                                                    </button>
                                                )}
                                                {state.activeForm === 'reinvite' && (
                                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                        <p className="text-sm font-medium text-purple-800 mb-2">👥 룸메이트 초대</p>
                                                        <input
                                                            type="text"
                                                            value={state.reinviteForm.name}
                                                            onChange={(e) => dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'reinviteForm', field: 'name', value: e.target.value })}
                                                            placeholder="룸메이트 이름"
                                                            className="input-field mb-2"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => dispatch({ type: ACTIONS.CLOSE_FORM })}
                                                                className="flex-1 py-2 btn-secondary rounded-lg text-sm"
                                                            >
                                                                취소
                                                            </button>
                                                            <button
                                                                onClick={handleReinvite}
                                                                disabled={state.isSubmitting}
                                                                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                                                            >
                                                                {state.isSubmitting ? '전송중...' : '초대'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 방 변경/취소 버튼 */}
                                {state.activeForm !== 'request' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => dispatch({ type: ACTIONS.OPEN_REQUEST_FORM, requestType: 'change' })}
                                            className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            🔄 방 변경
                                        </button>
                                        <button
                                            onClick={() => dispatch({ type: ACTIONS.OPEN_REQUEST_FORM, requestType: 'cancel' })}
                                            className="flex-1 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                                        >
                                            ❌ 배정 취소
                                        </button>
                                    </div>
                                )}

                                {/* 요청 폼 */}
                                {state.activeForm === 'request' && (
                                    <div className={`p-4 rounded-lg border ${state.requestForm.type === 'change' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
                                        }`}>
                                        <h3 className={`text-sm font-medium mb-3 ${state.requestForm.type === 'change' ? 'text-blue-800' : 'text-red-800'
                                            }`}>
                                            {state.requestForm.type === 'change' ? '🔄 방 변경 요청' : '❌ 배정 취소 요청'}
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">연락처 *</label>
                                                <input
                                                    type="tel"
                                                    value={state.requestForm.phone}
                                                    onChange={(e) => dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'requestForm', field: 'phone', value: e.target.value })}
                                                    placeholder="010-0000-0000"
                                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">사유 (선택)</label>
                                                <textarea
                                                    value={state.requestForm.reason}
                                                    onChange={(e) => dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'requestForm', field: 'reason', value: e.target.value })}
                                                    placeholder="변경/취소 사유를 입력해주세요"
                                                    className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => dispatch({ type: ACTIONS.CLOSE_FORM })}
                                                className="flex-1 py-2 btn-secondary rounded-lg text-sm"
                                            >
                                                취소
                                            </button>
                                            <button
                                                onClick={handleSubmitRequest}
                                                disabled={state.isSubmitting}
                                                className={`flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${state.requestForm.type === 'change' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                                                    }`}
                                            >
                                                {state.isSubmitting ? '전송 중...' : '요청하기'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="mb-5 p-6 bg-gray-50 rounded-xl text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-3xl">🏠</span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">아직 배정된 객실이 없습니다</h3>
                                <p className="text-sm text-gray-600 mb-4">객실을 선택하거나 룸메이트 초대를 받아보세요.</p>
                                <div className="text-xs text-gray-500">
                                    <p>👤 내 정보 탭에서 개인 정보를 확인할 수 있습니다.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* 내 정보 탭 */}
                {state.activeTab === 'profile' && (
                    <div className="mb-5">
                        {!state.isEditing ? (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-medium text-gray-700">개인 정보</h3>
                                    <button
                                        onClick={() => dispatch({ type: ACTIONS.SET_EDITING, value: true })}
                                        className="text-xs text-blue-600 hover:underline font-medium"
                                    >
                                        수정
                                    </button>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">이름</span>
                                        <span className="text-gray-800 font-medium">{currentUser.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">회사</span>
                                        <span className="text-gray-800">{currentUser.company || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">코골이</span>
                                        <span className="text-gray-800">{SNORING_LABELS[currentUser.snoring] || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">나이 허용 범위</span>
                                        <span className="text-gray-800">±{currentUser.ageTolerance || 5}세</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-sm font-medium text-blue-800 mb-3">내 정보 수정</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-blue-700 mb-1">회사</label>
                                        <input
                                            type="text"
                                            value={state.editForm.company}
                                            onChange={(e) => dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'editForm', field: 'company', value: e.target.value })}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-blue-700 mb-1">코골이</label>
                                        <select
                                            value={state.editForm.snoring}
                                            onChange={(e) => dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'editForm', field: 'snoring', value: e.target.value })}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="no">😴 없음</option>
                                            <option value="yes">😤 있음</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-blue-700 mb-1">나이 허용 범위</label>
                                        <select
                                            value={state.editForm.ageTolerance}
                                            onChange={(e) => dispatch({ type: ACTIONS.UPDATE_FIELD, form: 'editForm', field: 'ageTolerance', value: e.target.value })}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="3">±3세</option>
                                            <option value="5">±5세</option>
                                            <option value="10">±10세</option>
                                            <option value="99">상관없음</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">* 성별/이름 변경은 관리자에게 문의해주세요.</p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={state.isSubmitting}
                                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {state.isSubmitting ? '저장 중...' : '저장'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
