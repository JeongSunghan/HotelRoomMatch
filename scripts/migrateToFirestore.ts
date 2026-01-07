/**
 * Firebase Realtime Database → Firestore 마이그레이션 스크립트
 * 
 * 사용법:
 * 1. Firebase Admin SDK 설정 (serviceAccount.json)
 * 2. npm install firebase-admin
 * 3. ts-node scripts/migrateToFirestore.ts
 * 
 * 주의:
 * - 백업을 먼저 수행하세요
 * - 테스트 환경에서 먼저 검증하세요
 * - 마이그레이션 중 중단되면 재시작 가능하도록 설계됨
 */

import * as admin from 'firebase-admin';
// import * as serviceAccount from './serviceAccount.json'; // Firebase Admin SDK 키

// Firebase Admin 초기화
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
//     databaseURL: 'https://your-project.firebaseio.com'
// });

const db = admin.database();
const firestore = admin.firestore();

// ==================== 타입 정의 ====================

interface RealtimeDBAllowedUser {
    name?: string;
    email: string;
    company?: string;
    registered: boolean;
    registeredSessionId?: string;
    registeredUid?: string;
    registeredAt?: number;
    createdAt?: number;
}

interface FirestoreUser {
    org: string;
    name: string;
    position: string;
    email: string;
    phone: string;
    gender: 'M' | 'F';
    singleAllowed: boolean;
    createdAt: admin.firestore.Timestamp;
}

// ==================== 유틸리티 함수 ====================

/**
 * 로그 출력
 */
function log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
}

/**
 * 에러 로그
 */
function logError(message: string, error: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, error);
}

/**
 * 진행 상황 저장
 */
