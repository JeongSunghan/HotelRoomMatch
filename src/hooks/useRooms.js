/**
 * 객실 상태 관리 훅
 * - Firebase 실시간 구독 또는 로컬 스토리지 폴백
 * - 객실 선택/해제, 상태 조회, 통계 제공
 */
import { useState, useEffect, useCallback } from 'react';
import { roomData } from '../data/roomData';
import { subscribeToRooms, isFirebaseInitialized, selectRoom as firebaseSelectRoom, removeGuestFromRoom as firebaseRemoveGuest } from '../firebase/index';

export function useRooms() {
    const [roomGuests, setRoomGuests] = useState({});
    const [roomReservations, setRoomReservations] = useState({});
    const [roomPendings, setRoomPendings] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isFirebaseInitialized()) {
            const unsubscribe = subscribeToRooms((data) => {
                const guests = {};
                const reservations = {};
                const pendings = {};
                for (const [roomNumber, roomInfo] of Object.entries(data)) {
                    let guestList = roomInfo.guests || [];
                    if (guestList && !Array.isArray(guestList)) {
                        guestList = Object.values(guestList);
                    }
                    guests[roomNumber] = guestList;

                    if (roomInfo.reservation) {
                        reservations[roomNumber] = roomInfo.reservation;
                    }
                    if (roomInfo.pending) {
                        pendings[roomNumber] = roomInfo.pending;
                    }
                }
                setRoomGuests(guests);
                setRoomReservations(reservations);
                setRoomPendings(pendings);
                setIsLoading(false);
            });
            return () => unsubscribe();
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

    const getRoomStatus = useCallback((roomNumber, userGender, isAdmin = false, canSelectSingleRoom = false, mySessionId = null) => {
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

        const result = {
            guests,
            guestCount,
            isFull,
            capacity: room.capacity,
            type: room.type,
            roomGender: room.gender,
            roomType: room.roomType,
            reservation: roomReservations[roomNumber] || null,
            pending: roomPendings[roomNumber] || null
        };

        if (room.gender !== userGender) {
            return { ...result, status: 'wrong-gender', canSelect: false };
        }

        // PHASE 3: reserved 상태 (60초 임시 예약)
        // - guests가 0명일 때만 의미 있음
        if (guestCount === 0 && result.reservation?.expiresAt) {
            const now = Date.now();
            const expiresAt = Number(result.reservation.expiresAt);
            const reservedBy = result.reservation.reservedBy;
            const isActive = expiresAt > now;
            const isMine = isActive && mySessionId && reservedBy === mySessionId;

            if (isActive) {
                // 다른 유저가 예약 중이면 선택 불가
                if (!isAdmin && !isMine) {
                    return {
                        ...result,
                        status: 'reserved',
                        canSelect: false,
                        reservedRemainingMs: expiresAt - now,
                    };
                }

                // 내가 예약 중(또는 admin)인 경우: 선택 진행 가능
                return {
                    ...result,
                    status: 'reserved',
                    canSelect: true,
                    reservedRemainingMs: expiresAt - now,
                };
            }
        }

        // PHASE 3 (Case 1): pending 상태 (룸메이트 수락 대기)
        // - reserved(60초) 만료 이후에도 2인실 2번째 슬롯을 타인이 선점하지 못하도록 차단
        if (result.pending?.expiresAt) {
            const now = Date.now();
            const expiresAt = Number(result.pending.expiresAt);
            const isActive = expiresAt > now;
            const isAllowed = isActive && mySessionId && result.pending.allowedSessionId === mySessionId;

            if (isActive && !isAdmin && !isAllowed) {
                return {
                    ...result,
                    status: 'pending',
                    canSelect: false,
                    pendingRemainingMs: expiresAt - now,
                };
            }

            if (isActive && (isAdmin || isAllowed)) {
                return {
                    ...result,
                    status: 'pending',
                    canSelect: true,
                    pendingRemainingMs: expiresAt - now,
                };
            }
        }

        // 1인실: allowedUsers.singleRoom === 'Y' 인 유저만 선택 가능
        if (room.capacity === 1) {
            if (guestCount === 0) {
                if (isAdmin || canSelectSingleRoom) {
                    return { ...result, status: 'empty', canSelect: true, isLocked: false };
                }
                return { ...result, status: 'locked', canSelect: false, isLocked: true };
            }
            return { ...result, status: 'full', canSelect: false };
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
    }, [roomGuests, roomReservations, roomPendings]);

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
        isLoading,
        error,
        getRoomStatus,
        addGuestToRoom,
        removeGuestFromRoom,
        getStats,
        isFirebaseConnected: isFirebaseInitialized()
    };
}
