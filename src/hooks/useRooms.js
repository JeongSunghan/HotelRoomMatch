import { useState, useEffect, useCallback } from 'react';
import { roomData } from '../data/roomData';
import { subscribeToRooms, isFirebaseInitialized, selectRoom as firebaseSelectRoom, removeGuestFromRoom as firebaseRemoveGuest } from '../firebase';

export function useRooms() {
    const [roomGuests, setRoomGuests] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isFirebaseInitialized()) {
            const unsubscribe = subscribeToRooms((data) => {
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

    const getRoomStatus = useCallback((roomNumber, userGender, isAdmin = false) => {
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
            roomType: room.roomType
        };

        if (room.gender !== userGender) {
            return { ...result, status: 'wrong-gender', canSelect: false };
        }

        if (room.capacity === 1) {
            if (guestCount === 0) {
                return { ...result, status: 'empty', canSelect: isAdmin, adminOnly: true };
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

    const addGuestToRoom = useCallback(async (roomNumber, guestData) => {
        if (isFirebaseInitialized()) {
            try {
                await firebaseSelectRoom(roomNumber, guestData);
            } catch (err) {
                setError(err.message);
            }
        } else {
            setRoomGuests(prev => {
                const currentGuests = prev[roomNumber] || [];
                if (currentGuests.some(g => g.sessionId === guestData.sessionId)) {
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
