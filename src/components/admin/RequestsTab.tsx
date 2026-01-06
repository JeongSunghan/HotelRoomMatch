import type { RoomChangeRequest } from '../../types';

interface RequestsTabProps {
    changeRequests: RoomChangeRequest[];
    onResolveRequest: (request: RoomChangeRequest) => Promise<void>;
    onDeleteRequest: (requestId: string) => Promise<void>;
    formatDate: (timestamp: number) => string;
}

/**
 * 변경 요청 탭 컴포넌트
 */
export default function RequestsTab({
    changeRequests,
    onResolveRequest,
    onDeleteRequest,
    formatDate
}: RequestsTabProps) {
    if (changeRequests.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>수정 요청이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {changeRequests.map(request => (
                <div
                    key={request.id}
                    className={`p-4 rounded-lg border bg-white ${request.status === 'pending'
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-200 opacity-60'
                        }`}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${request.type === 'cancel'
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-blue-200 text-blue-800'
                                    }`}>
                                    {request.type === 'cancel' ? '취소 요청' : '변경 요청'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${request.status === 'pending'
                                    ? 'bg-amber-200 text-amber-800'
                                    : 'bg-green-200 text-green-800'
                                    }`}>
                                    {request.status === 'pending' ? '대기 중' : '처리 완료'}
                                </span>
                                <span className="text-gray-400 text-sm">
                                    {formatDate(request.createdAt)}
                                </span>
                            </div>

                            <p className="font-medium text-gray-800">
                                {request.userName}
                                {(request as RoomChangeRequest & { userCompany?: string }).userCompany && (
                                    <span className="text-gray-500 text-sm ml-1">({(request as RoomChangeRequest & { userCompany?: string }).userCompany})</span>
                                )}
                            </p>

                            <p className="text-sm text-gray-600 mt-1">
                                현재 방: <strong>{request.currentRoom}호</strong>
                            </p>

                            <p className="text-sm text-blue-600 mt-1">
                                📞 {request.phoneNumber}
                            </p>

                            {request.reason && (
                                <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                                    "{request.reason}"
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {request.status === 'pending' && (
                                <button
                                    onClick={() => onResolveRequest(request)}
                                    className={`px-3 py-1.5 text-white rounded text-sm font-medium ${request.type === 'cancel'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                >
                                    {request.type === 'cancel' ? '취소 승인' : '처리 완료'}
                                </button>
                            )}
                            {request.id && (
                                <button
                                    onClick={() => onDeleteRequest(request.id!)}
                                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

