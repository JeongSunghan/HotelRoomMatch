/**
 * Firebase 1:1 문의 관련 모듈
 */
import { database, ref, onValue, set, update, get } from './config';
import type { Inquiry } from '../types';

/**
 * 문의 생성
 */
export async function createInquiry(data: {
    sessionId?: string;
    userName?: string;
    email?: string;
    subject: string;
    message: string;
}): Promise<Inquiry | null> {
    if (!database) return null;

    const id = Date.now().toString();
    const inquiryRef = ref(database, `inquiries/${id}`);

    const inquiry: Inquiry = {
        id,
        ...data,
        createdAt: Date.now(),
        replied: false
    };

    await set(inquiryRef, inquiry);
    return inquiry;
}

/**
 * 모든 문의 구독 (관리자용)
 * 최적화: 변경사항이 있을 때만 콜백 호출
 */
export function subscribeToInquiries(callback: (inquiries: Inquiry[]) => void): () => void {
    if (!database) {
        callback([]);
        return () => { };
    }

    const inquiriesRef = ref(database, 'inquiries');
    
    // 이전 결과를 저장하여 불필요한 업데이트 방지 (최적화)
    let lastInquiries: Inquiry[] | null = null;

    const unsubscribe = onValue(inquiriesRef, (snapshot) => {
        const data = snapshot.val() as Record<string, Inquiry> | null || {};
        const list = Object.values(data).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // 변경사항이 있을 때만 콜백 호출 (최적화)
        if (!lastInquiries || 
            lastInquiries.length !== list.length ||
            JSON.stringify(lastInquiries.map(i => i.id)) !== JSON.stringify(list.map(i => i.id))) {
            lastInquiries = list;
            callback(list);
        }
    });

    return unsubscribe;
}

/**
 * 내 문의 조회 (세션 ID 기준)
 */
export async function getMyInquiries(sessionId: string): Promise<Inquiry[]> {
    if (!database || !sessionId) return [];

    // 인덱싱 없이 전체 조회 후 필터링 (데이터 양이 적으므로 가능)
    // 추후 데이터가 많아지면 query/orderByChild 적용 필요
    const inquiriesRef = ref(database, 'inquiries');
    const snapshot = await get(inquiriesRef);
    const data = snapshot.val() as Record<string, Inquiry> | null || {};

    return Object.values(data)
        .filter(item => item.userId === sessionId)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * 문의 답변 등록 (관리자)
 */
export async function replyToInquiry(inquiryId: string, replyContent: string): Promise<boolean> {
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
export async function deleteInquiry(inquiryId: string): Promise<boolean> {
    if (!database) return false;

    const inquiryRef = ref(database, `inquiries/${inquiryId}`);
    await set(inquiryRef, null);

    return true;
}

