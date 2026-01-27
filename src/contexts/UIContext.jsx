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
    RESERVED_REDIRECT: 'reservedRedirect',
    INVITATIONS: 'invitations',
    SELECTION: 'selection',  // 방 선택 확인 모달
};

const initialModalState = {
    [MODAL_TYPES.REGISTRATION]: false,
    [MODAL_TYPES.ADDITIONAL_INFO]: false,
    [MODAL_TYPES.MY_ROOM]: false,
    [MODAL_TYPES.SEARCH]: false,
    [MODAL_TYPES.SINGLE_ROOM]: false,
    [MODAL_TYPES.WARNING]: false,
    [MODAL_TYPES.CANCELLED]: false,
    [MODAL_TYPES.RESERVED_REDIRECT]: false,
    [MODAL_TYPES.INVITATIONS]: false,
    [MODAL_TYPES.SELECTION]: false,
};

export function UIProvider({ children }) {
    // 모달 상태 통합 관리
    const [modals, setModals] = useState(initialModalState);

    // 모달 payload(예: reserved 잔여초 안내, 공통 Confirm 데이터 등)
    // 왜: 모달마다 개별 useState로 흩어지면 App이 비대해지고, 상태 동기화 실수가 잦아짐.
    const [modalData, setModalData] = useState({});

    // 선택된 방 번호 (SelectionModal용)
    const [selectedRoomNumber, setSelectedRoomNumber] = useState(null);

    // 경고 모달 관련 상태
    const [warningContent, setWarningContent] = useState([]);
    const [pendingSelection, setPendingSelection] = useState(null);

    // 층 선택 상태
    const [selectedFloor, setSelectedFloor] = useState(null);

    // 필터 상태
    const [roomTypeFilter, setRoomTypeFilter] = useState('twin');

    // 모달 열기
    const openModal = useCallback((modalName, data = null) => {
        setModals(prev => ({ ...prev, [modalName]: true }));

        if (data !== null && data !== undefined) {
            setModalData(prev => ({ ...prev, [modalName]: data }));
        }

        // 모달별 추가 데이터 처리
        if (modalName === MODAL_TYPES.SELECTION && data?.roomNumber) {
            setSelectedRoomNumber(data.roomNumber);
        }
        if (modalName === MODAL_TYPES.WARNING && data) {
            if (data.warnings) setWarningContent(data.warnings);
            if (data.pendingSelection) setPendingSelection(data.pendingSelection);
        }
    }, []);

    // 모달 닫기
    const closeModal = useCallback((modalName) => {
        setModals(prev => ({ ...prev, [modalName]: false }));
        setModalData(prev => {
            if (!Object.prototype.hasOwnProperty.call(prev, modalName)) return prev;
            const next = { ...prev };
            delete next[modalName];
            return next;
        });

        // 모달별 상태 정리
        if (modalName === MODAL_TYPES.SELECTION) {
            setSelectedRoomNumber(null);
            setModalData(prev => {
                const next = { ...prev };
                delete next[MODAL_TYPES.SELECTION];
                return next;
            });
        }
        if (modalName === MODAL_TYPES.WARNING) {
            setWarningContent([]);
            setPendingSelection(null);
        }
    }, []);

    // 모든 모달 닫기
    const closeAllModals = useCallback(() => {
        setModals(initialModalState);
        setModalData({});
        setWarningContent([]);
        setPendingSelection(null);
        setSelectedRoomNumber(null);
    }, []);

    // 방 선택 (Selection 모달 열기)
    const openSelectionModal = useCallback((roomNumber, expiresAt = null) => {
        setSelectedRoomNumber(roomNumber);
        setModals(prev => ({ ...prev, [MODAL_TYPES.SELECTION]: true }));
        // 예약 만료 시간 저장 (타이머 표시용)
        if (expiresAt) {
            setModalData(prev => ({ ...prev, [MODAL_TYPES.SELECTION]: { expiresAt } }));
        }
    }, []);

    const value = {
        // 모달 상태
        modals,
        openModal,
        closeModal,
        closeAllModals,
        modalData,

        // 방 선택 관련
        selectedRoomNumber,
        openSelectionModal,

        // 경고 모달 관련
        warningContent,
        setWarningContent,
        pendingSelection,
        setPendingSelection,

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

