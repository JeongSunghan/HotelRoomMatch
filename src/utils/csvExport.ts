/**
 * CSV 내보내기 유틸리티
 */
import type { RoomInfo, RoomGuestsMap } from '../types';

/**
 * CSV 컬럼 정의
 */
export interface CSVColumn {
    key: string;
    label: string;
}

/**
 * 객체 배열을 CSV 문자열로 변환
 * @param data - 데이터 배열
 * @param columns - 컬럼 정의 [{key: 'name', label: '이름'}, ...]
 * @returns CSV 문자열
 */
export function arrayToCSV(data: Record<string, unknown>[], columns: CSVColumn[]): string {
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
 * @param csvContent - CSV 문자열
 * @param filename - 파일명 (확장자 제외)
 */
export function downloadCSV(csvContent: string, filename: string): void {
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
 * @param date - 날짜
 * @returns YYYYMMDD 형식 문자열
 */
function formatDateForFilename(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * CSV 내보내기 데이터 행
 */
interface RoomAssignmentRow {
    roomNumber: string;
    floor: number;
    roomType: string;
    capacity: number;
    gender: string;
    guestName: string;
    guestCompany: string;
    status: string;
}

/**
 * 객실 정보 맵
 */
interface RoomDataMap {
    [roomNumber: string]: RoomInfo;
}

/**
 * 객실 배정 데이터를 CSV로 내보내기
 * @param roomGuests - 객실별 게스트 데이터
 * @param roomData - 객실 정보 데이터
 */
export function exportRoomAssignmentsToCSV(
    roomGuests: RoomGuestsMap,
    roomData: RoomDataMap
): void {
    const data: RoomAssignmentRow[] = [];

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
                status: '빈 방'
            });
        } else {
            guests.forEach((guest, idx) => {
                data.push({
                    roomNumber,
                    floor: room.floor,
                    roomType: room.roomType,
                    capacity: room.capacity,
                    gender: room.gender === 'M' ? '남성' : '여성',
                    guestName: guest.name,
                    guestCompany: guest.company || '',
                    status: idx === 0 && guests.length < room.capacity ? '일부 배정' : '배정 완료'
                });
            });
        }
    }

    // 층, 호수 순으로 정렬
    data.sort((a, b) => {
        if (a.floor !== b.floor) return a.floor - b.floor;
        return a.roomNumber.localeCompare(b.roomNumber);
    });

    const columns: CSVColumn[] = [
        { key: 'roomNumber', label: '객실번호' },
        { key: 'floor', label: '층' },
        { key: 'roomType', label: '객실타입' },
        { key: 'capacity', label: '정원' },
        { key: 'gender', label: '성별' },
        { key: 'guestName', label: '투숙객' },
        { key: 'guestCompany', label: '소속' },
        { key: 'status', label: '상태' }
    ];

    const csv = arrayToCSV(data as Record<string, unknown>[], columns);
    downloadCSV(csv, '객실배정현황');
}

