import { useState, useEffect, useMemo } from 'react';
import {
    subscribeToAllowedUsers,
    addAllowedUser,
    updateAllowedUser,
    removeAllowedUser,
    bulkRemoveAllowedUsers,
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
    const [editingUser, setEditingUser] = useState(null);
    const [editUserForm, setEditUserForm] = useState({ name: '', email: '', company: '', position: '', singleRoom: 'N', gender: '' });
    const [newUser, setNewUser] = useState({ name: '', email: '', company: '', position: '', singleRoom: 'N', gender: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [csvData, setCsvData] = useState('');
    const [csvResult, setCsvResult] = useState(null);
    const [selectedIds, setSelectedIds] = useState(() => new Set());

    // 정렬 및 필터 상태
    const [sortBy, setSortBy] = useState('name'); // 'name', 'company', 'status'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'registered', 'pending'

    // 실시간 구독
    useEffect(() => {
        const unsubscribe = subscribeToAllowedUsers(setUsers);
        return () => unsubscribe();
    }, []);

    // 검색, 필터, 정렬 적용
    const filteredUsers = useMemo(() => {
        let result = users.filter(user => {
            // 검색 필터
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query ||
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.company?.toLowerCase().includes(query) ||
                user.position?.toLowerCase().includes(query);

            // 상태 필터
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'registered' && user.registered) ||
                (statusFilter === 'pending' && !user.registered);

            return matchesSearch && matchesStatus;
        });

        // 정렬
        result.sort((a, b) => {
            let valueA, valueB;

            if (sortBy === 'name') {
                valueA = a.name || '';
                valueB = b.name || '';
            } else if (sortBy === 'company') {
                valueA = a.company || '';
                valueB = b.company || '';
            } else if (sortBy === 'status') {
                valueA = a.registered ? 1 : 0;
                valueB = b.registered ? 1 : 0;
            }

            if (typeof valueA === 'string') {
                const comparison = valueA.localeCompare(valueB, 'ko');
                return sortOrder === 'asc' ? comparison : -comparison;
            }
            return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        });

        return result;
    }, [users, searchQuery, sortBy, sortOrder, statusFilter]);

    // 통계
    const stats = {
        total: users.length,
        registered: users.filter(u => u.registered).length,
        pending: users.filter(u => !u.registered).length
    };

    // 이메일 유효성 검사
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // 유저 추가
    const handleAddUser = async () => {
        if (!newUser.name.trim() || !newUser.email.trim()) return;
        if (!isValidEmail(newUser.email)) {
            alert('유효한 이메일 형식이 아닙니다.');
            return;
        }
        if (!newUser.gender) {
            alert('성별을 선택해주세요.');
            return;
        }

        setIsAdding(true);
        try {
            await addAllowedUser(newUser);
            setNewUser({ name: '', email: '', company: '', position: '', singleRoom: 'N', gender: '' });
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

    // 다중 선택 토글
    const toggleSelect = (userId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const isAllFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id));

    const toggleSelectAllFiltered = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => next.has(u.id));
            if (allSelected) {
                filteredUsers.forEach(u => next.delete(u.id));
            } else {
                filteredUsers.forEach(u => next.add(u.id));
            }
            return next;
        });
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        const ok = confirm(
            `선택한 ${ids.length}명을 사전등록 목록에서 삭제하시겠습니까?\n\n` +
            `삭제 후에는 해당 이메일로 로그인할 수 없습니다.`
        );
        if (!ok) return;

        setIsAdding(true);
        try {
            const result = await bulkRemoveAllowedUsers(ids);
            clearSelection();
            alert(`삭제 완료: ${result.success}명 / 실패: ${result.failed}명`);
        } catch (error) {
            alert('선택 삭제 실패: ' + (error?.message || String(error)));
        } finally {
            setIsAdding(false);
        }
    };

    // 유저 편집 시작
    const handleEditUser = (user) => {
        setEditingUser(user);
        setEditUserForm({
            name: user.name || '',
            email: user.email || '',
            company: user.company || '',
            position: user.position || '',
            singleRoom: user.singleRoom || 'N',
            gender: user.gender || ''
        });
    };

    // 유저 편집 저장
    const handleSaveEditUser = async () => {
        if (!editingUser) return;
        if (!editUserForm.name.trim() || !editUserForm.email.trim()) {
            alert('이름과 이메일은 필수입니다.');
            return;
        }
        if (!isValidEmail(editUserForm.email)) {
            alert('유효한 이메일 형식이 아닙니다.');
            return;
        }
        if (!editUserForm.gender) {
            alert('성별을 선택해주세요.');
            return;
        }

        setIsAdding(true);
        try {
            await updateAllowedUser(editingUser.id, {
                name: editUserForm.name,
                email: editUserForm.email,
                company: editUserForm.company,
                position: editUserForm.position,
                singleRoom: editUserForm.singleRoom,
                gender: editUserForm.gender
            });
            setEditingUser(null);
        } catch (error) {
            alert('수정 실패: ' + error.message);
        } finally {
            setIsAdding(false);
        }
    };

            // CSV 파싱 (쉼표 또는 탭 지원)
    const parseCSV = (text) => {
        const lines = text.trim().split(/\r?\n/);
        const users = [];

        // 구분자 자동 감지 (첫 데이터 줄 기준)
        const firstDataLine = lines.find((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return false;
            // 헤더일 수 있는 라인은 제외
            if (i === 0 && (
                trimmed.includes('이름') ||
                trimmed.includes('성명') ||
                trimmed.toLowerCase().includes('name') ||
                trimmed.includes('이메일') ||
                trimmed.toLowerCase().includes('email') ||
                trimmed.includes('소속') ||
                trimmed.includes('직위') ||
                trimmed.includes('1인실') ||
                trimmed.includes('성별')
            )) return false;
            return true;
        }) || lines[0];
        const delimiter = firstDataLine.includes('\t') ? '\t' : ',';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // 헤더 스킵 (output.json/엑셀 헤더 포함)
            if (i === 0 && (
                line.includes('이름') ||
                line.includes('성명') ||
                line.toLowerCase().includes('name') ||
                line.includes('이메일') ||
                line.toLowerCase().includes('email') ||
                line.includes('소속') ||
                line.includes('직위') ||
                line.includes('1인실') ||
                line.includes('성별')
            )) {
                continue;
            }

            const parts = line.split(delimiter).map(p => p.trim().replace(/"/g, ''));

            // 지원 포맷 1) 기존: 이름, 이메일, 소속(선택)
            if (parts.length >= 2 && parts.length < 6) {
                users.push({
                    name: parts[0],
                    email: parts[1],
                    company: parts[2] || '',
                    position: parts[3] || '',
                    singleRoom: parts[4] || 'N',
                    gender: parts[5] || ''
                });
                continue;
            }

            // 지원 포맷 2) output.json/엑셀: 소속명, 성명, 직위, 이메일, 1인실 여부, 성별
            if (parts.length >= 6) {
                users.push({
                    company: parts[0] || '',
                    name: parts[1] || '',
                    position: parts[2] || '',
                    email: parts[3] || '',
                    singleRoom: parts[4] || 'N',
                    gender: parts[5] || ''
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
                    onClick={handleBulkDelete}
                    disabled={selectedIds.size === 0 || isAdding}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                    title={selectedIds.size === 0 ? '삭제할 대상을 선택하세요' : '선택한 항목을 일괄 삭제합니다'}
                >
                    🧹 선택 삭제 ({selectedIds.size})
                </button>
                <button
                    onClick={clearSelection}
                    disabled={selectedIds.size === 0}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm disabled:opacity-50"
                >
                    선택 해제
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
                    onChange={(e) => setSortBy(e.target.value)}
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
                            <th className="px-4 py-3 text-center font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={isAllFilteredSelected}
                                    onChange={toggleSelectAllFiltered}
                                    aria-label="현재 목록 전체 선택"
                                />
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">소속</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">성명</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">직위</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">이메일</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">1인실</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">성별</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">상태</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                                    {searchQuery ? '검색 결과가 없습니다.' : '사전등록 유저가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(user.id)}
                                            onChange={() => toggleSelect(user.id)}
                                            aria-label={`${user.name} 선택`}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{user.company || '-'}</td>
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.position || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.singleRoom === 'Y' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {user.singleRoom === 'Y' ? 'Y' : 'N'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                            {user.gender || '-'}
                                        </span>
                                    </td>
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
                                            onClick={() => handleEditUser(user)}
                                            className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                                        >
                                            편집
                                        </button>
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

            {/* 편집 모달 */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-1">사전등록 유저 수정</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {editingUser.registered
                                ? '⚠️ 등록 완료 유저는 이메일 변경이 제한됩니다.'
                                : '이메일을 변경하면 Key가 바뀌어 새로 저장됩니다.'}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    value={editUserForm.name}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                                <input
                                    type="text"
                                    value={editUserForm.company}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, company: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">직위</label>
                                <input
                                    type="text"
                                    value={editUserForm.position}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, position: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                                <input
                                    type="email"
                                    value={editUserForm.email}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    disabled={!!editingUser.registered}
                                />
                                {editingUser.registered && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        등록 완료된 유저는 이메일 변경이 불가합니다.
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">1인실 여부</label>
                                    <select
                                        value={editUserForm.singleRoom}
                                        onChange={(e) => setEditUserForm({ ...editUserForm, singleRoom: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="N">N</option>
                                        <option value="Y">Y</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">성별 *</label>
                                    <select
                                        value={editUserForm.gender}
                                        onChange={(e) => setEditUserForm({ ...editUserForm, gender: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">선택</option>
                                        <option value="M">M</option>
                                        <option value="F">F</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveEditUser}
                                disabled={isAdding}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {isAdding ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                                <input
                                    type="text"
                                    value={newUser.company}
                                    onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="회사명"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">직위</label>
                                <input
                                    type="text"
                                    value={newUser.position}
                                    onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="매니저"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">1인실 여부</label>
                                    <select
                                        value={newUser.singleRoom}
                                        onChange={(e) => setNewUser({ ...newUser, singleRoom: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="N">N</option>
                                        <option value="Y">Y</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">성별 *</label>
                                    <select
                                        value={newUser.gender}
                                        onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">선택</option>
                                        <option value="M">M</option>
                                        <option value="F">F</option>
                                    </select>
                                </div>
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
                                disabled={!newUser.name.trim() || !newUser.email.trim() || !newUser.gender || isAdding}
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
                            <p className="text-blue-600 text-xs mt-1">소속명, 성명, 직위, 이메일, 1인실 여부(Y/N), 성별(M/F) - 쉼표 또는 탭으로 구분</p>
                            <p className="text-blue-500 text-xs">엑셀에서 복사하면 탭으로 자동 인식됩니다.</p>
                        </div>

                        <textarea
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder="소속명,성명,직위,이메일,1인실 여부,성별&#10;글로넷벤처파트너스(주),김동용,매니저,daily1994@naver.com,Y,M&#10;무직,김재경,없음,kjkkjm95@gmail.com,N,F"
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
