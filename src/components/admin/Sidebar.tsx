type TabId = 'dashboard' | 'rooms' | 'users' | 'activeUsers' | 'requests' | 'inquiries' | 'history';

interface SidebarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    onLogout: () => void;
}

interface MenuItem {
    id: TabId;
    label: string;
    icon: string;
}

/**
 * 관리자 페이지 사이드바
 */
export default function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
    const menus: MenuItem[] = [
        { id: 'dashboard', label: '대시보드', icon: '📊' },
        { id: 'rooms', label: '객실 관리', icon: '🏨' },
        { id: 'users', label: '사전등록 관리', icon: '👥' },
        { id: 'activeUsers', label: '유저 관리', icon: '👤' },
        { id: 'requests', label: '요청 관리', icon: '📋' },
        { id: 'inquiries', label: '1:1 문의', icon: '❓' },
        { id: 'history', label: '히스토리', icon: '📜' },
    ];

    return (
        <div className="w-64 bg-slate-800 text-white flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-slate-700">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <span>🔑</span> V-UP Admin
                </h1>
                <p className="text-xs text-slate-400 mt-1">객실 배정 시스템</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menus.map(menu => (
                    <button
                        key={menu.id}
                        onClick={() => onTabChange(menu.id)}
                        className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
                            ${activeTab === menu.id
                                ? 'bg-blue-600 text-white font-medium shadow-md'
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }
                        `}
                    >
                        <span className="text-lg">{menu.icon}</span>
                        {menu.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <span>🚪</span>
                    로그아웃
                </button>
            </div>
        </div>
    );
}

