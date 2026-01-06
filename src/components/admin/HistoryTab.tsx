import { useState, useEffect, ChangeEvent } from 'react';
import { subscribeToHistory, HISTORY_ACTIONS } from '../../firebase/index';
import type { HistoryEntry } from '../../types';

interface ActionInfo {
    label: string;
    color: string;
    icon: string;
}

/**
 * 히스토리 탭 컴포넌트
 */
export default function HistoryTab() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        const unsubscribe = subscribeToHistory((entries: HistoryEntry[]) => {
            setHistory(entries);
        }, 200);
        return () => unsubscribe();
    }, []);

    // 액션 타입별 라벨 및 색상
    const getActionInfo = (action: string): ActionInfo => {
        switch (action) {
            case HISTORY_ACTIONS.REGISTER:
                return { label: '등록', color: 'bg-green-100 text-green-700', icon: '✅' };
            case HISTORY_ACTIONS.ADMIN_ADD:
                return { label: '관리자 추가', color: 'bg-blue-100 text-blue-700', icon: '➕' };
            case HISTORY_ACTIONS.ADMIN_REMOVE:
                return { label: '삭제', color: 'bg-red-100 text-red-700', icon: '❌' };
            case HISTORY_ACTIONS.ADMIN_EDIT:
                return { label: '수정', color: 'bg-amber-100 text-amber-700', icon: '✏️' };
            case HISTORY_ACTIONS.CSV_UPLOAD:
                return { label: 'CSV 업로드', color: 'bg-purple-100 text-purple-700', icon: '📤' };
            case HISTORY_ACTIONS.ROOM_CHANGE:
                return { label: '방 변경', color: 'bg-cyan-100 text-cyan-700', icon: '🔄' };
            default:
                return { label: action, color: 'bg-gray-100 text-gray-700', icon: '📋' };
        }
    };

    // 필터링
    const filteredHistory = history.filter((item: HistoryEntry) => {
        // 액션 타입 필터
        if (filter !== 'all' && item.action !== filter) return false;

        // 검색어 필터
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchName = item.guestName?.toLowerCase().includes(query);
            const matchRoom = item.roomNumber?.toString().includes(query);
            const matchFromRoom = item.fromRoom?.toString().includes(query);
            const matchToRoom = item.toRoom?.toString().includes(query);
            if (!matchName && !matchRoom && !matchFromRoom && !matchToRoom) return false;
        }

        return true;
    });

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 히스토리 내용 렌더링
    const renderHistoryContent = (item: HistoryEntry): JSX.Element => {
        const { action, guestName, roomNumber, fromRoom, toRoom, oldName, newName, oldCompany, newCompany } = item;

        switch (action) {
            case HISTORY_ACTIONS.REGISTER:
            case HISTORY_ACTIONS.ADMIN_ADD:
            case HISTORY_ACTIONS.CSV_UPLOAD:
                return (
                    <div>
                        <span><strong>{guestName}</strong>님이 <strong>{roomNumber}호</strong>에 등록됨</span>
                        {item.warningDetails && Array.isArray(item.warningDetails) && item.warningDetails.length > 0 && (
                            <div className="mt-1 bg-red-50 border border-red-100 rounded p-2">
                                <span className="text-xs font-bold text-red-600">⚠️ [사용자 경고 무시 입장]</span>
                                <ul className="text-xs text-red-500 mt-1 list-disc list-inside">
                                    {(item.warningDetails as string[]).map((msg: string, i: number) => <li key={i}>{msg}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            case HISTORY_ACTIONS.ADMIN_REMOVE:
                return (
                    <span><strong>{guestName}</strong>님이 <strong>{roomNumber}호</strong>에서 삭제됨</span>
                );
            case HISTORY_ACTIONS.ADMIN_EDIT:
                return (
                    <span>
                        <strong>{roomNumber}호</strong>: {oldName !== newName && `${oldName} → ${newName}`}
                        {oldCompany !== newCompany && ` (소속: ${oldCompany || '없음'} → ${newCompany || '없음'})`}
                    </span>
                );
            case HISTORY_ACTIONS.ROOM_CHANGE:
                return (
                    <span><strong>{guestName}</strong>님이 <strong>{fromRoom}호</strong> → <strong>{toRoom}호</strong>로 이동</span>
                );
            default:
                return <span>{JSON.stringify(item)}</span>;
        }
    };

    return (
        <div className="space-y-4">
            {/* 필터 */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="이름 또는 방 번호 검색..."
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={filter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">전체 액션</option>
                    <option value={HISTORY_ACTIONS.REGISTER}>등록</option>
                    <option value={HISTORY_ACTIONS.ADMIN_ADD}>관리자 추가</option>
                    <option value={HISTORY_ACTIONS.ADMIN_REMOVE}>삭제</option>
                    <option value={HISTORY_ACTIONS.ADMIN_EDIT}>수정</option>
                    <option value={HISTORY_ACTIONS.CSV_UPLOAD}>CSV 업로드</option>
                    <option value={HISTORY_ACTIONS.ROOM_CHANGE}>방 변경</option>
                </select>
                <span className="text-sm text-gray-500 self-center">
                    총 {filteredHistory.length}건
                </span>
            </div>

            {/* 히스토리 목록 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>히스토리가 없습니다.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {filteredHistory.map((item: HistoryEntry) => {
                            const actionInfo = getActionInfo(item.action);
                            return (
                                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">{actionInfo.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionInfo.color}`}>
                                                    {actionInfo.label}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(item.timestamp)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                {renderHistoryContent(item)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

