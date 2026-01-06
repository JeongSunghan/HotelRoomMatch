import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        open: true
    },
    build: {
        chunkSizeWarningLimit: 500, // 500KB로 경고 임계값 낮춤
        // 소스맵 제거로 빌드 크기 감소
        sourcemap: false,
        // 압축 최적화 (esbuild 사용)
        minify: 'esbuild',
        // CSS 코드 스플리팅
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                // 청크 분리 최적화 (더 세밀한 분리)
                manualChunks: (id) => {
                    // node_modules 분리
                    if (id.includes('node_modules')) {
                        // Firebase 관련 모듈 분리
                        if (id.includes('firebase')) {
                            return 'firebase';
                        }
                        // React 관련 분리
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'react-vendor';
                        }
                        // React Query 분리
                        if (id.includes('@tanstack/react-query')) {
                            return 'react-query';
                        }
                        // EmailJS 분리
                        if (id.includes('@emailjs')) {
                            return 'emailjs';
                        }
                        // 기타 vendor
                        return 'vendor';
                    }
                    // 큰 컴포넌트 분리
                    if (id.includes('components/admin')) {
                        return 'admin-components';
                    }
                    if (id.includes('components/room')) {
                        return 'room-components';
                    }
                },
                // 파일명 최적화
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
                // 청크 크기 최적화
                maxParallelFileOps: 2
            }
        },
        // 빌드 성능 최적화
        reportCompressedSize: false, // 빌드 시간 단축
        target: 'esnext' // 최신 브라우저 타겟팅
    },
    // 이미지 최적화
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/database']
    },
    // Vitest 설정
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                '**/*.test.{js,ts,tsx}',
                '**/__tests__/**',
                'dist/',
                'coverage/'
            ],
            include: ['src/**/*.{js,ts,tsx}'],
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 60,
                statements: 60
            }
        }
    }
})

