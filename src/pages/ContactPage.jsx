import { useState, useReducer } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../hooks/useUser';
import { createInquiry, getMyInquiries } from '../firebase/index';

// ============================================
// Form 상태 useReducer로 통합
// ============================================

const FORM_ACTIONS = {
    SET_FIELD: 'SET_FIELD',
    RESET: 'RESET',
    SET_TAB: 'SET_TAB'
};

const initialFormState = {
    activeTab: 'write', // 'write' | 'list'
    title: '',
    content: '',
    contact: ''
};

function formReducer(state, action) {
    switch (action.type) {
        case FORM_ACTIONS.SET_FIELD:
            return { ...state, [action.field]: action.value };
        case FORM_ACTIONS.SET_TAB:
            return { ...state, activeTab: action.tab };
        case FORM_ACTIONS.RESET:
            return { ...initialFormState, activeTab: state.activeTab };
        default:
            return state;
    }
}

/**
 * 1:1 문의 페이지
 * Refactored:
 * - form 상태: useReducer로 통합
 * - 서버 상태 (myInquiries): React Query useQuery
 * - mutation: React Query useMutation
 */
export default function ContactPage() {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [form, dispatch] = useReducer(formReducer, initialFormState);

    // React Query: 내 문의 목록 조회 (자동 캐싱 + 실시간 리페치)
    const {
        data: myInquiries = [],
        isLoading: loadingList,
        refetch
    } = useQuery({
        queryKey: ['inquiries', user?.sessionId],
        queryFn: () => getMyInquiries(user.sessionId),
        enabled: !!user?.sessionId && form.activeTab === 'list',
        staleTime: 30000, // 30초 동안 캐시 유지
        refetchOnWindowFocus: true, // 창 포커스 시 자동 갱신
    });

    // React Query: 문의 등록 mutation
    const createMutation = useMutation({
        mutationFn: (inquiryData) => createInquiry(inquiryData),
        onSuccess: () => {
            alert('문의가 등록되었습니다.');
            dispatch({ type: FORM_ACTIONS.RESET });
            dispatch({ type: FORM_ACTIONS.SET_TAB, tab: 'list' });
            // 목록 캐시 무효화 → 자동 리페치
            queryClient.invalidateQueries({ queryKey: ['inquiries', user?.sessionId] });
        },
        onError: (error) => {
            alert('오류 발생: ' + error.message);
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) return;

        if (!user) {
            alert('문의를 남기려면 먼저 메인 페이지(객실) 등록을 진행해주세요.');
            window.location.href = '/';
            return;
        }

        createMutation.mutate({
            sessionId: user.sessionId,
            userName: user.name,
            title: form.title.trim(),
            content: form.content.trim(),
            contact: form.contact.trim()
        });
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('ko-KR', {
            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleTabChange = (tab) => {
        dispatch({ type: FORM_ACTIONS.SET_TAB, tab });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 헤더 */}
            <header className="bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => window.location.href = '/'} className="text-2xl">
                        ⬅️
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">1:1 문의사항</h1>
                </div>
                {user && <span className="text-sm text-gray-500">{user.name}님</span>}
            </header>

            <main className="flex-1 max-w-2xl w-full mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b">
                        <button
                            onClick={() => handleTabChange('write')}
                            className={`flex-1 py-4 font-medium transition-colors ${form.activeTab === 'write'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            ✏️ 문의하기
                        </button>
                        <button
                            onClick={() => handleTabChange('list')}
                            className={`flex-1 py-4 font-medium transition-colors ${form.activeTab === 'list'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            📋 내 문의 내역
                        </button>
                    </div>

                    <div className="p-6">
                        {form.activeTab === 'write' ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'title', value: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="문의 제목을 입력해주세요"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처 (선택)</label>
                                    <input
                                        type="text"
                                        value={form.contact}
                                        onChange={e => dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'contact', value: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="답변 받을 연락처 (전화번호/카톡ID)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                                    <textarea
                                        value={form.content}
                                        onChange={e => dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'content', value: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none"
                                        placeholder="문의 내용을 자세히 적어주세요."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                                >
                                    {createMutation.isPending ? '등록 중...' : '문의 등록하기'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                {/* 새로고침 버튼 */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => refetch()}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        🔄 새로고침
                                    </button>
                                </div>

                                {loadingList ? (
                                    <p className="text-center text-gray-500 py-10">불러오는 중...</p>
                                ) : myInquiries.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <p>문의 내역이 없습니다.</p>
                                    </div>
                                ) : (
                                    myInquiries.map(item => (
                                        <div key={item.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-800">{item.title}</h3>
                                                <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'replied'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {item.status === 'replied' ? '답변 완료' : '대기 중'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.content}</p>
                                            <p className="text-xs text-gray-400 mt-2">{formatDate(item.createdAt)}</p>

                                            {item.reply && (
                                                <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                    <p className="text-sm font-bold text-blue-800 mb-1">↳ 관리자 답변</p>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.reply}</p>
                                                    <p className="text-xs text-blue-400 mt-1">{formatDate(item.replyAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
