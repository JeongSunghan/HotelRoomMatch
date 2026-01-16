/**
 * TypeScript 타입 정의 (JSDoc)
 * TypeScript 도입 전까지 타입 힌트를 제공합니다.
 */

/**
 * 사용자 정보
 * @typedef {Object} User
 * @property {string} sessionId - 세션 ID
 * @property {string} name - 이름
 * @property {string} company - 소속 회사
 * @property {'M'|'F'} gender - 성별
 * @property {number|null} age - 나이
 * @property {'no'|'sometimes'|'yes'} snoring - 코골이 여부
 * @property {string|null} selectedRoom - 선택한 방 번호
 * @property {boolean} locked - 방 선택 잠금 여부
 * @property {number} registeredAt - 등록 시간 (timestamp)
 * @property {string} [email] - 이메일 (선택)
 * @property {string} [passKey] - 보안 키 (선택)
 * @property {number} [passKeyExpires] - PassKey 만료 시간 (선택)
 */

/**
 * 객실 게스트 정보
 * @typedef {Object} RoomGuest
 * @property {string} sessionId - 세션 ID
 * @property {string} name - 이름
 * @property {string} company - 소속 회사
 * @property {'M'|'F'} gender - 성별
 * @property {number|null} age - 나이
 * @property {'no'|'sometimes'|'yes'} snoring - 코골이 여부
 */

/**
 * 룸메이트 초대 정보
 * @typedef {Object} Invitation
 * @property {string} id - 초대 ID
 * @property {string} inviterSessionId - 초대한 사람 세션 ID
 * @property {string} inviteeName - 초대받은 사람 이름
 * @property {string} roomNumber - 방 번호
 * @property {'pending'|'accepted'|'rejected'} status - 초대 상태
 * @property {number} timestamp - 생성 시간
 * @property {boolean} [notified] - 알림 여부 (선택)
 */

/**
 * 입실 요청 정보
 * @typedef {Object} JoinRequest
 * @property {string} id - 요청 ID
 * @property {string} fromUserId - 요청자 세션 ID
 * @property {string} fromUserName - 요청자 이름
 * @property {string} toRoomNumber - 목적지 방 번호
 * @property {string} toUserId - 수신자 세션 ID
 * @property {'pending'|'accepted'|'rejected'} status - 요청 상태
 * @property {string[]} warnings - 경고 메시지 목록
 * @property {number} timestamp - 생성 시간
 * @property {RoomGuest} guestInfo - 게스트 전체 정보
 */

/**
 * 방 변경 요청 정보
 * @typedef {Object} RoomChangeRequest
 * @property {string} id - 요청 ID
 * @property {string} sessionId - 사용자 세션 ID
 * @property {string} currentRoom - 현재 방 번호
 * @property {string} reason - 변경 사유
 * @property {'pending'|'resolved'} status - 요청 상태
 * @property {number} timestamp - 생성 시간
 */

/**
 * 문의 정보
 * @typedef {Object} Inquiry
 * @property {string} id - 문의 ID
 * @property {string} name - 문의자 이름
 * @property {string} email - 문의자 이메일
 * @property {string} message - 문의 내용
 * @property {number} createdAt - 생성 시간
 * @property {string} [reply] - 답변 (선택)
 * @property {number} [repliedAt] - 답변 시간 (선택)
 */

/**
 * 객실 정보
 * @typedef {Object} Room
 * @property {string} id - 방 번호
 * @property {number} floor - 층
 * @property {'single'|'twin'} type - 방 타입
 * @property {'M'|'F'} gender - 성별 제한
 * @property {number} capacity - 최대 수용 인원
 * @property {RoomGuest[]} [guests] - 현재 게스트 목록
 */

/**
 * 객실 상태 정보
 * @typedef {Object} RoomStatus
 * @property {'available'|'partial'|'full'|'locked'|'gender-mismatch'} status - 방 상태
 * @property {number} occupancy - 현재 인원
 * @property {number} capacity - 최대 수용 인원
 * @property {RoomGuest[]} guests - 게스트 목록
 */

/**
 * 허용된 사용자 정보 (사전등록)
 * @typedef {Object} AllowedUser
 * @property {string} name - 이름
 * @property {string} email - 이메일
 * @property {string} company - 소속 회사
 * @property {boolean} registered - 등록 완료 여부
 * @property {string} [registeredSessionId] - 등록된 세션 ID (선택)
 * @property {string} [registeredUid] - Firebase Auth UID (선택)
 * @property {number} [registeredAt] - 등록 시간 (선택)
 */

/**
 * 통계 정보
 * @typedef {Object} Stats
 * @property {number} total - 전체 인원
 * @property {number} male - 남성 인원
 * @property {number} female - 여성 인원
 */

/**
 * Toast 알림 옵션
 * @typedef {Object} ToastOptions
 * @property {'success'|'error'|'warning'|'info'} type - Toast 타입
 * @property {string} message - 메시지
 * @property {number} [duration] - 표시 시간 (ms)
 */

/**
 * 에러 정보
 * @typedef {Object} ErrorInfo
 * @property {string} code - 에러 코드
 * @property {string} message - 사용자 친화적 메시지
 * @property {string} originalMessage - 원본 에러 메시지
 * @property {'info'|'warning'|'error'|'critical'} severity - 심각도
 * @property {Object} context - 에러 발생 컨텍스트
 * @property {number} timestamp - 발생 시간
 * @property {string} [stack] - 스택 트레이스 (선택)
 */

export { };
