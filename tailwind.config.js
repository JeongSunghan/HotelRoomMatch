/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // 네이비 팔레트
                'navy': {
                    900: '#0f1729',
                    800: '#1a2744',
                    700: '#1e3a5f',
                    600: '#2563eb',
                    500: '#3b82f6',
                },

                // 남성 색상 (블루 계열)
                'male-empty': '#2563eb',      // 파란 테두리 (빈 방)
                'male-half': '#dbeafe',       // 연한 파랑 (2인실 1명 선택)
                'male-full': '#1d4ed8',       // 진한 파랑 (배정 완료)

                // 여성 색상 (핑크 계열)
                'female-empty': '#db2777',    // 분홍 테두리 (빈 방)
                'female-half': '#fce7f3',     // 연한 분홍 (2인실 1명 선택)
                'female-full': '#be185d',     // 진한 분홍 (배정 완료)

                // 기타
                'disabled': '#9CA3AF',        // 선택 불가
                'my-room': '#10B981',         // 내가 선택한 방
            }
        },
    },
    plugins: [],
}
