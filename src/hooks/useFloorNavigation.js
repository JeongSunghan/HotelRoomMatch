/**
 * 층 네비게이션 및 검색 하이라이트 관리 훅
 */
import { useState, useEffect } from 'react';
import { floors, floorInfo } from '../data/roomData';

/**
 * @param {import('../types/types').User} user - 현재 사용자
 * @param {string|null} selectedFloor - 현재 선택된 층
 * @param {Function} setSelectedFloor - 층 선택 setter
 * @returns {Object} 층 네비게이션 관련 상태 및 함수
 */
export function useFloorNavigation(user, selectedFloor, setSelectedFloor) {
    // 검색 결과 하이라이트
    const [highlightedRoom, setHighlightedRoom] = useState(null);

    // 사용자 성별에 맞는 기본 층 설정 (초기 진입 시)
    useEffect(() => {
        if (user?.gender && selectedFloor === null) {
            const defaultFloor = floors.find(f => floorInfo[f].gender === user.gender);
            if (defaultFloor) {
                setSelectedFloor(defaultFloor);
            } else {
                setSelectedFloor(floors[0]);
            }
        }
    }, [user?.gender, selectedFloor, setSelectedFloor]);

    // 기본 층 설정 (사용자 등록 전)
    useEffect(() => {
        if (selectedFloor === null) {
            setSelectedFloor(floors[0]);
        }
    }, [selectedFloor, setSelectedFloor]);

    /**
     * 특정 방으로 이동 (검색 결과 클릭 시)
     * @param {string} roomNumber - 방 번호
     * @param {Object} roomData - 방 정보
     */
    const navigateToRoom = (roomNumber, roomData) => {
        if (roomData) {
            // 해당 층으로 이동
            setSelectedFloor(roomData.floor);

            // 하이라이트 효과 (3초간)
            setHighlightedRoom(roomNumber);
            setTimeout(() => setHighlightedRoom(null), 3000);
        }
    };

    return {
        highlightedRoom,
        setHighlightedRoom,
        navigateToRoom
    };
}
