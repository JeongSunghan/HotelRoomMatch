/**
 * 객실 상태 관리 훅
 * - Firebase 실시간 구독 또는 로컬 스토리지 폴백
 * - 객실 선택/해제, 상태 조회, 통계 제공
 */
import { useState, useEffect, useCallback } from 'react';
import { roomData } from '../data/roomData';
import { subscribeToRooms, isFirebaseInitialized, selectRoom as firebaseSelectRoom, removeGuestFromRoom as firebaseRemoveGuest } from '../firebase/index';
import type { RoomGuestsMap, Guest, Gender, RoomStatus, RoomInfo } from '../types';

interface UseRoomsReturn {
    roomGuests: RoomGuestsMap;
    isLoading: boolean;
    error: string | null;
    getRoomStatus: (roomNumber: string, userGender: Gender, isAdmin?: boolean) => RoomStatus;
    addGuestToRoom: (roomNumber: string, guestData: Guest) => Promise<void>;
    removeGuestFromRoom: (roomNumber: string, sessionId: string) => Promise<void>;
    getStats: (gender?: Gender | null) => {
        totalRooms: number;
        totalCapacity: number;
        occupiedSlots: number;
        availableSlots: number;
        occupancyRate: number;
    };
    isFirebaseConnected: boolean;
}

export function useRooms(): UseRoomsReturn {
    const [roomGuests, setRoomGuests] = useState<RoomGuestsMap>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isFirebaseInitialized()) {
            const unsubscribe = subscribeToRooms((data) => {
                const guests: RoomGuestsMap = {};
                for (const [roomNumber, roomInfo] of Object.entries(data)) {
                    let guestList = roomInfo.guests || [];
                    if (guestList && !Array.isArray(guestList)) {
                        guestList = Object.values(guestList) as Guest[];
                    }
                    guests[roomNumber] = guestList as Guest[];
                }
                setRoomGuests(guests);
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            const savedGuests = localStorage.getItem('vup58_room_guests');
            if (savedGuests) {
                try {
                    setRoomGuests(JSON.parse(savedGuests) as RoomGuestsMap);
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

    const getRoomStatus = useCallback((roomNumber: string, userGender: Gender, _isAdmin: boolean = false): RoomStatus => {
        const room = (roomData as Record<string, RoomInfo>)[roomNumber];
        if (!room) {
            return {
                status: 'unknown',
                canSelect: false,
                guests: [],
                isFull: false,
                capacity: 0,
                type: 'double',
                roomGender: userGender,
                roomType: '',
                guestCount: 0
            };
        }

        let guests = roomGuests[roomNumber] || [];
        if (guests && !Array.isArray(guests)) {
            guests = Object.values(guests) as Guest[];
        }

        const guestCount = guests.length;
        const isFull = guestCount >= room.capacity;

        const result: RoomStatus = {
            guests: guests as Guest[],
            guestCount,
            isFull,
            capacity: room.capacity,
            type: room.type,
            roomGender: room.gender,
            roomType: room.roomType,
            status: 'full',
            canSelect: false
        };

        if (room.gender !== userGender) {
            return { ...result, status: 'wrong-gender', canSelect: false };
        }

        // 1인실 - 완전 잠금 (관리자 직접 데이터 입력)
        if (room.capacity === 1) {
            if (guestCount === 0) {
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
    }, [roomGuests]);

    const addGuestToRoom = useCallback(async (roomNumber: string, guestData: Guest): Promise<void> => {
        const room = (roomData as Record<string, RoomInfo>)[roomNumber];
        const capacity = room?.capacity || 2;
        const roomGender = room?.gender || null;  // 성별 검증용

        if (isFirebaseInitialized()) {
            try {
                // 서버 측 검증 강화: capacity와 roomGender 전달
                await firebaseSelectRoom(roomNumber, guestData, capacity, roomGender);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
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

    const removeGuestFromRoom = useCallback(async (roomNumber: string, sessionId: string): Promise<void> => {
        if (isFirebaseInitialized()) {
            try {
                await firebaseRemoveGuest(roomNumber, sessionId);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
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

    const getStats = useCallback((gender: Gender | null = null): {
        totalRooms: number;
        totalCapacity: number;
        occupiedSlots: number;
        availableSlots: number;
        occupancyRate: number;
    } => {
        let totalRooms = 0;
        let totalCapacity = 0;
        let occupiedSlots = 0;

        for (const [roomNumber, room] of Object.entries(roomData as Record<string, RoomInfo>)) {
            const roomInfo = room;
            if (gender && roomInfo.gender !== gender) continue;
            totalRooms++;
            totalCapacity += roomInfo.capacity;
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
        isLoading,
        error,
        getRoomStatus,
        addGuestToRoom,
        removeGuestFromRoom,
        getStats,
        isFirebaseConnected: isFirebaseInitialized()
    };
}

