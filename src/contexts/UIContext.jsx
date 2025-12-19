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
};

export function UIProvider({ children }) {
    // 모달 상태 통합 관리
    const [modals, setModals] = useState(initialModalState);

    // 선택된 방 번호 (SelectionModal용)
    const [selectedRoomNumber, setSelectedRoomNumber] = useState(null);

    // 경고 모달 데이터
    const [warningData, setWarningData] = useState(null);

    // 모달 열기
    const openModal = useCallback((modalName, data = null) => {
        setModals(prev => ({ ...prev, [modalName]: true }));
        if (data) {
            if (modalName === MODAL_TYPES.WARNING) {
                setWarningData(data);
            }
        }
    }, []);

    // 모달 닫기
    const closeModal = useCallback((modalName) => {
        setModals(prev => ({ ...prev, [modalName]: false }));
        if (modalName === MODAL_TYPES.WARNING) {
            setWarningData(null);
        }
    }, []);

    // 모든 모달 닫기
    const closeAllModals = useCallback(() => {
        setModals(initialModalState);
        setWarningData(null);
        setSelectedRoomNumber(null);
    }, []);

    // 특정 방 선택 (모달 열기와 함께)
    const selectRoom = useCallback((roomNumber) => {
        setSelectedRoomNumber(roomNumber);
    }, []);

    const value = {
        modals,
        openModal,
        closeModal,
        closeAllModals,
        selectedRoomNumber,
        selectRoom,
        warningData,
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
