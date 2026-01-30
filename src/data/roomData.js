/**
 * V-Up 객실 데이터
 * CSV에서 파싱한 호텔 객실 정보
 */

const ROOM_MAPPING = {
    single: {
        F: [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013],
        M: [1101, 1102, 1103, 1104, 1105, 1106, 1107, 1109, 1110, 1111, 1112, 1113, 1114, 1115, 1117,1118,1119,1126,9999],
    },
    double: {
        F: [1014, 1015, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1026],
        M: [901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 918, 919, 920],
    },
};

function buildRoomData() {
    const singleF = new Set(ROOM_MAPPING.single.F.map(String));
    const singleM = new Set(ROOM_MAPPING.single.M.map(String));
    const doubleF = new Set(ROOM_MAPPING.double.F.map(String));
    const doubleM = new Set(ROOM_MAPPING.double.M.map(String));

    const all = new Set([
        ...singleF,
        ...singleM,
        ...doubleF,
        ...doubleM,
    ]);

    const byFloor = {};
    for (const roomStr of all) {
        const num = Number(roomStr);
        const floor = Math.floor(num / 100);
        if (!byFloor[floor]) byFloor[floor] = [];
        byFloor[floor].push(roomStr);
    }

    const result = {};
    const COLS = 6;

    for (const [floorStr, roomList] of Object.entries(byFloor)) {
        const sorted = roomList.sort((a, b) => Number(a) - Number(b));
        sorted.forEach((roomStr, idx) => {
            const isSingle = singleF.has(roomStr) || singleM.has(roomStr);
            const isFemale = singleF.has(roomStr) || doubleF.has(roomStr);

            const capacity = isSingle ? 1 : 2;
            result[roomStr] = {
                floor: Number(floorStr),
                type: capacity === 1 ? 'single' : 'twin',
                gender: isFemale ? 'F' : 'M',
                capacity,
                roomType: capacity === 1 ? '1인실' : '2인실',
                position: { row: Math.floor(idx / COLS), col: idx % COLS },
            };
        });
    }

    return result;
}

// 층별 객실 배치 데이터 (단일 소스: ROOM_MAPPING)
export const roomData = buildRoomData();

// 층 목록
export const floors = [11, 10, 9];

// 층별 정보
export const floorInfo = {
    11: { label: "11층", description: "남성 1인실", gender: "M" },
    10: { label: "10층", description: "여성 1인실 / 2인실", gender: "F" },
    9: { label: "9층", description: "남성 2인실", gender: "M" },
};

/**
 * 층별 객실 가져오기
 * @param {number} floor 
 * @returns {Object} 해당 층의 객실들
 */
export function getRoomsByFloor(floor) {
    const rooms = {};
    for (const [roomNumber, data] of Object.entries(roomData)) {
        if (data.floor === floor) {
            rooms[roomNumber] = data;
        }
    }
    return rooms;
}

/**
 * 성별별 객실 가져오기
 * @param {'M' | 'F'} gender 
 * @returns {Object} 해당 성별의 객실들
 */
export function getRoomsByGender(gender) {
    const rooms = {};
    for (const [roomNumber, data] of Object.entries(roomData)) {
        if (data.gender === gender) {
            rooms[roomNumber] = data;
        }
    }
    return rooms;
}
