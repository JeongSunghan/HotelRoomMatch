import { useState, useEffect } from 'react';
import {
    subscribeToAllowedUsers,
    addAllowedUser,
    removeAllowedUser,
    bulkAddAllowedUsers,
    clearAllAllowedUsers
} from '../../firebase/index';

/**
 * 사전등록 유저 관리 탭 (관리자용)
 */
export default function AllowedUsersTab() {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', phone: '', company: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [csvData, setCsvData] = useState('');
    const [csvResult, setCsvResult] = useState(null);

    // 실시간 구독
    useEffect(() => {
        const unsubscribe = subscribeToAllowedUsers(setUsers);
        return () => unsubscribe();
    }, []);

    // 검색 필터
    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.name?.toLowerCase().includes(query) ||
            user.phone?.includes(query) ||
            user.company?.toLowerCase().includes(query)
        );
    });

    // 통계
    const stats = {
        total: users.length,
        registered: users.filter(u => u.registered).length,
        pending: users.filter(u => !u.registered).length
    };

    // 전화번호 포맷
    const formatPhone = (phone) => {
        if (!phone) return '-';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
        }
        return phone;
    };

    // 유저 추가
    const handleAddUser = async () => {
        if (!newUser.name.trim() || !newUser.phone.trim()) return;

        setIsAdding(true);
        try {
            await addAllowedUser(newUser);
            setNewUser({ name: '', phone: '', company: '' });
            setShowAddModal(false);
        } catch (error) {
            alert('추가 실패: ' + error.message);
        } finally {
            setIsAdding(false);
        }
    };

    // 유저 삭제
    const handleRemoveUser = async (userId, userName) => {
        if (!confirm(`${userName}님을 사전등록 목록에서 삭제하시겠습니까?`)) return;

        try {
            await removeAllowedUser(userId);
        } catch (error) {
            alert('삭제 실패: ' + error.message);
        }
    };

    // CSV 파싱
    const parseCSV = (text) => {
        const lines = text.trim().split(/\r?\n/);
        const users = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // 헤더 스킵 (이름, name 포함)
            if (i === 0 && (line.includes('이름') || line.toLowerCase().includes('name'))) {
                continue;
            }

            const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
            if (parts.length >= 2) {
                users.push({
                    name: parts[0],
                    phone: parts[1],
                    company: parts[2] || ''
                });
            }
        }

        return users;
    };

    // CSV 업로드
    const handleCsvUpload = async () => {
        const parsedUsers = parseCSV(csvData);

        if (parsedUsers.length === 0) {
            alert('업로드할 유저가 없습니다.');
            return;
        }

        const result = await bulkAddAllowedUsers(parsedUsers);
        setCsvResult(result);
    };

    // 전체 삭제
    const handleClearAll = async () => {
        if (!confirm('⚠️ 정말로 모든 사전등록 유저를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) return;
        if (!confirm('⚠️ 마지막 확인: 정말 삭제하시겠습니까?')) return;

        try {
            await clearAllAllowedUsers();
        } catch (error) {
            alert('삭제 실패: ' + error.message);
        }
    };

    return (
        <div className="space-y-4">
            {/* 통계 카드 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                    <p className="text-sm text-gray-500">전체</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.registered}</p>
                    <p className="text-sm text-gray-500">등록 완료</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-amber-200 text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                    <p className="text-sm text-gray-500">미등록</p>
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
                >
                    ➕ 개별 추가
                </button>
                <button
                    onClick={() => setShowCsvModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
                >
                    📤 CSV 업로드
                </button>
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm"
                >
                    🗑️ 전체 삭제
                </button>
            </div>

            {/* 검색 */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이름, 휴대폰, 회사로 검색..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            {/* 유저 목록 */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">이름</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">휴대폰</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">소속</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">상태</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                                    {searchQuery ? '검색 결과가 없습니다.' : '사전등록 유저가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{formatPhone(user.phone)}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.company || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        {user.registered ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                등록완료
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                                                대기
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleRemoveUser(user.id, user.name)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 개별 추가 모달 */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">사전등록 유저 추가</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="홍길동"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 번호 *</label>
                                <input
                                    type="tel"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="010-1234-5678"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">소속 (선택)</label>
                                <input
                                    type="text"
                                    value={newUser.company}
                                    onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="회사명"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={!newUser.name.trim() || !newUser.phone.trim() || isAdding}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {isAdding ? '추가 중...' : '추가'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV 업로드 모달 */}
            {showCsvModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-bold mb-4">CSV 일괄 업로드</h3>

                        <div className="info-box mb-4">
                            <p className="text-blue-700 text-sm font-medium">📋 CSV 형식</p>
                            <p className="text-blue-600 text-xs mt-1">이름,휴대폰번호,소속(선택)</p>
                            <p className="text-blue-500 text-xs">예: 홍길동,01012345678,ABC회사</p>
                        </div>

                        <textarea
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder="이름,휴대폰번호,소속&#10;홍길동,01012345678,ABC회사&#10;김철수,01098765432,XYZ기업"
                            className="w-full h-40 px-3 py-2 border rounded-lg text-sm font-mono"
                        />

                        {csvResult && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700 text-sm">
                                    ✅ 성공: {csvResult.success}명 / ❌ 실패: {csvResult.failed}명
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCsvModal(false);
                                    setCsvData('');
                                    setCsvResult(null);
                                }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg"
                            >
                                닫기
                            </button>
                            <button
                                onClick={handleCsvUpload}
                                disabled={!csvData.trim()}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                            >
                                업로드
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
