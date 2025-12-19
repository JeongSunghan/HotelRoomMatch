/**
 * React Query Provider 설정
 * 서버 상태 관리 및 캐싱 설정
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// QueryClient 인스턴스 생성
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,  // 5분간 fresh 상태 유지
            gcTime: 1000 * 60 * 30,    // 30분간 캐시 유지 (구 cacheTime)
            retry: 1,                   // 실패 시 1회 재시도
            refetchOnWindowFocus: false, // 윈도우 포커스 시 리페치 비활성화
        },
        mutations: {
            retry: 0,  // 뮤테이션은 재시도 안함
        },
    },
});

export function QueryProvider({ children }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

export { queryClient };
