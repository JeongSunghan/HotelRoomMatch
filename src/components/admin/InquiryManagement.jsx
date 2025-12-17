
import { useState } from 'react';

/**
 * 1:1 문의 관리 컴포넌트
 */
export default function InquiryManagement({
    inquiries,
    onReply,
    onDelete,
    formatDate
}) {
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReplySubmit = async () => {
        if (!selectedInquiry || !replyText.trim()) return;

        setIsSubmitting(true);
        try {
            await onReply(selectedInquiry.id, replyText);
            setReplyText('');
            setSelectedInquiry(null);
            alert('답변이 등록되었습니다.');
        } catch (error) {
            alert('오류: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (inquiries.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500">
                <p>등록된 문의가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-140px)]">
            {/* 문의 목록 (사이드) */}
            <div className="w-1/3 bg-white rounded-lg border border-gray-200 overflow-y-auto">
                {inquiries.map(item => (
                    <div
                        key={item.id}
                        onClick={() => {
                            setSelectedInquiry(item);
                            setReplyText(item.reply || '');
                        }}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedInquiry?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {item.status === 'replied' ? '답변 완료' : '대기 중'}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                        </div>
                        <h3 className="font-bold text-gray-800 truncate">{item.title}</h3>
                        <p className="text-sm text-gray-600 truncate">{item.userName}</p>
                    </div>
                ))}
            </div>

            {/* 상세 보기 및 답변 (메인) */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6 flex flex-col">
                {selectedInquiry ? (
                    <>
                        <div className="mb-6 pb-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedInquiry.title}</h2>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                <span>작성자: {selectedInquiry.userName}</span>
                                {selectedInquiry.contact && <span>연락처: {selectedInquiry.contact}</span>}
                                <span>작성일: {formatDate(selectedInquiry.createdAt)}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap min-h-[100px]">
                                {selectedInquiry.content}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-2">답변 작성</h3>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
                                placeholder={selectedInquiry.status === 'replied' ? '이미 답변이 등록되었습니다. 수정하려면 내용을 입력하세요.' : '답변 내용을 입력하세요.'}
                                disabled={isSubmitting}
                            />
                            <div className="flex justify-between">
                                <button
                                    onClick={() => {
                                        if (window.confirm('정말 삭제하시겠습니까?')) {
                                            onDelete(selectedInquiry.id);
                                            setSelectedInquiry(null);
                                        }
                                    }}
                                    className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    삭제
                                </button>
                                <button
                                    onClick={handleReplySubmit}
                                    disabled={isSubmitting || !replyText.trim()}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? '등록 중...' : (selectedInquiry.status === 'replied' ? '답변 수정' : '답변 등록')}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-4">👈</span>
                        <p>좌측 목록에서 문의를 선택해주세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
