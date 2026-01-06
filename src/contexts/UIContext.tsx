/**
 * UI 상태 Context
 * 모달, 알림 등 UI 관련 상태를 중앙 관리
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 모달 타입 정의
export const MODAL_TYPES = {
    REGISTRATION: 'registration',
    ADDITIONAL_INFO: 'additionalInfo',
    MY_ROOM: 'myRoom',
    SEARCH: 'search',
    SINGLE_ROOM: 'singleRoom',
    WARNING: 'warning',
    CANCELLED: 'cancelled',
    INVITATIONS: 'invitations',
    SELECTION: 'selection',  // 방 선택 확인 모달
} as const;

export type ModalType = typeof MODAL_TYPES[keyof typeof MODAL_TYPES];

type ModalState = Record<ModalType, boolean>;

interface WarningContent {
    message: string;
    [key: string]: unknown;
}

interface PendingSelection {
    roomNumber: string;
    [key: string]: unknown;
}

interface UIContextValue {
    // 모달 상태
    modals: ModalState;
    openModal: (modalName: ModalType, data?: { roomNumber?: string; warnings?: WarningContent[]; pendingSelection?: PendingSelection } | null) => void;
    closeModal: (modalName: ModalType) => void;
    closeAllModals: () => void;

    // 방 선택 관련
    selectedRoomNumber: string | null;
    openSelectionModal: (roomNumber: string) => void;

    // 경고 모달 관련
    warningContent: WarningContent[];
    setWarningContent: (content: WarningContent[]) => void;
    pendingSelection: PendingSelection | null;
    setPendingSelection: (selection: PendingSelection | null) => void;

    // 층/필터 상태
    selectedFloor: number | null;
    setSelectedFloor: (floor: number | null) => void;
    roomTypeFilter: string;
    setRoomTypeFilter: (filter: string) => void;

    // 상수
    MODAL_TYPES: typeof MODAL_TYPES;
}

const UIContext = createContext<UIContextValue | null>(null);

const initialModalState: ModalState = {
    [MODAL_TYPES.REGISTRATION]: false,
    [MODAL_TYPES.ADDITIONAL_INFO]: false,
    [MODAL_TYPES.MY_ROOM]: false,
    [MODAL_TYPES.SEARCH]: false,
    [MODAL_TYPES.SINGLE_ROOM]: false,
    [MODAL_TYPES.WARNING]: false,
    [MODAL_TYPES.CANCELLED]: false,
    [MODAL_TYPES.INVITATIONS]: false,
    [MODAL_TYPES.SELECTION]: false,
};

interface UIProviderProps {
    children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
    // 모달 상태 통합 관리
    const [modals, setModals] = useState<ModalState>(initialModalState);

    // 선택된 방 번호 (SelectionModal용)
    const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);

    // 경고 모달 관련 상태
    const [warningContent, setWarningContent] = useState<WarningContent[]>([]);
    const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);

    // 층 선택 상태
    const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

    // 필터 상태
    const [roomTypeFilter, setRoomTypeFilter] = useState<string>('twin');

    // 모달 열기
    const openModal = useCallback((modalName: ModalType, data: { roomNumber?: string; warnings?: WarningContent[]; pendingSelection?: PendingSelection } | null = null) => {
        setModals(prev => ({ ...prev, [modalName]: true }));

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
    const closeModal = useCallback((modalName: ModalType) => {
        setModals(prev => ({ ...prev, [modalName]: false }));

        // 모달별 상태 정리
        if (modalName === MODAL_TYPES.SELECTION) {
            setSelectedRoomNumber(null);
        }
        if (modalName === MODAL_TYPES.WARNING) {
            setWarningContent([]);
            setPendingSelection(null);
        }
    }, []);

    // 모든 모달 닫기
    const closeAllModals = useCallback(() => {
        setModals(initialModalState);
        setWarningContent([]);
        setPendingSelection(null);
        setSelectedRoomNumber(null);
    }, []);

    // 방 선택 (Selection 모달 열기)
    const openSelectionModal = useCallback((roomNumber: string) => {
        setSelectedRoomNumber(roomNumber);
        setModals(prev => ({ ...prev, [MODAL_TYPES.SELECTION]: true }));
    }, []);

    const value: UIContextValue = {
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

export const useUI = (): UIContextValue => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

