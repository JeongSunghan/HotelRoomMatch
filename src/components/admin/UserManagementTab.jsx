import { useState, useEffect, useMemo } from 'react';
import {
    subscribeToAllUsers,
    adminUpdateUser,
    deleteUserCompletely
} from '../../firebase/index';
import { SNORING_LABELS } from '../../utils/constants';
import { useToast } from '../ui/Toast';

/**
 * 유저 관리 탭 (관리자용)
 * - 모든 활성 유저 조회
 * - 유저 정보 편집 (이름, 성별, 나이, 코골이 등)
 * - 유저 삭제 (탈퇴 처리)
 */
export default function UserManagementTab() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' }); // 'asc' | 'desc'
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const toast = useToast();

    // 유저 목록 실시간 구독
    useEffect(() => {
        const unsubscribe = subscribeToAllUsers((allUsers) => {
            setUsers(allUsers);
        });

        return () => unsubscribe();
    }, []);

    function toggleSort(key) {
        setSortConfig((prev) => {
            if (prev.key !== key) return { key, direction: 'asc' };
            return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        });
    }

    function getSortValue(user, key) {
        const u = user || {};
        switch (key) {
            case 'company':
            case 'name':
            case 'position':
            case 'email':
                return String(u[key] || '').trim();
            case 'singleRoom':
                return (u.singleRoom === 'Y') ? 1 : 0;
            case 'gender':
                // M 먼저, 그 다음 F (기타/미입력은 뒤)
                if (u.gender === 'M') return 0;
                if (u.gender === 'F') return 1;
                return 2;
            case 'selectedRoom': {
                const v = u.selectedRoom;
                if (v == null || v === '') return null;
                const s = String(v);
                const n = Number.parseInt(s, 10);
                return Number.isFinite(n) ? n : s;
            }
            default:
                return String(u[key] ?? '').trim();
        }
    }

    function compareValues(a, b) {
        // null/빈값은 마지막으로
        if (a == null || a === '') return (b == null || b === '') ? 0 : 1;
        if (b == null || b === '') return -1;

        // number 우선 비교
        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }

        return String(a).localeCompare(String(b), 'ko-KR', { numeric: true, sensitivity: 'base' });
    }

    // 검색 + 정렬
    const filteredUsers = useMemo(() => {
        const term = String(searchTerm || '').toLowerCase().trim();

        const base = Array.isArray(users) ? users : [];
        const searched = term
            ? base.filter(user => {
                const name = String(user?.name || '').toLowerCase();
                const email = String(user?.email || '').toLowerCase();
                const company = String(user?.company || '').toLowerCase();
                const position = String(user?.position || '').toLowerCase();
                const selectedRoom = user?.selectedRoom != null ? String(user.selectedRoom).toLowerCase() : '';
                return (
                    name.includes(term) ||
                    email.includes(term) ||
                    company.includes(term) ||
                    position.includes(term) ||
                    selectedRoom.includes(term)
                );
            })
            : base;

        const { key, direction } = sortConfig || { key: 'name', direction: 'asc' };
        const dir = direction === 'desc' ? -1 : 1;

        // stable sort (원본 인덱스를 tie-breaker로 사용)
        return searched
            .map((u, idx) => ({ u, idx }))
            .sort((x, y) => {
                const av = getSortValue(x.u, key);
                const bv = getSortValue(y.u, key);
                const c = compareValues(av, bv);
                if (c !== 0) return c * dir;
                return x.idx - y.idx;
            })
            .map(x => x.u);
    }, [users, searchTerm, sortConfig]);

    // 편집 시작
    const handleEdit = (user) => {
        setEditingUser(user);
        setEditForm({
            name: user.name || '',
            gender: user.gender || 'M',
            age: user.age || '',
            snoring: user.snoring || 'no',
            company: user.company || '',
            position: user.position || '',
            singleRoom: user.singleRoom || 'N',
            email: user.email || ''
        });
    };

    // 편집 저장
    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setIsSubmitting(true);

        try {
            const updates = {
                name: editForm.name.trim(),
                gender: editForm.gender,
                age: editForm.age ? parseInt(editForm.age) : null,
                snoring: editForm.snoring,
                company: editForm.company.trim(),
                position: (editForm.position || '').trim(),
                singleRoom: editForm.singleRoom || 'N',
                // email은 key가 아니므로 표시만 하고 변경은 막는다(혼선 방지).
            };

            await adminUpdateUser(editingUser.sessionId, updates);
            setEditingUser(null);
            toast.success('유저 정보가 수정되었습니다.');
        } catch (error) {
            toast.error('수정 실패: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 삭제 확인
    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        setIsSubmitting(true);

        try {
            const result = await deleteUserCompletely(
                deleteConfirm.sessionId,
                deleteConfirm.email
            );

            if (result.success) {
                toast.success('유저가 삭제되었습니다. (재가입 가능)');
                setDeleteConfirm(null);
            } else {
                toast.error('삭제 실패: ' + result.message);
            }
        } catch (error) {
            toast.error('삭제 실패: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 성별 라벨
    const genderLabel = (gender) => gender === 'M' ? '👨 남성' : '👩 여성';

    return (
        <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">유저 관리</h2>
                    <p className="text-gray-500 text-sm">로그인된 모든 유저 ({users.length}명)</p>
                </div>

                {/* 검색 */}
                <div className="w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="소속, 성명, 직위, 이메일, 객실번호..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* 유저 목록 테이블 */}
            {/* why: AdminDashboard가 스크롤 컨테이너(overflow-y-auto)인 상태에서,
                테이블 래퍼가 overflow-x-auto만 가지고 있으면 일부 환경(특히 Windows/터치패드/휠)에서
                휠 스크롤이 가로 스크롤로 흡수되거나 상위 스크롤로 자연스럽게 전달되지 않아
                “마우스 휠 업/다운이 안 되는” 문제가 발생할 수 있다.
                테이블 영역 자체를 overflow-auto(+max-height)로 만들어 휠 스크롤을 안정화한다. */}
            <div className="bg-white rounded-lg shadow overflow-auto max-h-[calc(100vh-240px)]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                                aria-sort={sortConfig.key === 'company' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <button type="button" onClick={() => toggleSort('company')} className="flex items-center gap-1 hover:text-gray-700">
                                    <span>소속</span>
                                    {sortConfig.key === 'company' ? <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span> : null}
                                </button>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                                aria-sort={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-gray-700">
                                    <span>성명</span>
                                    {sortConfig.key === 'name' ? <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span> : null}
                                </button>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                                aria-sort={sortConfig.key === 'position' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <button type="button" onClick={() => toggleSort('position')} className="flex items-center gap-1 hover:text-gray-700">
                                    <span>직위</span>
                                    {sortConfig.key === 'position' ? <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span> : null}
                                </button>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                                aria-sort={sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <button type="button" onClick={() => toggleSort('email')} className="flex items-center gap-1 hover:text-gray-700">
                                    <span>이메일</span>
                                    {sortConfig.key === 'email' ? <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span> : null}
                                </button>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                                aria-sort={sortConfig.key === 'singleRoom' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <button type="button" onClick={() => toggleSort('singleRoom')} className="flex items-center gap-1 hover:text-gray-700">
                                    <span>1인실 여부</span>
                                    {sortConfig.key === 'singleRoom' ? <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span> : null}
                                </button>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                                aria-sort={sortConfig.key === 'gender' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <button type="button" onClick={() => toggleSort('gender')} className="flex items-center gap-1 hover:text-gray-700">
                                    <span>성별</span>
                                    {sortConfig.key === 'gender' ? <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span> : null}
                                </button>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                                aria-sort={sortConfig.key === 'selectedRoom' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <button type="button" onClick={() => toggleSort('selectedRoom')} className="flex items-center gap-1 hover:text-gray-700">
                                    <span>객실</span>
                                    {sortConfig.key === 'selectedRoom' ? <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span> : null}
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 유저가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.sessionId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-500">{user.company || '-'}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{user.position || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{user.email || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{user.singleRoom === 'Y' ? 'Y' : 'N'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                            }`}>
                                            {genderLabel(user.gender)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {user.selectedRoom ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                {user.selectedRoom}호
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">미배정</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm space-x-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            편집
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(user)}
                                            className="text-red-600 hover:text-red-800 font-medium"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setEditingUser(null)} />
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            유저 정보 편집
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {editingUser.email}
                        </p>

                        <div className="space-y-4">
                            {/* 소속 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                                <input
                                    type="text"
                                    value={editForm.company}
                                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* 이름 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* 직위 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">직위</label>
                                <input
                                    type="text"
                                    value={editForm.position}
                                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* 성별 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="M"
                                            checked={editForm.gender === 'M'}
                                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                        />
                                        <span>👨 남성</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="F"
                                            checked={editForm.gender === 'F'}
                                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                        />
                                        <span>👩 여성</span>
                                    </label>
                                </div>
                                <p className="text-xs text-amber-600 mt-1">
                                    ⚠️ 성별 변경 시 유저의 객실 배정 현황을 확인하세요.
                                </p>
                            </div>

                            {/* 1인실 여부 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">1인실 여부</label>
                                <select
                                    value={editForm.singleRoom}
                                    onChange={(e) => setEditForm({ ...editForm, singleRoom: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="N">N</option>
                                    <option value="Y">Y</option>
                                </select>
                            </div>

                            {/* 나이 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="150"
                                    value={editForm.age}
                                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="나이를 입력하세요"
                                />
                            </div>

                            {/* 코골이 여부 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">코골이 여부</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="snoring"
                                            value="no"
                                            checked={editForm.snoring === 'no'}
                                            onChange={(e) => setEditForm({ ...editForm, snoring: e.target.value })}
                                        />
                                        <span>{SNORING_LABELS.no}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="snoring"
                                            value="yes"
                                            checked={editForm.snoring === 'yes'}
                                            onChange={(e) => setEditForm({ ...editForm, snoring: e.target.value })}
                                        />
                                        <span>{SNORING_LABELS.yes}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSubmitting}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 삭제 확인 모달 */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-lg font-bold text-red-600 mb-2">⚠️ 유저 삭제</h3>
                        <p className="text-gray-600 mb-4">
                            <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email})님을 삭제하시겠습니까?
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-700">
                                • 객실 배정이 취소됩니다<br />
                                • 모든 세션 데이터가 삭제됩니다<br />
                                • 사전등록 상태가 초기화되어 재가입 가능합니다
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isSubmitting}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isSubmitting ? '삭제 중...' : '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
