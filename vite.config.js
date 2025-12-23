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
        chunkSizeWarningLimit: 1024,
        // 소스맵 제거로 빌드 크기 감소
        sourcemap: false,
        // 압축 최적화 (esbuild 사용)
        minify: 'esbuild',
        rollupOptions: {
            output: {
                // 청크 분리 최적화
                manualChunks: {
                    // Firebase 관련 모듈 분리
                    firebase: ['firebase/app', 'firebase/database'],
                    // React 관련 분리
                    vendor: ['react', 'react-dom', 'react-router-dom']
                },
                // 파일명 최적화
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        }
    },
    // 이미지 최적화
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/database']
    }
})

