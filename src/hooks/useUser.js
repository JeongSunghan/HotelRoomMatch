import { useState, useEffect, useCallback } from 'react';
import { getGenderFromResidentId } from '../utils/genderUtils';

const STORAGE_KEY = 'vup58_user';
const ADMIN_KEY = 'vup58admin'; // URL 파라미터 키

/**
 * 세션 ID 생성
 */
function generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * 사용자 상태 관리 훅
 */
export function useUser() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 초기화: localStorage에서 사용자 정보 로드
    useEffect(() => {
        // Admin 체크 (URL 파라미터)
        const urlParams = new URLSearchParams(window.location.search);
        const adminParam = urlParams.get('admin');
        if (adminParam === ADMIN_KEY) {
            setIsAdmin(true);
        }

        // 저장된 사용자 정보 로드
        const savedUser = localStorage.getItem(STORAGE_KEY);
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);
            } catch (e) {
                console.error('저장된 사용자 정보 파싱 실패:', e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    /**
     * 사용자 등록
     * @param {Object} userData { name, company, residentIdFront, residentIdBack, age }
     */
    const registerUser = useCallback((userData) => {
        const { name, company, residentIdFront, residentIdBack, age } = userData;

        const gender = getGenderFromResidentId(residentIdBack);
        if (!gender) {
            throw new Error('유효하지 않은 주민번호입니다.');
        }

        const newUser = {
            sessionId: generateSessionId(),
            name: name.trim(),
            company: company?.trim() || '',
            gender,
            age: age || null,
            residentIdFront, // 생년월일 (마스킹용)
            registeredAt: Date.now(),
            selectedRoom: null,
            locked: false
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);

        return newUser;
    }, []);

    /**
     * 객실 선택 완료 처리
     * @param {string} roomNumber 
     */
    const selectRoom = useCallback((roomNumber) => {
        if (!user) return;

        const updatedUser = {
            ...user,
            selectedRoom: roomNumber,
            selectedAt: Date.now(),
            locked: true // 1회 선택 후 잠금
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);

        return updatedUser;
    }, [user]);

    /**
     * 로그아웃 (Admin 전용)
     */
    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
    }, []);

    /**
     * 사용자가 선택 가능한지 확인
     */
    const canSelect = user && !user.locked;

    /**
     * 특정 방을 이 사용자가 선택했는지 확인
     */
    const isMyRoom = useCallback((roomNumber) => {
        return user?.selectedRoom === roomNumber;
    }, [user]);

    return {
        user,
        isAdmin,
        isLoading,
        isRegistered: !!user,
        canSelect,
        registerUser,
        selectRoom,
        logout,
        isMyRoom
    };
}
