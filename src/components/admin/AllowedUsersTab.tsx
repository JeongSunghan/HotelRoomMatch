import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import {
    subscribeToAllowedUsers,
    addAllowedUser,
    removeAllowedUser,
    bulkAddAllowedUsers,
    clearAllAllowedUsers
} from '../../firebase/index';
import type { AllowedUser } from '../../types';

interface UserForm {
    name: string;
    email: string;
    company: string;
}

interface CsvResult {
    success: number;
    failed: number;
}

type SortBy = 'name' | 'company' | 'status';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'registered' | 'pending';

/**
 * 사전등록 유저 관리 탭 (관리자용)
 */
export default function AllowedUsersTab() {
    const [users, setUsers] = useState<AllowedUser[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
    const [newUser, setNewUser] = useState<UserForm>({ name: '', email: '', company: '' });
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [csvData, setCsvData] = useState<string>('');
    const [csvResult, setCsvResult] = useState<CsvResult | null>(null);

    // 정렬 및 필터 상태
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // 실시간 구독
    useEffect(() => {
        const unsubscribe = subscribeToAllowedUsers((allUsers: AllowedUser[]) => {
            setUsers(allUsers);
        });
        return () => unsubscribe();
    }, []);

    // 검색, 필터, 정렬 적용
    const filteredUsers = useMemo(() => {
        let result = users.filter((user: AllowedUser) => {
            // 검색 필터
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query ||
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.company?.toLowerCase().includes(query);

            // 상태 필터
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'registered' && user.registered) ||
                (statusFilter === 'pending' && !user.registered);

            return matchesSearch && matchesStatus;
        });

        // 정렬
        result.sort((a: AllowedUser, b: AllowedUser) => {
            let valueA: string | number;
            let valueB: string | number;

            if (sortBy === 'name') {
                valueA = a.name || '';
                valueB = b.name || '';
            } else if (sortBy === 'company') {
                valueA = a.company || '';
                valueB = b.company || '';
            } else if (sortBy === 'status') {
                valueA = a.registered ? 1 : 0;
                valueB = b.registered ? 1 : 0;
            } else {
                valueA = '';
                valueB = '';
            }

            if (typeof valueA === 'string') {
                const comparison = valueA.localeCompare(valueB as string, 'ko');
                return sortOrder === 'asc' ? comparison : -comparison;
            }
            return sortOrder === 'asc' ? (valueA as number) - (valueB as number) : (valueB as number) - (valueA as number);
        });

        return result;
    }, [users, searchQuery, sortBy, sortOrder, statusFilter]);

    // 통계
    const stats = useMemo(() => ({
        total: users.length,
        registered: users.filter(u => u.registered).length,
        pending: users.filter(u => !u.registered).length
    }), [users]);

    // 이메일 유효성 검사
    const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // 유저 추가
    const handleAddUser = async (): Promise<void> => {
        if (!newUser.name.trim() || !newUser.email.trim()) return;
        if (!isValidEmail(newUser.email)) {
            alert('유효한 이메일 형식이 아닙니다.');
            return;
        }

        setIsAdding(true);
        try {
            await addAllowedUser(newUser);
            setNewUser({ name: '', email: '', company: '' });
            setShowAddModal(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert('추가 실패: ' + errorMessage);
        } finally {
            setIsAdding(false);
        }
    };

    // 유저 삭제
    const handleRemoveUser = async (userId: string, userName: string): Promise<void> => {
        if (!window.confirm(`${userName}님을 사전등록 목록에서 삭제하시겠습니까?`)) return;

        try {
            await removeAllowedUser(userId);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert('삭제 실패: ' + errorMessage);
        }
    };

    // CSV 파싱 (쉼표 또는 탭 지원)
    const parseCSV = (text: string): UserForm[] => {
        const lines = text.trim().split(/\r?\n/);
        const parsedUsers: UserForm[] = [];

        // 구분자 자동 감지 (첫 데이터 줄 기준)
        const firstDataLine = lines.find((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return false;
            if (i === 0 && (trimmed.includes('이름') || trimmed.toLowerCase().includes('name'))) return false;
            return true;
        }) || lines[0];
        const delimiter = firstDataLine.includes('\t') ? '\t' : ',';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // 헤더 스킵 (이름, name 포함)
            if (i === 0 && (line.includes('이름') || line.toLowerCase().includes('name'))) {
                continue;
            }

            const parts = line.split(delimiter).map(p => p.trim().replace(/"/g, ''));
            if (parts.length >= 2) {
                parsedUsers.push({
                    name: parts[0],
                    email: parts[1],
                    company: parts[2] || ''
                });
            }
        }

        return parsedUsers;
    };

    // CSV 업로드
    const handleCsvUpload = async (): Promise<void> => {
        const parsedUsers = parseCSV(csvData);

        if (parsedUsers.length === 0) {
            alert('업로드할 유저가 없습니다.');
            return;
        }

        const result = await bulkAddAllowedUsers(parsedUsers);
        setCsvResult(result);
    };

    // 전체 삭제
    const handleClearAll = async (): Promise<void> => {
        if (!window.confirm('⚠️ 정말로 모든 사전등록 유저를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) return;
        if (!window.confirm('⚠️ 마지막 확인: 정말 삭제하시겠습니까?')) return;

        try {
            await clearAllAllowedUsers();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert('삭제 실패: ' + errorMessage);
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    placeholder="이름, 이메일, 회사로 검색..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            {/* 정렬 및 필터 */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* 상태 필터 */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 ${statusFilter === 'all' ? 'bg-slate-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        전체 ({stats.total})
                    </button>
                    <button
                        onClick={() => setStatusFilter('registered')}
                        className={`px-3 py-1.5 border-l ${statusFilter === 'registered' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        등록 ({stats.registered})
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-3 py-1.5 border-l ${statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        대기 ({stats.pending})
                    </button>
                </div>

                {/* 정렬 */}
                <select
                    value={sortBy}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortBy)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="name">이름순</option>
                    <option value="company">소속순</option>
                    <option value="status">상태순</option>
                </select>
                <button
                    onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50"
                    title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
                >
                    {sortOrder === 'asc' ? '↑ 오름' : '↓ 내림'}
                </button>

                <span className="text-sm text-gray-500 ml-auto">
                    {filteredUsers.length}명 표시
                </span>
            </div>

            {/* 유저 목록 */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">이름</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">이메일</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">소속</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">상태</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                    {searchQuery ? '검색 결과가 없습니다.' : '사전등록 유저가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user: AllowedUser) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
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
                                        {user.id && (
                                            <button
                                                onClick={() => handleRemoveUser(user.id!, user.name)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                삭제
                                            </button>
                                        )}
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
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="홍길동"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">소속 (선택)</label>
                                <input
                                    type="text"
                                    value={newUser.company}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, company: e.target.value })}
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
                                disabled={!newUser.name.trim() || !newUser.email.trim() || isAdding}
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
                            <p className="text-blue-600 text-xs mt-1">이름, 이메일, 소속(선택) - 쉼표 또는 탭으로 구분</p>
                            <p className="text-blue-500 text-xs">엑셀에서 복사하면 탭으로 자동 인식됩니다.</p>
                        </div>

                        <textarea
                            value={csvData}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCsvData(e.target.value)}
                            placeholder="이름,이메일,소속&#10;홍길동,hero@example.com,ABC회사&#10;김철수,chulsoo@test.com,XYZ기업"
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

