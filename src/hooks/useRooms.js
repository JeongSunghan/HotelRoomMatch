/**
 * 객실 상태 관리 훅
 * - Firebase 실시간 구독 또는 로컬 스토리지 폴백
 * - 객실 선택/해제, 상태 조회, 통계 제공
 */
import { useState, useEffect, useCallback } from 'react';
import { roomData } from '../data/roomData';
import {
    subscribeToRooms,
    isFirebaseInitialized,
    selectRoom as firebaseSelectRoom,
    removeGuestFromRoom as firebaseRemoveGuest,
    // 예약 시스템 추가
    cleanupExpiredReservations,
    subscribeToAllReservations
} from '../firebase/index';

export function useRooms() {
    const [roomGuests, setRoomGuests] = useState({});
    const [reservations, setReservations] = useState({}); // 예약 상태 추가
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 객실 데이터 구독
    useEffect(() => {
        if (isFirebaseInitialized()) {
            const unsubscribeRooms = subscribeToRooms((data) => {
                const guests = {};
                for (const [roomNumber, roomInfo] of Object.entries(data)) {
                    let guestList = roomInfo.guests || [];
                    if (guestList && !Array.isArray(guestList)) {
                        guestList = Object.values(guestList);
                    }
                    guests[roomNumber] = guestList;
                }
                setRoomGuests(guests);
                setIsLoading(false);
            });

            // 예약 상태 구독 추가
            const unsubscribeReservations = subscribeToAllReservations((data) => {
                setReservations(data);
            });

            // 만료된 예약 주기적 정리 (2분마다)
            const cleanupInterval = setInterval(() => {
                cleanupExpiredReservations().catch(console.error);
            }, 2 * 60 * 1000);

            return () => {
                unsubscribeRooms();
                unsubscribeReservations();
                clearInterval(cleanupInterval);
            };
        } else {
            const savedGuests = localStorage.getItem('vup58_room_guests');
            if (savedGuests) {
                try {
                    setRoomGuests(JSON.parse(savedGuests));
                } catch (e) {
                    // 파싱 실패 무시
                }
            }
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isFirebaseInitialized() && Object.keys(roomGuests).length > 0) {
            localStorage.setItem('vup58_room_guests', JSON.stringify(roomGuests));
        }
    }, [roomGuests]);

    const getRoomStatus = useCallback((roomNumber, userGender, isAdmin = false, singleRoomApproved = false) => {
        const room = roomData[roomNumber];
        if (!room) {
            return { status: 'unknown', canSelect: false, guests: [], isFull: false };
        }

        let guests = roomGuests[roomNumber] || [];
        if (guests && !Array.isArray(guests)) {
            guests = Object.values(guests);
        }

        const guestCount = guests.length;
        const isFull = guestCount >= room.capacity;

        // 예약 정보 추가
        const reservation = reservations[roomNumber];
        const isReserved = !!reservation;

        const result = {
            guests,
            guestCount,
            isFull,
            capacity: room.capacity,
            type: room.type,
            roomGender: room.gender,
            roomType: room.roomType,
            reservation, // 예약 정보 포함
            isReserved   // 예약 여부 포함
        };

        if (room.gender !== userGender) {
            return { ...result, status: 'wrong-gender', canSelect: false };
        }

        // 1인실 - 권한 있는 유저 또는 관리자만 선택 가능
        if (room.capacity === 1) {
            if (guestCount === 0) {
                if (singleRoomApproved || isAdmin) {
                    return { ...result, status: 'empty', canSelect: true };
                }
                return { ...result, status: 'locked', canSelect: false, isLocked: true };
            } else {
                return { ...result, status: 'full', canSelect: false };
            }
        }

        if (room.capacity === 2) {
            if (guestCount === 0) {
                return { ...result, status: 'empty', canSelect: true };
            }
            if (guestCount === 1) {
                const existingGuestGender = guests[0]?.gender;
                if (existingGuestGender === userGender) {
                    return { ...result, status: 'half', canSelect: true };
                } else {
                    return { ...result, status: 'wrong-gender', canSelect: false };
                }
            } else {
                return { ...result, status: 'full', canSelect: false };
            }
        }

        return { ...result, status: 'full', canSelect: false };
    }, [roomGuests, reservations]);

    const addGuestToRoom = useCallback(async (roomNumber, guestData) => {
        const room = roomData[roomNumber];
        const capacity = room?.capacity || 2;
        const roomGender = room?.gender || null;  // 성별 검증용

        if (isFirebaseInitialized()) {
            try {
                // 서버 측 검증 강화: capacity와 roomGender 전달
                await firebaseSelectRoom(roomNumber, guestData, capacity, roomGender);
            } catch (err) {
                setError(err.message);
                throw err; // 에러를 상위로 전파
            }
        } else {
            setRoomGuests(prev => {
                const currentGuests = prev[roomNumber] || [];
                if (currentGuests.some(g => g.sessionId === guestData.sessionId)) {
                    return prev;
                }
                if (currentGuests.length >= capacity) {
                    return prev;
                }
                return {
                    ...prev,
                    [roomNumber]: [...currentGuests, guestData]
                };
            });
        }
    }, []);

    const removeGuestFromRoom = useCallback(async (roomNumber, sessionId) => {
        if (isFirebaseInitialized()) {
            try {
                await firebaseRemoveGuest(roomNumber, sessionId);
            } catch (err) {
                setError(err.message);
            }
        } else {
            setRoomGuests(prev => {
                const currentGuests = prev[roomNumber] || [];
                return {
                    ...prev,
                    [roomNumber]: currentGuests.filter(g => g.sessionId !== sessionId)
                };
            });
        }
    }, []);

    const getStats = useCallback((gender = null) => {
        let totalRooms = 0;
        let totalCapacity = 0;
        let occupiedSlots = 0;

        for (const [roomNumber, room] of Object.entries(roomData)) {
            if (gender && room.gender !== gender) continue;
            totalRooms++;
            totalCapacity += room.capacity;
            occupiedSlots += (roomGuests[roomNumber] || []).length;
        }

        return {
            totalRooms,
            totalCapacity,
            occupiedSlots,
            availableSlots: totalCapacity - occupiedSlots,
            occupancyRate: totalCapacity > 0 ? Math.round((occupiedSlots / totalCapacity) * 100) : 0
        };
    }, [roomGuests]);

    return {
        roomGuests,
        reservations, // 외부 노출
        isLoading,
        error,
        getRoomStatus,
        addGuestToRoom,
        removeGuestFromRoom,
        getStats,
        isFirebaseConnected: isFirebaseInitialized()
    };
}
