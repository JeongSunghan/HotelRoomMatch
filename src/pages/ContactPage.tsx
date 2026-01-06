import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useUser } from '../hooks/useUser';
import { createInquiry, getMyInquiries } from '../firebase/index';
import type { Inquiry } from '../types';

export default function ContactPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [contact, setContact] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
    const [loadingList, setLoadingList] = useState<boolean>(false);

    // 내 문의 목록 로드
    useEffect(() => {
        if (activeTab === 'list' && user?.sessionId) {
            loadMyInquiries();
        }
    }, [activeTab, user]);

    const loadMyInquiries = async (): Promise<void> => {
        setLoadingList(true);
        try {
            const list = await getMyInquiries(user!.sessionId);
            setMyInquiries(list);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingList(false);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        if (!user) {
            alert('문의를 남기려면 먼저 메인 페이지(객실) 등록을 진행해주세요.');
            window.location.href = '/';
            return;
        }

        setIsSubmitting(true);
        try {
            await createInquiry({
                sessionId: user.sessionId,
                userName: user.name,
                title: title.trim(),
                content: content.trim(),
                contact: contact.trim()
            });
            alert('문의가 등록되었습니다.');
            setTitle('');
            setContent('');
            setContact('');
            setActiveTab('list'); // 목록으로 이동
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert('오류 발생: ' + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString('ko-KR', {
            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
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
                            onClick={() => setActiveTab('write')}
                            className={`flex-1 py-4 font-medium transition-colors ${activeTab === 'write'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            ✏️ 문의하기
                        </button>
                        {/* 25.12.22 - 해당 부분에서 답변이 등록이 되면, 실시간으로 확인이 안됌 */}
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`flex-1 py-4 font-medium transition-colors ${activeTab === 'list'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            📋 내 문의 내역
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'write' ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="문의 제목을 입력해주세요"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처 (선택)</label>
                                    <input
                                        type="text"
                                        value={contact}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setContact(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="답변 받을 연락처 (전화번호/카톡ID)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                                    <textarea
                                        value={content}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none"
                                        placeholder="문의 내용을 자세히 적어주세요."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? '등록 중...' : '문의 등록하기'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
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
                                                    <p className="text-xs text-blue-400 mt-1">{formatDate(item.replyAt || item.createdAt)}</p>
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

