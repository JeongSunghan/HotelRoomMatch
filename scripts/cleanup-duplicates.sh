#!/bin/bash

# 중복 JS 파일 삭제 스크립트
# 작성일: 2026-01-07
# 목적: TypeScript 전환 후 남은 JS 파일 정리

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  중복 JS 파일 삭제 스크립트                               ║"
echo "║  (TypeScript 파일이 이미 존재하는 JS 파일만 삭제)          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 현재 디렉토리 확인
if [ ! -d "src" ]; then
    echo "❌ 에러: src 폴더가 없습니다. 프로젝트 루트에서 실행하세요."
    exit 1
fi

echo "📂 작업 디렉토리: $(pwd)"
echo ""

# 삭제 카운터
count=0

echo "🔍 Firebase 폴더 정리 중..."
firebase_files=(
    "src/firebase/allowedUsers.js"
    "src/firebase/auth.js"
    "src/firebase/config.js"
    "src/firebase/history.js"
    "src/firebase/index.js"
    "src/firebase/inquiries.js"
    "src/firebase/invitations.js"
    "src/firebase/joinRequests.js"
    "src/firebase/requests.js"
    "src/firebase/rooms.js"
    "src/firebase/settings.js"
    "src/firebase/users.js"
)

for file in "${firebase_files[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "  ✅ 삭제: $file"
        ((count++))
    else
        echo "  ⏭️  없음: $file"
    fi
done

echo ""
echo "🔍 Utils 폴더 정리 중..."
utils_files=(
    "src/utils/constants.js"
    "src/utils/csvExport.js"
    "src/utils/csvParser.js"
    "src/utils/genderUtils.js"
    "src/utils/matchingUtils.js"
    "src/utils/notifications.js"
    "src/utils/rateLimit.js"
    "src/utils/sanitize.js"
)

for file in "${utils_files[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "  ✅ 삭제: $file"
        ((count++))
    else
        echo "  ⏭️  없음: $file"
    fi
done

echo ""
echo "🔍 Contexts 폴더 정리 중..."
if [ -f "src/contexts/index.js" ]; then
    rm -f "src/contexts/index.js"
    echo "  ✅ 삭제: src/contexts/index.js"
    ((count++))
else
    echo "  ⏭️  없음: src/contexts/index.js"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  정리 완료!                                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo "📊 총 $count개 파일 삭제됨"
echo ""
echo "⚠️  다음 단계:"
echo "  1. npm run build (빌드 확인)"
echo "  2. npm run lint (린트 확인)"
echo "  3. npm run test (테스트 확인)"
echo "  4. Git 커밋"
echo ""

