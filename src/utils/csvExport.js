/**
 * CSV 내보내기 유틸리티
 */

/** 코골이 값 → CSV용 한글 라벨 (이모지 제외) */
const SNORING_CSV_LABELS = { no: '없음', yes: '있음', sometimes: '가끔' };

/**
 * 객체 배열을 CSV 문자열로 변환
 * @param {Array} data - 데이터 배열
 * @param {Array} columns - 컬럼 정의 [{key: 'name', label: '이름'}, ...]
 * @returns {string} CSV 문자열
 */
export function arrayToCSV(data, columns) {
    if (!data || data.length === 0) return '';

    // 헤더
    const header = columns.map(col => `"${col.label}"`).join(',');

    // 데이터 행
    const rows = data.map(item => {
        return columns.map(col => {
            const value = item[col.key];
            if (value === null || value === undefined) return '""';
            // 쌍따옴표 이스케이프 처리
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(',');
    });

    return [header, ...rows].join('\n');
}

/**
 * CSV 파일 다운로드
 * @param {string} csvContent - CSV 문자열
 * @param {string} filename - 파일명 (확장자 제외)
 */
export function downloadCSV(csvContent, filename) {
    // BOM 추가 (한글 엑셀 호환)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${formatDateForFilename(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 파일명용 날짜 포맷
 */
function formatDateForFilename(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * 객실 배정 데이터를 CSV로 내보내기
 * @param {Object} roomGuests - 객실별 게스트 데이터
 * @param {Object} roomData - 객실 정보 데이터
 * @param {{ users?: Array<{ sessionId: string, age?: number|null, snoring?: string }> }} options - users 목록 전달 시 roomGuests에 age/snoring 없을 때 보강
 */
export function exportRoomAssignmentsToCSV(roomGuests, roomData, options = {}) {
    const { users = [] } = options;
    const userBySessionId = Array.isArray(users) && users.length > 0
        ? new Map(users.map(u => [u?.sessionId, u]).filter(([k]) => k != null))
        : null;

    const data = [];

    for (const [roomNumber, room] of Object.entries(roomData)) {
        const guests = roomGuests[roomNumber] || [];

        if (guests.length === 0) {
            data.push({
                roomNumber,
                floor: room.floor,
                roomType: room.roomType,
                capacity: room.capacity,
                gender: room.gender === 'M' ? '남성' : '여성',
                guestName: '',
                guestCompany: '',
                status: '빈 방',
                snoringStatus: '',
                guestAge: ''
            });
        } else {
            guests.forEach((guest, idx) => {
                // roomGuests에 없으면 users에서 sessionId로 보강 (구배정 데이터 대응)
                const u = userBySessionId && guest.sessionId ? userBySessionId.get(guest.sessionId) : null;
                const age = guest.age != null && guest.age !== '' ? guest.age : (u?.age != null ? u.age : null);
                const snoringRaw = guest.snoring || u?.snoring || '';
                const snoringStatus = SNORING_CSV_LABELS[snoringRaw] ?? (snoringRaw ? snoringRaw : '');
                const guestAge = age != null && age !== '' ? String(age) : '';

                data.push({
                    roomNumber,
                    floor: room.floor,
                    roomType: room.roomType,
                    capacity: room.capacity,
                    gender: room.gender === 'M' ? '남성' : '여성',
                    guestName: guest.name ?? '',
                    guestCompany: guest.company ?? '',
                    status: idx === 0 && guests.length < room.capacity ? '일부 배정' : '배정 완료',
                    snoringStatus,
                    guestAge
                });
            });
        }
    }

    // 층, 호수 순으로 정렬
    data.sort((a, b) => {
        if (a.floor !== b.floor) return a.floor - b.floor;
        return a.roomNumber.localeCompare(b.roomNumber);
    });

    // 컬럼 순서 고정: 객실 | 층 | 정원 | 성별 | 투숙객 | 소속 | 상태 | 코골이상태 | 나이 (객실타입 포함)
    const columns = [
        { key: 'roomNumber', label: '객실' },
        { key: 'floor', label: '층' },
        { key: 'roomType', label: '객실타입' },
        { key: 'capacity', label: '정원' },
        { key: 'gender', label: '성별' },
        { key: 'guestName', label: '투숙객' },
        { key: 'guestCompany', label: '소속' },
        { key: 'status', label: '상태' },
        { key: 'snoringStatus', label: '코골이상태' },
        { key: 'guestAge', label: '나이' }
    ];

    const csv = arrayToCSV(data, columns);
    downloadCSV(csv, '객실배정현황');
}
