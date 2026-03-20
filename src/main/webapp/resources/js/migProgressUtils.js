// =============================
// 공통 유틸 함수
// =============================

/**
 * 숫자에 천 단위 콤마를 붙여 문자열로 반환한다.
 * null/undefined/빈 문자열이면 0으로 처리한다.
 */
function numberFormat(value) {
    if (value === null || value === undefined || value === '') {
        return '0';
    }
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 작업 상태 코드를 화면 표시용 한글 라벨로 변환한다.
 */
function getStatusLabel(status) {
    if (status === 'COMPLETE') return '완료';
    if (status === 'ERROR') return '오류';
    if (status === 'WAIT') return '대기';
    return '진행중';
}

/**
 * 작업 상태 코드에 따라 CSS 클래스명을 반환한다.
 */
function getStatusClass(status) {
    if (status === 'COMPLETE') return 'status-complete';
    if (status === 'ERROR') return 'status-error';
    if (status === 'WAIT') return 'status-wait';
    return 'status-progress';
}

/**
 * HH:mm:ss 형식 문자열을 초(second)로 변환한다.
 */
function toSeconds(hhmmss) {
    if (!hhmmss) {
        return 0;
    }

    const parts = hhmmss.split(':').map(Number);
    if (parts.length !== 3) {
        return 0;
    }

    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
}

/**
 * 초(second)를 HH:mm:ss 형식 문자열로 변환한다.
 */
function formatSeconds(totalSeconds) {
    const hour = Math.floor(totalSeconds / 3600);
    const minute = Math.floor((totalSeconds % 3600) / 60);
    const second = totalSeconds % 60;

    return String(hour).padStart(2, '0')
        + ':' + String(minute).padStart(2, '0')
        + ':' + String(second).padStart(2, '0');
}

/**
 * 문자열 일시값을 Date 객체로 변환한다.
 * 예: "2026-03-20 14:00:00" -> Date
 * 파싱 실패 시 null 반환.
 */
function parseDateTime(dateTimeText) {
    if (!dateTimeText) {
        return null;
    }

    const normalized = dateTimeText.replace(' ', 'T');
    const date = new Date(normalized);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}