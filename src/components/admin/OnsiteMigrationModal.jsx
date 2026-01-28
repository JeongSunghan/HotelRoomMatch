import { useEffect, useMemo, useState } from 'react';
import { migrateTempGuestToRegisteredUser, subscribeToAllUsers } from '../../firebase/index';
import { useToast } from '../ui/Toast';

/**
 * 현장등록(배정만) guest → 등록유저(users)로 전환하는 관리자 모달
 *
 * 보안/운영 원칙:
 * - OTP(이메일 소유 확인) 우회 없이, 이미 users에 존재하는 sessionId만 대상으로 전환한다.
 * - 매칭은 tempGuestId 기반(동명이인 위험 방지)
 */
export default function OnsiteMigrationModal({ roomNumber, onsiteGuest, onClose }) {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const unsub = subscribeToAllUsers((allUsers) => setUsers(allUsers || []));
        return () => unsub();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u => {
            const parts = [
                u?.name,
                u?.email,
                u?.company,
                u?.position,
                u?.sessionId,
                u?.selectedRoom ? String(u.selectedRoom) : ''
            ]
                .filter(Boolean)
                .map(String)
                .map(s => s.toLowerCase());
            return parts.some(p => p.includes(q));
        });
    }, [users, search]);

    const handleMigrate = async () => {
        if (!onsiteGuest?.tempGuestId) {
            toast.error('tempGuestId가 없어 전환할 수 없습니다.');
            return;
        }
        if (!selectedSessionId) {
            toast.error('전환할 등록 유저를 선택하세요.');
            return;
        }

        const ok = window.confirm(
            `현장등록 게스트를 정식 등록유저로 전환하시겠습니까?\n\n` +
            `- 방: ${roomNumber}호\n` +
            `- 현장 게스트: ${onsiteGuest.name}\n` +
            `- tempGuestId: ${onsiteGuest.tempGuestId}\n` +
            `- 대상 sessionId: ${selectedSessionId}\n`
        );
        if (!ok) return;

        setIsSubmitting(true);
        try {
            await migrateTempGuestToRegisteredUser(onsiteGuest.tempGuestId, selectedSessionId);
            toast.success('정식 등록 전환 완료');
            onClose();
        } catch (e) {
            toast.error(`전환 실패: ${e?.message || String(e)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">정식 등록 전환</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            <strong>{roomNumber}호</strong> 현장등록 게스트를 OTP 등록유저로 치환합니다.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                    >
                        닫기
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 bg-slate-50">
                        <p className="text-xs font-semibold text-slate-600 mb-2">현장등록 게스트</p>
                        <div className="text-sm text-slate-800 space-y-1">
                            <div><span className="text-slate-500">이름:</span> {onsiteGuest?.name || '-'}</div>
                            <div><span className="text-slate-500">소속:</span> {onsiteGuest?.company || '-'}</div>
                            <div><span className="text-slate-500">성별:</span> {onsiteGuest?.gender || '-'}</div>
                            <div className="break-all"><span className="text-slate-500">tempGuestId:</span> {onsiteGuest?.tempGuestId || '-'}</div>
                            <div className="break-all"><span className="text-slate-500">onsiteSessionId:</span> {onsiteGuest?.sessionId || '-'}</div>
                        </div>
                        <p className="text-xs text-amber-700 mt-3">
                            왜: 이름 기반 매칭은 동명이인 위험이 있어 tempGuestId 기반으로 전환합니다.
                        </p>
                    </div>

                    <div className="border rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-600 mb-2">등록유저 선택(users)</p>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="이름/이메일/소속/세션ID로 검색..."
                            className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
                        />

                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                            {filtered.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">검색 결과가 없습니다.</div>
                            ) : (
                                filtered.map((u) => {
                                    const sid = u?.sessionId;
                                    const label = `${u?.name || '-'} • ${u?.email || '-'} • ${u?.company || '-'} • ${sid}`;
                                    return (
                                        <label key={sid} className="flex items-start gap-2 p-3 border-b last:border-b-0 cursor-pointer hover:bg-slate-50">
                                            <input
                                                type="radio"
                                                name="selectedUser"
                                                value={sid}
                                                checked={selectedSessionId === sid}
                                                onChange={() => setSelectedSessionId(sid)}
                                                className="mt-1"
                                            />
                                            <div className="min-w-0">
                                                <div className="text-sm text-slate-800 truncate">{label}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    성별: {u?.gender || '-'} / 1인실: {u?.singleRoom === 'Y' ? 'Y' : 'N'} / 현재방: {u?.selectedRoom ? `${u.selectedRoom}호` : '미배정'}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                        disabled={isSubmitting}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleMigrate}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                        disabled={isSubmitting || !selectedSessionId}
                    >
                        {isSubmitting ? '전환 중...' : '전환 실행'}
                    </button>
                </div>
            </div>
        </div>
    );
}

