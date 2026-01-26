/**
 * V-Up 58기 객실 데이터
 * CSV에서 파싱한 호텔 객실 정보
 */

// 층별 객실 배치 데이터
export const roomData = {
    // === 12층: 여성 1인실 (더블) ===
    "1207": { floor: 12, type: "single", gender: "F", capacity: 1, roomType: "더블", position: { row: 0, col: 0 } },
    "1208": { floor: 12, type: "single", gender: "F", capacity: 1, roomType: "더블", position: { row: 0, col: 1 } },
    "1211": { floor: 12, type: "single", gender: "F", capacity: 1, roomType: "더블", position: { row: 0, col: 2 } },
    "1215": { floor: 12, type: "single", gender: "F", capacity: 1, roomType: "더블", position: { row: 0, col: 3 } },
    "1216": { floor: 12, type: "single", gender: "F", capacity: 1, roomType: "스탠다드더블", position: { row: 0, col: 4 } },

    // === 11층: 남성 1인실 (디럭스더블/스탠다드더블) ===
    "1101": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 0, col: 0 } },
    "1102": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 0, col: 1 } },
    "1103": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 0, col: 2 } },
    "1104": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 0, col: 3 } },
    "1105": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 0, col: 4 } },
    "1106": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 0, col: 5 } },
    "1107": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 1, col: 0 } },
    "1108": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 1, col: 1 } },
    "1109": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 1, col: 2 } },
    "1110": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 1, col: 3 } },
    "1111": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 1, col: 4 } },
    "1112": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 1, col: 5 } },
    "1113": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 2, col: 0 } },
    "1114": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 2, col: 1 } },
    "1115": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 2, col: 2 } },
    "1117": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 2, col: 3 } },
    "1118": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 2, col: 4 } },
    "1119": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 2, col: 5 } },
    "1120": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 3, col: 0 } },
    "1121": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 3, col: 1 } },
    "1122": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "스탠다드더블", position: { row: 3, col: 2 } },
    "1123": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "스탠다드더블", position: { row: 3, col: 3 } },
    "1124": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "스탠다드더블", position: { row: 3, col: 4 } },
    "1125": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "스탠다드더블", position: { row: 3, col: 5 } },
    "1126": { floor: 11, type: "single", gender: "M", capacity: 1, roomType: "디럭스더블", position: { row: 4, col: 0 } },

    // === 10층: 여성 1인실 & 2인실 (더블트윈) ===
    // 1인실
    "1001": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 0 } },
    "1002": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 1 } },
    "1003": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 2 } },
    "1004": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 3 } },
    "1005": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 4 } },
    "1006": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 5 } },
    "1007": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 1, col: 0 } },
    "1008": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 1, col: 1 } },
    "1009": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 1, col: 2 } },
    "1010": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 1, col: 3 } },
    "1011": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 1, col: 4 } },
    "1012": { floor: 10, type: "single", gender: "F", capacity: 1, roomType: "더블트윈", position: { row: 1, col: 5 } },
    // 2인실
    "1013": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 2, col: 0 } },
    "1014": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 2, col: 1 } },
    "1015": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 2, col: 2 } },
    "1017": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 2, col: 3 } },
    "1018": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 2, col: 4 } },
    "1019": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 2, col: 5 } },
    "1020": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 3, col: 0 } },
    "1021": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 3, col: 1 } },
    "1022": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 3, col: 2 } },
    "1023": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 3, col: 3 } },
    "1024": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 3, col: 4 } },
    "1025": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 3, col: 5 } },
    "1026": { floor: 10, type: "twin", gender: "F", capacity: 2, roomType: "더블트윈", position: { row: 4, col: 0 } },

    // === 8층: 남성 1인실 (더블트윈/패밀리트윈) ===
    "805": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 0 } },
    "806": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 1 } },
    "807": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 2 } },
    "809": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 3 } },
    "810": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 4 } },
    "813": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "더블트윈", position: { row: 0, col: 5 } },
    "814": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "패밀리트윈", position: { row: 1, col: 0 } },
    "817": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "패밀리트윈", position: { row: 1, col: 1 } },
    "818": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "패밀리트윈", position: { row: 1, col: 2 } },
    "819": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "패밀리트윈", position: { row: 1, col: 3 } },
    "820": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "패밀리트윈", position: { row: 1, col: 4 } },
    "822": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "패밀리트윈", position: { row: 1, col: 5 } },
    "823": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "패밀리트윈", position: { row: 2, col: 0 } },
    "826": { floor: 8, type: "single", gender: "M", capacity: 1, roomType: "패밀리트윈", position: { row: 2, col: 1 } },

    // === 7층: 남성 2인실 (트윈) ===
    "701": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 0, col: 0 } },
    "702": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 0, col: 1 } },
    "703": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 0, col: 2 } },
    "704": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 0, col: 3 } },
    "705": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 0, col: 4 } },
    "706": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 0, col: 5 } },
    "707": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 1, col: 0 } },
    "708": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 1, col: 1 } },
    "709": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 1, col: 2 } },
    "710": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 1, col: 3 } },
    "711": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 1, col: 4 } },
    "712": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 1, col: 5 } },
    "713": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 0 } },
    "714": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 1 } },
    "715": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 2 } },
    "717": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 3 } },
    "718": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 4 } },
    "719": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 5 } },
    "720": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 3, col: 0 } },
    "721": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 3, col: 1 } },
    "722": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 3, col: 2 } },
    "723": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 3, col: 3 } },
    "724": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 3, col: 4 } },
    "725": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 3, col: 5 } },
    "726": { floor: 7, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 4, col: 0 } },

    // === 6층: 남성 1인실 & 2인실 (트윈) ===
    // 1인실
    "601": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 0, col: 0 } },
    "602": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 0, col: 1 } },
    "603": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 0, col: 2 } },
    "604": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 0, col: 3 } },
    "605": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 0, col: 4 } },
    "606": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 0, col: 5 } },
    "607": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 1, col: 0 } },
    "608": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 1, col: 1 } },
    "609": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 1, col: 2 } },
    "610": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 1, col: 3 } },
    "612": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 1, col: 4 } },
    "613": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 1, col: 5 } },
    "614": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 2, col: 0 } },
    "615": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 2, col: 1 } },
    "617": { floor: 6, type: "single", gender: "M", capacity: 1, roomType: "트윈", position: { row: 2, col: 2 } },
    // 2인실
    "618": { floor: 6, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 3 } },
    "619": { floor: 6, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 4 } },
    "620": { floor: 6, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 2, col: 5 } },
    "622": { floor: 6, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 3, col: 0 } },
    "623": { floor: 6, type: "twin", gender: "M", capacity: 2, roomType: "트윈", position: { row: 3, col: 1 } },
};

// 층 목록
export const floors = [12, 11, 10, 8, 7, 6];

// 층별 정보
export const floorInfo = {
    12: { label: "12층", description: "여성 1인실 (더블)", gender: "F" },
    11: { label: "11층", description: "남성 1인실 (디럭스더블)", gender: "M" },
    10: { label: "10층", description: "여성 1인실 / 2인실", gender: "F" },
    8: { label: "8층", description: "남성 1인실 (더블트윈/패밀리)", gender: "M" },
    7: { label: "7층", description: "남성 2인실 (트윈)", gender: "M" },
    6: { label: "6층", description: "남성 1인실 / 2인실", gender: "M" },
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
