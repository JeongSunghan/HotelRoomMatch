/**
 * PHASE 3 (Case 2)
 * reserved 객실 클릭 시 "남은 시간"을 보여주는 안내 모달
 *
 * 왜: toast는 순간적으로 사라져 사용자가 맥락을 놓치기 쉬워,
 *     임시 예약(reserved) 상태에서는 잔여 시간을 명확히 안내한다.
 */
import { useEffect, useMemo, useState } from 'react';

export default function ReservedRedirectModal({ roomNumber, expiresAt, onClose }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 500);
        return () => clearInterval(t);
    }, []);

    const remainingSec = useMemo(() => {
        const exp = Number(expiresAt);
        if (!Number.isFinite(exp)) return null;
        return Math.max(0, Math.ceil((exp - now) / 1000));
    }, [expiresAt, now]);

    const isExpired = remainingSec === 0;

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⏳</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                    다른 사용자가 선택 중입니다
                </h2>
                <p className="text-gray-600 mb-6">
                    <strong>{roomNumber}호</strong>는 현재 다른 사용자가 선택 중입니다.
                    <br />
                    {remainingSec === null ? (
                        <span className="text-sm text-gray-500">잠시 후 다시 시도해주세요.</span>
                    ) : isExpired ? (
                        <span className="text-sm text-emerald-700 font-semibold">이제 다시 시도할 수 있어요.</span>
                    ) : (
                        <span className="text-sm text-amber-700 font-semibold">
                            남은 시간: {remainingSec}초
                        </span>
                    )}
                </p>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                    {isExpired ? '확인 (다시 선택 가능)' : '확인'}
                </button>
            </div>
        </div>
    );
}

