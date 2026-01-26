import { useState, useEffect, useMemo } from 'react';
import {
    subscribeToAllowedUsers,
    addAllowedUser,
    updateAllowedUser,
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
    const [newUser, setNewUser] = useState({ name: '', email: '', company: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [csvData, setCsvData] = useState('');
    const [csvResult, setCsvResult] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // 전체 선택 핸들러
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredUsers.map(u => u.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    // 개별 선택 핸들러
    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // 일괄 삭제 핸들러
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`선택한 ${selectedIds.size}명의 유저를 삭제하시겠습니까?`)) return;

        try {
            const promises = Array.from(selectedIds).map(id => removeAllowedUser(id));
            await Promise.all(promises);
            setSelectedIds(new Set());
        } catch (error) {
            alert('일괄 삭제 중 오류가 발생했습니다: ' + error.message);
        }
    };

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
                user.company?.toLowerCase().includes(query);

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

        setIsAdding(true);
        try {
            await addAllowedUser(newUser);
            setNewUser({ name: '', email: '', company: '' });
            setShowAddModal(false);
        } catch (error) {
            alert('추가 실패: ' + error.message);
        } finally {
            setIsAdding(false);
        }
    };

    // 편집 모드 상태
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    // 편집 시작
    const handleEditClick = (user) => {
        setNewUser({
            name: user.name,
            email: user.email,
            company: user.company || '',
            position: user.position || '',
            gender: user.gender || '',
            singleRoom: user.singleRoom || 'N'
        });
        setEditingUserId(user.id);
        setIsEditMode(true);
        setShowAddModal(true);
    };

    // 편집 저장
    const handleUpdateUser = async () => {
        if (!newUser.name.trim() || !newUser.email.trim()) return;

        setIsAdding(true);
        try {
            await updateAllowedUser(editingUserId, newUser);
            setNewUser({ name: '', email: '', company: '' });
            setShowAddModal(false);
            setIsEditMode(false);
            setEditingUserId(null);
        } catch (error) {
            alert('수정 실패: ' + error.message);
        } finally {
            setIsAdding(false);
        }
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setShowAddModal(false);
        setIsEditMode(false);
        setEditingUserId(null);
        setNewUser({ name: '', email: '', company: '' });
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

    // ... (CSV 파싱 부분 생략)

    // ... (CSV 업로드 부분 생략)

    // ... (전체 삭제 부분 생략)

    return (
        <div className="space-y-4">
            {/* ... (통계 카드 생략) */}

            {/* ... (액션 버튼) */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => {
                        setIsEditMode(false);
                        setNewUser({ name: '', email: '', company: '' });
                        setShowAddModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
                >
                    ➕ 개별 추가
                </button>
                {/* ... (나머지 버튼들) */}
            </div>

            {/* ... (검색 및 필터 부분 생략) */}

            {/* 유저 목록 */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    {/* ... (테이블 헤더 생략) */}
                    <tbody className="divide-y">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                                    {searchQuery ? '검색 결과가 없습니다.' : '사전등록 유저가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    {/* ... (데이터 컬럼들) */}
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(user.id)}
                                            onChange={() => handleSelectOne(user.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{user.name}</div>
                                        {user.position && <div className="text-xs text-gray-500">{user.position}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.company || '-'}</td>
                                    <td className="px-4 py-3 text-center text-gray-600">
                                        {user.gender === 'M' ? '남성' : user.gender === 'F' ? '여성' : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600">
                                        {user.singleRoom === 'Y' ? '신청' : '-'}
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
                                    <td className="px-4 py-3 text-center space-x-2">
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                        >
                                            수정
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

            {/* 개별 추가/수정 모달 */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">
                            {isEditMode ? '유저 정보 수정' : '사전등록 유저 추가'}
                        </h3>

                        <div className="space-y-4">
                            {/* ... (입력 필드들) */}
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
                                    disabled={isEditMode} // 이메일은 수정 불가 (ID 키이므로)
                                />
                                {isEditMode && <p className="text-xs text-gray-400 mt-1">이메일은 수정할 수 없습니다.</p>}
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                                    <input
                                        type="text"
                                        value={newUser.company || ''}
                                        onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="회사명"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">직위</label>
                                    <input
                                        type="text"
                                        value={newUser.position || ''}
                                        onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="직위"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                                    <select
                                        value={newUser.gender || ''}
                                        onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">선택 안함</option>
                                        <option value="M">남성</option>
                                        <option value="F">여성</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">1인실 희망</label>
                                    <select
                                        value={newUser.singleRoom || 'N'}
                                        onChange={(e) => setNewUser({ ...newUser, singleRoom: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="N">아니오</option>
                                        <option value="Y">예</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-2 border border-gray-300 rounded-lg"
                            >
                                취소
                            </button>
                            <button
                                onClick={isEditMode ? handleUpdateUser : handleAddUser}
                                disabled={!newUser.name.trim() || !newUser.email.trim() || isAdding}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {isAdding ? '저장 중...' : (isEditMode ? '수정' : '추가')}
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
                            <p className="text-blue-600 text-xs mt-1">소속명, 성명, 직위, 이메일, 1인실 여부, 성별 - 쉼표 또는 탭으로 구분</p>
                            <p className="text-blue-500 text-xs">엑셀에서 복사하면 탭으로 자동 인식됩니다.</p>
                        </div>

                        <textarea
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder="소속명,성명,직위,이메일,1인실 여부,성별&#10;ABC회사,홍길동,부장,hong@example.com,Y,M&#10;XYZ기업,김영희,과장,kim@example.com,N,F"
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
