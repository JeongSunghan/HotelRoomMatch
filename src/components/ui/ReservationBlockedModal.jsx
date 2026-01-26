/**
 * 예약 중인 객실 클릭 시 표시되는 모달
 * 다른 사용자가 선택 중이거나 룸메이트 초대 대기 중임을 안내
 */
import { useState, useEffect } from 'react';
import { RESERVATION_TYPE } from '../../firebase/index';

export default function ReservationBlockedModal({ reservation, onClose }) {
    // 실시간 타이머 상태
    const [timeLeft, setTimeLeft] = useState(0);

    const isRoommateInvite = reservation?.type === RESERVATION_TYPE.ROOMMATE_INVITE;

    useEffect(() => {
        if (!reservation) return;

        // 초기 남은 시간 계산
        const calculateTimeLeft = () => {
            return Math.max(0, Math.ceil((reservation.expiresAt - Date.now()) / 1000));
        };

        setTimeLeft(calculateTimeLeft());

        // 1초마다 갱신
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                // 만료되면 모달 닫기 (또는 상위에서 처리)
                onClose();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [reservation, onClose]);

    if (!reservation) return null;

    const remainingMinutes = Math.floor(timeLeft / 60);
    const remainingSecs = timeLeft % 60;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-sm text-center">
                {/* 아이콘 */}
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🚫</span>
                </div>

                {/* 제목 */}
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    현재 예약 진행 중
                </h2>

                {/* 설명 */}
                <p className="text-gray-600 text-sm mb-4">
                    {isRoommateInvite ? (
                        <>
                            다른 사용자가 <strong>룸메이트를 초대</strong> 중입니다.
                            <br />
                            초대가 완료되거나 만료될 때까지 기다려주세요.
                        </>
                    ) : (
                        <>
                            다른 사용자가 <strong>객실을 선택하는 중</strong>입니다.
                            <br />
                            잠시 후 다시 시도해주세요.
                        </>
                    )}
                </p>

                {/* 남은 시간 */}
                <div className="bg-gray-50 rounded-lg p-3 mb-5">
                    <p className="text-xs text-gray-500 mb-1">예상 대기 시간</p>
                    <p className="text-lg font-bold text-orange-600">
                        {remainingMinutes > 0 ? `${remainingMinutes}분 ` : ''}{remainingSecs}초
                    </p>
                </div>

                {/* 예약자 정보 (옵션) */}
                {reservation.userName && (
                    <p className="text-xs text-gray-400 mb-4">
                        예약자: {reservation.userName}님
                    </p>
                )}

                {/* 확인 버튼 */}
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                    확인
                </button>
            </div>
        </div>
    );
}
