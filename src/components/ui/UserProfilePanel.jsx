import { getGenderLabel } from '../../utils/genderUtils';

/**
 * User Profile 영역
 * - Room Assignment 영역과 분리하여 "내 정보"와 "배정 현황"을 명확히 보여준다.
 * - 모바일: 상단(세로)
 * - 데스크탑: 좌측(2열)
 */
export default function UserProfilePanel({
    user,
    isRegistered,
    onRegisterClick,
    onOpenMyRoom,
}) {
    // 미등록 사용자
    if (!isRegistered) {
        return (
            <section className="card-white rounded-xl p-6">
                <div className="text-center">
                    <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">객실 배정 등록</h2>
                    <p className="text-gray-500 text-sm mb-4">
                        객실 배정을 위해 정보를 입력해주세요.
                    </p>
                    <button
                        onClick={onRegisterClick}
                        className="w-full px-6 py-2.5 btn-primary rounded-lg font-medium text-sm"
                    >
                        등록하기
                    </button>
                </div>
            </section>
        );
    }

    // 등록 사용자
    const isLocked = !!user?.locked;
    const gender = user?.gender;
    const genderLabel = gender ? getGenderLabel(gender) : '미입력';
    const singleRoomLabel = user?.singleRoom === 'Y' ? 'Y' : 'N';

    return (
        <section className="card-white rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">User Profile</h2>
                {isLocked ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        ✓ 배정 완료
                    </span>
                ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        ○ 선택 가능
                    </span>
                )}
            </div>

            {/* 프로필 카드 */}
            <div className={`rounded-xl p-4 border-2 ${gender === 'M'
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                : 'bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                        }`}>
                        {gender === 'M' ? '♂' : '♀'}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-lg truncate">{user?.name || '익명'}</p>
                        <p className="text-sm text-gray-600 truncate">
                            {user?.company || '-'}{user?.position ? ` · ${user.position}` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gender === 'M' ? 'bg-blue-200 text-blue-700' : 'bg-pink-200 text-pink-700'
                                }`}>
                                {genderLabel}
                            </span>
                            {user?.age && <span className="text-xs text-gray-500">{user.age}세</span>}
                            <span className="text-xs text-gray-500">1인실: {singleRoomLabel}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 배정 정보 */}
            {isLocked ? (
                <div className="space-y-3">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-sm text-emerald-800 font-semibold">배정 객실</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{user?.selectedRoom}호</p>
                        <p className="text-xs text-emerald-700 mt-1">내 방 정보를 확인하거나 취소/변경 요청을 보낼 수 있습니다.</p>
                    </div>
                    <button
                        onClick={onOpenMyRoom}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                    >
                        내 방 보기
                    </button>
                </div>
            ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700 font-semibold">안내</p>
                    <p className="text-xs text-slate-600 mt-1">
                        우측 객실 배정 영역에서 객실을 선택하세요.
                    </p>
                </div>
            )}
        </section>
    );
}

