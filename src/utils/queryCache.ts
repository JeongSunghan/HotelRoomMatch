/**
 * Firebase 쿼리 캐싱 유틸리티
 * - 반복적인 쿼리 호출 최소화
 * - 간단한 메모리 기반 캐시 구현
 * - TTL(Time To Live) 지원
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // milliseconds
}

class QueryCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private readonly DEFAULT_TTL = 30000; // 30초 기본 TTL

    /**
     * 캐시에서 데이터 조회
     * @param key - 캐시 키
     * @returns 캐시된 데이터 또는 null
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // TTL 확인
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * 캐시에 데이터 저장
     * @param key - 캐시 키
     * @param data - 저장할 데이터
     * @param ttl - TTL (밀리초), 기본값 30초
     */
    set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * 특정 키의 캐시 삭제
     * @param key - 삭제할 캐시 키
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * 패턴으로 캐시 삭제 (예: "user_*")
     * @param pattern - 정규식 패턴 또는 문자열 접두사
     */
    deletePattern(pattern: string | RegExp): void {
        if (typeof pattern === 'string') {
            // 문자열 접두사로 시작하는 모든 키 삭제
            for (const key of this.cache.keys()) {
                if (key.startsWith(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            // 정규식 패턴으로 매칭되는 모든 키 삭제
            for (const key of this.cache.keys()) {
                if (pattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    /**
     * 만료된 캐시 항목 정리
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 전체 캐시 삭제
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * 캐시 크기 반환
     */
    size(): number {
        return this.cache.size;
    }
}

// 싱글톤 인스턴스 생성
const queryCache = new QueryCache();

// 주기적으로 만료된 캐시 정리 (5분마다)
if (typeof window !== 'undefined') {
    setInterval(() => {
        queryCache.cleanup();
    }, 5 * 60 * 1000);
}

export default queryCache;