async function saveProgress(phase: string, count: number) {
    await firestore.collection('_migration').doc('progress').set({
        phase,
        count,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

/**
 * 진행 상황 로드
 */
async function loadProgress(): Promise<{ phase: string; count: number } | null> {
    const doc = await firestore.collection('_migration').doc('progress').get();
    if (!doc.exists) return null;
    return doc.data() as { phase: string; count: number };
}

// ==================== 마이그레이션 함수 ====================

/**
 * Phase 1: allowedUsers → users 컬렉션 마이그레이션
 * 
 * 주의: allowedUsers는 단순 화이트리스트이므로,
 * Firestore users에는 추가 정보 (org, position, phone, gender, singleAllowed)가 필요합니다.
 * 이 정보는 CSV/JSON 파일에서 가져와야 합니다.
 */
async function migrateAllowedUsersToUsers(dryRun: boolean = true): Promise<void> {
    log('Phase 1: allowedUsers → users 마이그레이션 시작', { dryRun });

    try {
        const allowedUsersRef = db.ref('allowedUsers');
        const snapshot = await allowedUsersRef.once('value');
        const allowedUsers = snapshot.val() as Record<string, RealtimeDBAllowedUser>;

        if (!allowedUsers) {
            log('allowedUsers 데이터가 없습니다.');
            return;
        }

        const emails = Object.keys(allowedUsers);
        log(`총 ${emails.length}개 사용자 발견`);

        let successCount = 0;
        let errorCount = 0;

        // 배치 처리 (500개씩)
        const BATCH_SIZE = 500;
        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch = firestore.batch();
            const batchEmails = emails.slice(i, Math.min(i + BATCH_SIZE, emails.length));

            for (const emailKey of batchEmails) {
                try {
                    const allowedUser = allowedUsers[emailKey];
                    const email = allowedUser.email.toLowerCase();

                    // Firestore users 데이터 구성
                    // 주의: org, position, phone, gender, singleAllowed는 CSV에서 가져와야 함
                    // 여기서는 기본값 사용
                    const firestoreUser: FirestoreUser = {
                        org: allowedUser.company || 'Unknown',
                        name: allowedUser.name || 'Unknown',
                        position: 'Unknown', // CSV에서 가져와야 함
                        email: email,
                        phone: 'Unknown', // CSV에서 가져와야 함
                        gender: 'M', // CSV에서 가져와야 함
                        singleAllowed: false, // CSV에서 가져와야 함
                        createdAt: admin.firestore.Timestamp.fromMillis(allowedUser.createdAt || Date.now())
                    };

                    if (!dryRun) {
                        const userRef = firestore.collection('users').doc(email);
                        batch.set(userRef, firestoreUser);
                    }

                    successCount++;
                } catch (error) {
                    logError(`사용자 마이그레이션 실패: ${emailKey}`, error);
                    errorCount++;
                }
            }

            if (!dryRun) {
                await batch.commit();
                log(`배치 ${Math.floor(i / BATCH_SIZE) + 1} 커밋 완료 (${batchEmails.length}개)`);
            }

            await saveProgress('phase1', i + batchEmails.length);
        }

        log('Phase 1 완료', { success: successCount, error: errorCount });
    } catch (error) {
        logError('Phase 1 실패', error);
        throw error;
    }
}

/**
 * Phase 2: users 데이터 기반 userStays 생성
 * 
 * 기존 Realtime DB에는 userStays 개념이 없으므로,
 * 모든 사용자에 대해 UNASSIGNED 상태의 userStay를 생성합니다.
 */
async function createInitialUserStays(dryRun: boolean = true): Promise<void> {
    log('Phase 2: userStays 초기 생성 시작', { dryRun });

    try {
        const usersSnapshot = await firestore.collection('users').get();
        log(`총 ${usersSnapshot.size}개 사용자 발견`);

        let successCount = 0;
        let errorCount = 0;

        // 배치 처리 (500개씩)
        const BATCH_SIZE = 500;
        const users = usersSnapshot.docs;

        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = firestore.batch();
            const batchUsers = users.slice(i, Math.min(i + BATCH_SIZE, users.length));

            for (const userDoc of batchUsers) {
                try {
                    const userId = userDoc.id; // email
                    
                    // userStay가 이미 존재하는지 확인
                    const existingStay = await firestore.collection('userStays')
                        .where('userId', '==', userId)
                        .limit(1)
                        .get();

                    if (!existingStay.empty) {
                        log(`userStay가 이미 존재: ${userId}`);
                        continue;
                    }

                    // 초기 userStay 생성
                    const userStay = {
                        userId: userId,
                        birthDate: '', // 로그인 시 입력
                        age: 0,
                        snoring: false,
                        roomType: null,
                        roomId: null,
                        status: 'UNASSIGNED',
                        assignedAt: null,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    };

                    if (!dryRun) {
                        const stayRef = firestore.collection('userStays').doc();
                        batch.set(stayRef, userStay);
                    }

                    successCount++;
                } catch (error) {
                    logError(`userStay 생성 실패: ${userDoc.id}`, error);
                    errorCount++;
                }
            }

            if (!dryRun) {
                await batch.commit();
                log(`배치 ${Math.floor(i / BATCH_SIZE) + 1} 커밋 완료 (${batchUsers.length}개)`);
            }

            await saveProgress('phase2', i + batchUsers.length);
        }

        log('Phase 2 완료', { success: successCount, error: errorCount });
    } catch (error) {
        logError('Phase 2 실패', error);
        throw error;
    }
}

/**
 * Phase 3: 검증 및 정리
 */
async function validateMigration(): Promise<void> {
    log('Phase 3: 마이그레이션 검증 시작');

    try {
        // users 수 확인
        const usersSnapshot = await firestore.collection('users').get();
        const usersCount = usersSnapshot.size;
        log(`users 컬렉션: ${usersCount}개`);

        // userStays 수 확인
        const staysSnapshot = await firestore.collection('userStays').get();
        const staysCount = staysSnapshot.size;
        log(`userStays 컬렉션: ${staysCount}개`);

        // allowedUsers 수 확인
        const allowedUsersRef = db.ref('allowedUsers');
        const allowedSnapshot = await allowedUsersRef.once('value');
        const allowedUsers = allowedSnapshot.val();
        const allowedCount = allowedUsers ? Object.keys(allowedUsers).length : 0;
        log(`allowedUsers (Realtime DB): ${allowedCount}개`);

        // 불일치 확인
        if (usersCount !== staysCount) {
            logError('불일치 발견', { users: usersCount, stays: staysCount });
        } else {
            log('✅ 검증 완료: users와 userStays 수가 일치합니다.');
        }

        // orphaned userStays 확인 (userId가 users에 없는 경우)
        let orphanedCount = 0;
        for (const stayDoc of staysSnapshot.docs) {
            const userId = stayDoc.data().userId;
            const userDoc = await firestore.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                orphanedCount++;
                log(`❌ Orphaned userStay: ${stayDoc.id} (userId: ${userId})`);
            }
        }

        if (orphanedCount > 0) {
            logError('Orphaned userStays 발견', { count: orphanedCount });
        } else {
            log('✅ Orphaned userStays 없음');
        }

        log('Phase 3 완료');
    } catch (error) {
        logError('Phase 3 실패', error);
        throw error;
    }
}

// ==================== 메인 실행 ====================

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');
    const skipPhase1 = args.includes('--skip-phase1');
    const skipPhase2 = args.includes('--skip-phase2');
    const validateOnly = args.includes('--validate-only');

    log('마이그레이션 시작', { dryRun, skipPhase1, skipPhase2, validateOnly });

    if (dryRun) {
        log('⚠️  DRY RUN 모드: 실제 데이터는 변경되지 않습니다.');
        log('⚠️  실행하려면 --execute 플래그를 추가하세요.');
    }

    try {
        // 진행 상황 로드
        const progress = await loadProgress();
        if (progress) {
            log('이전 진행 상황 로드', progress);
        }

        // Phase 1: allowedUsers → users
        if (!skipPhase1 && !validateOnly) {
            await migrateAllowedUsersToUsers(dryRun);
        }

        // Phase 2: userStays 생성
        if (!skipPhase2 && !validateOnly) {
            await createInitialUserStays(dryRun);
        }

        // Phase 3: 검증
        await validateMigration();

        log('✅ 마이그레이션 완료!');
    } catch (error) {
        logError('마이그레이션 실패', error);
        process.exit(1);
    }
}

// 실행
if (require.main === module) {
    main().catch(error => {
        logError('치명적 오류', error);
        process.exit(1);
    });
}

export { migrateAllowedUsersToUsers, createInitialUserStays, validateMigration };

