/**
 * 사전등록 유저 관리 탭 (관리자용)
 * Firestore 기반으로 마이그레이션 완료
 */

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import {
    subscribeToAllFirestoreUsers,
    createFirestoreUser,
    deleteFirestoreUser,
    bulkCreateFirestoreUsers
} from '../../firebase/index';
import type { FirestoreUser, FirestoreUserCreateData } from '../../types/firestore';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmModal';
import UserBulkUploadModal from './UserBulkUploadModal';
import { getGenderLabel } from '../../utils/genderUtils';

interface UserForm {
    name: string;
    email: string;
    org: string;
    position: string;
    phone: string;
    gender: 'M' | 'F';
    singleAllowed: boolean;
}

const INITIAL_USER_FORM: UserForm = {
    name: '',
    email: '',
    org: '',
    position: '',
    phone: '',
    gender: 'M',
    singleAllowed: false
};

type SortBy = 'name' | 'org' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type GenderFilter = 'all' | 'M' | 'F';

/**
 * 사전등록 유저 관리 탭 (Firestore 기반)
 */
export default function AllowedUsersTab() {
    const [users, setUsers] = useState<(FirestoreUser & { id: string })[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
    const [newUser, setNewUser] = useState<UserForm>(INITIAL_USER_FORM);
    const [isAdding, setIsAdding] = useState<boolean>(false);

    // 정렬 및 필터 상태
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');

    const toast = useToast();
    const confirm = useConfirm();

    // Firestore 실시간 구독
    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToAllFirestoreUsers((firestoreUsers) => {
            setUsers(firestoreUsers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 검색, 필터, 정렬 적용
    const filteredUsers = useMemo(() => {
        let result = users.filter((user) => {
            // 검색 필터
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query ||
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.org?.toLowerCase().includes(query) ||
                user.position?.toLowerCase().includes(query);

            // 성별 필터
            const matchesGender =
                genderFilter === 'all' || user.gender === genderFilter;

            return matchesSearch && matchesGender;
        });

        // 정렬
        result.sort((a, b) => {
            if (sortBy === 'name') {
                const valueA = a.name || '';
                const valueB = b.name || '';
                const comparison = valueA.localeCompare(valueB, 'ko');
                return sortOrder === 'asc' ? comparison : -comparison;
            } else if (sortBy === 'org') {
                const valueA = a.org || '';
                const valueB = b.org || '';
                const comparison = valueA.localeCompare(valueB, 'ko');
                return sortOrder === 'asc' ? comparison : -comparison;
            } else if (sortBy === 'createdAt') {
                // Timestamp 처리: toMillis() 또는 숫자 변환
                const getTime = (ts: number | { toMillis?: () => number } | undefined): number => {
                    if (!ts) return 0;
                    if (typeof ts === 'number') return ts;
                    if (typeof ts === 'object' && 'toMillis' in ts && typeof ts.toMillis === 'function') {
                        return ts.toMillis();
                    }
                    return 0;
                };
                const valueA = getTime(a.createdAt as number | { toMillis?: () => number } | undefined);
                const valueB = getTime(b.createdAt as number | { toMillis?: () => number } | undefined);
                return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
            }
            return 0;
        });

        return result;
    }, [users, searchQuery, sortBy, sortOrder, genderFilter]);

    // 통계
    const stats = useMemo(() => ({
        total: users.length,
        male: users.filter(u => u.gender === 'M').length,
        female: users.filter(u => u.gender === 'F').length,
        singleAllowed: users.filter(u => u.singleAllowed).length
    }), [users]);

    // 이메일 유효성 검사
    const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // 유저 추가
    const handleAddUser = async (): Promise<void> => {
        if (!newUser.name.trim() || !newUser.email.trim()) {
            toast.error('이름과 이메일은 필수입니다.');
            return;
        }
        if (!isValidEmail(newUser.email)) {
            toast.error('유효한 이메일 형식이 아닙니다.');
            return;
        }

        setIsAdding(true);
        try {
            const userData: FirestoreUserCreateData = {
                name: newUser.name.trim(),
                email: newUser.email.trim().toLowerCase(),
                org: newUser.org.trim(),
                position: newUser.position.trim(),
                phone: newUser.phone.trim(),
                gender: newUser.gender,
                singleAllowed: newUser.singleAllowed
            };

            // Firestore에 userId 생성 (이메일 기반)
            const userId = newUser.email.replace(/[.@]/g, '_');
            await createFirestoreUser(userId, userData);
            
            toast.success('유저가 추가되었습니다.');
            setNewUser(INITIAL_USER_FORM);
            setShowAddModal(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error('추가 실패: ' + errorMessage);
        } finally {
            setIsAdding(false);
        }
    };

    // 유저 삭제
    const handleRemoveUser = async (userId: string, userName: string): Promise<void> => {
        const confirmed = await confirm.show({
            title: '사전등록 삭제',
            message: `${userName}님을 사전등록 목록에서 삭제하시겠습니까?`,
            type: 'warning'
        });

        if (!confirmed) return;

        try {
            await deleteFirestoreUser(userId);
            toast.success('삭제되었습니다.');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error('삭제 실패: ' + errorMessage);
        }
    };

    // 일괄 등록 처리
    const handleBulkUpload = async (usersData: FirestoreUserCreateData[]) => {
        return await bulkCreateFirestoreUsers(usersData);
    };

    // 전체 삭제
    const handleClearAll = async (): Promise<void> => {
        const confirmed = await confirm.show({
            title: '⚠️ 전체 삭제',
            message: '정말로 모든 사전등록 유저를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.',
            type: 'warning'
        });

        if (!confirmed) return;

        const doubleConfirm = await confirm.show({
            title: '⚠️ 마지막 확인',
            message: `총 ${users.length}명의 유저가 삭제됩니다. 정말 삭제하시겠습니까?`,
            type: 'warning'
        });

        if (!doubleConfirm) return;

        try {
            // 모든 유저 삭제
            for (const user of users) {
                await deleteFirestoreUser(user.id);
            }
            toast.success('모든 유저가 삭제되었습니다.');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error('삭제 실패: ' + errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">로딩 중...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 통계 카드 */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                    <p className="text-sm text-gray-500">전체</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.male}</p>
                    <p className="text-sm text-gray-500">남성</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-pink-200 text-center">
                    <p className="text-2xl font-bold text-pink-600">{stats.female}</p>
                    <p className="text-sm text-gray-500">여성</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-amber-200 text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.singleAllowed}</p>
                    <p className="text-sm text-gray-500">1인실 가능</p>
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    ➕ 개별 추가
                </button>
                <button
                    onClick={() => setShowBulkModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    📤 CSV/JSON 업로드
                </button>
                <button
                    onClick={handleClearAll}
                    disabled={users.length === 0}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
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
                    placeholder="이름, 이메일, 소속, 직위로 검색..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            {/* 정렬 및 필터 */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* 성별 필터 */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                    <button
                        onClick={() => setGenderFilter('all')}
                        className={`px-3 py-1.5 transition-colors ${genderFilter === 'all' ? 'bg-slate-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        전체 ({stats.total})
                    </button>
                    <button
                        onClick={() => setGenderFilter('M')}
                        className={`px-3 py-1.5 border-l transition-colors ${genderFilter === 'M' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        남성 ({stats.male})
                    </button>
                    <button
                        onClick={() => setGenderFilter('F')}
                        className={`px-3 py-1.5 border-l transition-colors ${genderFilter === 'F' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        여성 ({stats.female})
                    </button>
                </div>

                {/* 정렬 */}
                <select
                    value={sortBy}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortBy)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="name">이름순</option>
                    <option value="org">소속순</option>
                    <option value="createdAt">등록일순</option>
                </select>
                <button
                    onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors"
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
                            <th className="px-4 py-3 text-left font-medium text-gray-700">직위</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">성별</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">1인실</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    {searchQuery ? '검색 결과가 없습니다.' : '사전등록 유저가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.org || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.position || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            user.gender === 'M' 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'bg-pink-100 text-pink-700'
                                        }`}>
                                            {getGenderLabel(user.gender)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {user.singleAllowed ? (
                                            <span className="text-amber-600">✓</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleRemoveUser(user.id, user.name)}
                                            className="text-red-500 hover:text-red-700 text-sm transition-colors"
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
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold mb-4">사전등록 유저 추가</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="홍길동"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                                    <input
                                        type="text"
                                        value={newUser.org}
                                        onChange={(e) => setNewUser({ ...newUser, org: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="회사명"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">직위</label>
                                    <input
                                        type="text"
                                        value={newUser.position}
                                        onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="팀장"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                                <input
                                    type="tel"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="010-1234-5678"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">성별 *</label>
                                    <select
                                        value={newUser.gender}
                                        onChange={(e) => setNewUser({ ...newUser, gender: e.target.value as 'M' | 'F' })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="M">남성</option>
                                        <option value="F">여성</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">1인실 허용</label>
                                    <div className="flex items-center h-10">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newUser.singleAllowed}
                                                onChange={(e) => setNewUser({ ...newUser, singleAllowed: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm text-gray-600">허용</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewUser(INITIAL_USER_FORM);
                                }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={!newUser.name.trim() || !newUser.email.trim() || isAdding}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                            >
                                {isAdding ? '추가 중...' : '추가'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV/JSON 일괄 업로드 모달 */}
            {showBulkModal && (
                <UserBulkUploadModal
                    onUpload={handleBulkUpload}
                    onClose={() => setShowBulkModal(false)}
                />
            )}
        </div>
    );
}
