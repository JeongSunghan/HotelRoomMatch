import { useState, useEffect } from 'react';
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

    // 검색 필터링
    const filteredUsers = users.filter(user => {
        const term = searchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.company?.toLowerCase().includes(term) ||
            user.selectedRoom?.toString().includes(term)
        );
    });

    // 편집 시작
    const handleEdit = (user) => {
        setEditingUser(user);
        setEditForm({
            name: user.name || '',
            gender: user.gender || 'M',
            age: user.age || '',
            snoring: user.snoring || 'no',
            company: user.company || ''
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
                company: editForm.company.trim()
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
                        placeholder="이름, 이메일, 회사, 객실번호..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* 유저 목록 테이블 */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">성별</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">나이</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">코골이</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">객실</th>
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
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{user.company || '-'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                            }`}>
                                            {genderLabel(user.gender)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{user.age || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {SNORING_LABELS[user.snoring] || '-'}
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

                            {/* 나이 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                                <input
                                    type="number"
                                    value={editForm.age}
                                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    min="0"
                                    max="100"
                                />
                            </div>

                            {/* 코골이 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">코골이</label>
                                <select
                                    value={editForm.snoring}
                                    onChange={(e) => setEditForm({ ...editForm, snoring: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="no">😴 없음</option>
                                    <option value="sometimes">😪 가끔</option>
                                    <option value="yes">😤 자주</option>
                                </select>
                            </div>

                            {/* 회사 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">회사</label>
                                <input
                                    type="text"
                                    value={editForm.company}
                                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
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
