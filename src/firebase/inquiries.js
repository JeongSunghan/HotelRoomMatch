
/**
 * Firebase 1:1 문의 관련 모듈
 */
import { database, ref, onValue, set, update, get } from './config';

/**
 * 문의 생성
 */
export async function createInquiry(data) {
    if (!database) return null;

    const id = Date.now().toString();
    const inquiryRef = ref(database, `inquiries/${id}`);

    const inquiry = {
        id,
        ...data,
        status: 'pending', // pending, replied
        createdAt: Date.now(),
        reply: null,
        replyAt: null
    };

    await set(inquiryRef, inquiry);
    return inquiry;
}

/**
 * 모든 문의 구독 (관리자용)
 */
export function subscribeToInquiries(callback) {
    if (!database) {
        callback([]);
        return () => { };
    }

    const inquiriesRef = ref(database, 'inquiries');
    const unsubscribe = onValue(inquiriesRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.values(data).sort((a, b) => b.createdAt - a.createdAt);
        callback(list);
    });

    return unsubscribe;
}

/**
 * 내 문의 조회 (세션 ID 기준)
 */
export async function getMyInquiries(sessionId) {
    if (!database || !sessionId) return [];

    // 인덱싱 없이 전체 조회 후 필터링 (데이터 양이 적으므로 가능)
    // 추후 데이터가 많아지면 query/orderByChild 적용 필요
    const inquiriesRef = ref(database, 'inquiries');
    const snapshot = await get(inquiriesRef);
    const data = snapshot.val() || {};

    return Object.values(data)
        .filter(item => item.sessionId === sessionId)
        .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * 문의 답변 등록 (관리자)
 */
export async function replyToInquiry(inquiryId, replyContent) {
    if (!database) return false;

    const inquiryRef = ref(database, `inquiries/${inquiryId}`);
    await update(inquiryRef, {
        reply: replyContent,
        status: 'replied',
        replyAt: Date.now()
    });

    return true;
}

/**
 * 문의 삭제
 */
export async function deleteInquiry(inquiryId) {
    if (!database) return false;

    const inquiryRef = ref(database, `inquiries/${inquiryId}`);
    await set(inquiryRef, null);

    return true;
}
