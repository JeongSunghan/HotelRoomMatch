/**
 * UI 상태 Context
 * 모달, 알림 등 UI 관련 상태를 중앙 관리
 */
import { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

// 모달 타입 정의
const MODAL_TYPES = {
    REGISTRATION: 'registration',
    ADDITIONAL_INFO: 'additionalInfo',
    MY_ROOM: 'myRoom',
    SEARCH: 'search',
    SINGLE_ROOM: 'singleRoom',
    WARNING: 'warning',
    CANCELLED: 'cancelled',
    INVITATIONS: 'invitations',
    SELECTION: 'selection',  // 방 선택 확인 모달
    RESERVATION_BLOCKED: 'reservationBlocked', // 예약 중인 방 클릭 시
};

const initialModalState = {
    [MODAL_TYPES.REGISTRATION]: false,
    [MODAL_TYPES.ADDITIONAL_INFO]: false,
    [MODAL_TYPES.MY_ROOM]: false,
    [MODAL_TYPES.SEARCH]: false,
    [MODAL_TYPES.SINGLE_ROOM]: false,
    [MODAL_TYPES.WARNING]: false,
    [MODAL_TYPES.CANCELLED]: false,
    [MODAL_TYPES.INVITATIONS]: false,
    [MODAL_TYPES.SELECTION]: false,
    [MODAL_TYPES.RESERVATION_BLOCKED]: false,
};

export function UIProvider({ children }) {
    // 모달 상태 통합 관리
    const [modals, setModals] = useState(initialModalState);

    // 선택된 방 번호 (SelectionModal용)
    const [selectedRoomNumber, setSelectedRoomNumber] = useState(null);

    // 경고 모달 관련 상태
    const [warningContent, setWarningContent] = useState([]);
    const [pendingSelection, setPendingSelection] = useState(null);

    // 예약 차단 모달 상태
    const [blockedReservation, setBlockedReservation] = useState(null);

    // 층 선택 상태
    const [selectedFloor, setSelectedFloor] = useState(null);

    // 필터 상태
    const [roomTypeFilter, setRoomTypeFilter] = useState('twin');

    // 모달 열기
    const openModal = useCallback((modalName, data = null) => {
        setModals(prev => ({ ...prev, [modalName]: true }));

        // 모달별 추가 데이터 처리
        if (modalName === MODAL_TYPES.SELECTION && data?.roomNumber) {
            setSelectedRoomNumber(data.roomNumber);
        }
        if (modalName === MODAL_TYPES.WARNING && data) {
            if (data.warnings) setWarningContent(data.warnings);
            if (data.pendingSelection) setPendingSelection(data.pendingSelection);
        }
        if (modalName === MODAL_TYPES.RESERVATION_BLOCKED && data?.reservation) {
            setBlockedReservation(data.reservation);
        }
    }, []);

    // 모달 닫기
    const closeModal = useCallback((modalName) => {
        setModals(prev => ({ ...prev, [modalName]: false }));

        // 모달별 상태 정리
        if (modalName === MODAL_TYPES.SELECTION) {
            setSelectedRoomNumber(null);
        }
        if (modalName === MODAL_TYPES.WARNING) {
            setWarningContent([]);
            setPendingSelection(null);
        }
        if (modalName === MODAL_TYPES.RESERVATION_BLOCKED) {
            setBlockedReservation(null);
        }
    }, []);

    // 모든 모달 닫기
    const closeAllModals = useCallback(() => {
        setModals(initialModalState);
        setWarningContent([]);
        setPendingSelection(null);
        setSelectedRoomNumber(null);
        setBlockedReservation(null);
    }, []);

    // 예약 차단 모달 열기 (편의 함수)
    const openReservationBlockedModal = useCallback((reservation) => {
        setBlockedReservation(reservation);
        setModals(prev => ({ ...prev, [MODAL_TYPES.RESERVATION_BLOCKED]: true }));
    }, []);

    // 방 선택 (Selection 모달 열기)
    const openSelectionModal = useCallback((roomNumber) => {
        setSelectedRoomNumber(roomNumber);
        setModals(prev => ({ ...prev, [MODAL_TYPES.SELECTION]: true }));
    }, []);

    const value = {
        // 모달 상태
        modals,
        openModal,
        closeModal,
        closeAllModals,

        // 방 선택 관련
        selectedRoomNumber,
        openSelectionModal,

        // 경고 모달 관련
        warningContent,
        setWarningContent,
        pendingSelection,
        setPendingSelection,

        // 예약 차단 모달 관련
        blockedReservation,
        openReservationBlockedModal,

        // 층/필터 상태
        selectedFloor,
        setSelectedFloor,
        roomTypeFilter,
        setRoomTypeFilter,

        // 상수
        MODAL_TYPES,
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
}

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

export { MODAL_TYPES };

