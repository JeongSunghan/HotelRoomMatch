/**
 * 헤더 컴포넌트 - 화이트 스타일 (수정됨)
 */
export default function Header({ stats }) {
    return (
        <header className="card-white rounded-xl p-6 mb-6">
            {/* 타이틀 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold gradient-text">
                        V-Up 호텔 객실 배정
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        KVCA 벤처투자 전문인력 양성(V-Up)
                    </p>
                </div>
            </div>

            {/* 통계 */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-blue-600">{stats.male?.occupiedSlots || 0}</p>
                        <p className="text-xs text-gray-500">남성 배정</p>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-blue-400">{stats.male?.availableSlots || 0}</p>
                        <p className="text-xs text-gray-500">남성 잔여</p>
                    </div>
                    <div className="bg-pink-50 border border-pink-100 rounded-lg p-3 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-pink-600">{stats.female?.occupiedSlots || 0}</p>
                        <p className="text-xs text-gray-500">여성 배정</p>
                    </div>
                    <div className="bg-pink-50/50 border border-pink-100 rounded-lg p-3 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-pink-400">{stats.female?.availableSlots || 0}</p>
                        <p className="text-xs text-gray-500">여성 잔여</p>
                    </div>
                </div>
            )}
        </header>
    );
}
