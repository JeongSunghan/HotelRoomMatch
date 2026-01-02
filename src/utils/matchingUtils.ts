/**
 * 룸메이트 매칭 적합성 검사 유틸리티
 */
import type { SnoringLevel } from '../types';

/**
 * 호환성 검사를 위한 사용자 데이터 (부분 타입)
 */
interface UserForCompatibility {
    age?: number;
    ageTolerance?: number;
    snoring?: SnoringLevel;
}

/**
 * 두 유저 간의 적합성을 검사하고 경고 목록을 반환합니다.
 * @param me - 현재 로그인한 유저
 * @param roommate - 방에 있는 기존 유저
 * @returns 경고 메시지 목록 (없으면 빈 배열)
 */
export function checkCompatibility(
    me: UserForCompatibility,
    roommate: UserForCompatibility
): string[] {
    const warnings: string[] = [];

    // 1. 나이 차이 검증
    if (me.age && roommate.age) {
        const ageDiff = Math.abs(me.age - roommate.age);
        const myTolerance = me.ageTolerance || 5; // 기본값 5

        // 상대방의 허용 범위는 알 수 없거나 DB에 없을 수 있으므로 내 허용 범위만 체크
        // (원래는 상대방의 허용 범위도 체크해야 하지만, 데이터가 없을 수 있음)

        if (ageDiff > myTolerance) {
            warnings.push(`룸메이트와 나이 차이가 ${ageDiff}살입니다. (내 허용 범위: ±${myTolerance}살)`);
        }
    }

    // 2. 코골이 검증
    // snoring values: 'no' (없음), 'sometimes' (가끔), 'yes' (자주)

    // 상대방이 코를 심하게 고는 경우 - 나는 '가끔' 또는 '없음'일 때 경고
    if (roommate.snoring === 'yes' && (me.snoring === 'no' || me.snoring === 'sometimes')) {
        warnings.push('룸메이트가 "코골이 심함" 상태입니다.');
    } else if (roommate.snoring === 'sometimes' && me.snoring === 'no') {
        // 상대는 가끔, 나는 예민(없음) 할 때
        warnings.push('룸메이트가 코를 가끔 곯습니다.');
    }

    // 내가 코를 심하게 고는 경우 - 상대가 '가끔' 또는 '없음'일 때 경고
    if (me.snoring === 'yes' && (roommate.snoring === 'no' || roommate.snoring === 'sometimes')) {
        warnings.push('본인의 코골이 성향(심함)으로 인해 룸메이트가 불편해할 수 있습니다.');
    }

    return warnings;
}

