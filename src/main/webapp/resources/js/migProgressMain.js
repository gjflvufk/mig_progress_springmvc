// =============================
// 화면 동작 제어용 전역 상태값
// =============================

// 새로고침 주기(초)
let refreshIntervalSeconds = 5;

// 실제 데이터 재조회용 interval ID
let refreshIntervalId = null;

// 남은 초 카운트다운용 interval ID
let refreshCountdownId = null;

// 다음 갱신까지 남은 초
let refreshRemainingSeconds = 5;

// 펼쳐진 그룹 상태 저장용 Set
let openedGroupKeys = new Set();


// =============================
// 서버 호출
// =============================

/**
 * 서버에서 전체 진행 로그를 조회한 뒤
 * 상단 요약과 마스터 테이블을 다시 렌더링한다.
 */
function fetchAllLogs() {
    fetch(window.contextPath + '/mig/progress/all')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            const logs = data || [];
            const summary = calculateSummary(logs);
            const groups = groupMaster(logs);

            renderSummary(summary);
            renderMasterTable(groups);
        })
        .catch(function(error) {
            console.error('전체 로그 조회 실패', error);
        });
}


// =============================
// 자동 새로고침 제어
// =============================

/**
 * 화면의 "다음 갱신 N초" 문구를 갱신한다.
 */
function updateRefreshRemainingText() {
    const target = document.getElementById('refreshRemainingText');

    if (!target) {
        return;
    }

    target.textContent = '다음 갱신 ' + refreshRemainingSeconds + '초';
}

/**
 * 카운트다운 남은 시간을 새로고침 주기값으로 초기화한다.
 */
function resetRefreshCountdown() {
    refreshRemainingSeconds = refreshIntervalSeconds;
    updateRefreshRemainingText();
}

/**
 * 기존 자동 새로고침 interval을 모두 정지한다.
 * 중복 실행 방지용이다.
 */
function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }

    if (refreshCountdownId) {
        clearInterval(refreshCountdownId);
        refreshCountdownId = null;
    }
}

/**
 * 자동 새로고침을 시작한다.
 * - refreshIntervalSeconds 주기마다 데이터 재조회
 * - 1초마다 남은 시간 카운트다운 표시
 */
function startAutoRefresh() {
    stopAutoRefresh();
    resetRefreshCountdown();

    refreshIntervalId = setInterval(function() {
        fetchAllLogs();
        resetRefreshCountdown();
    }, refreshIntervalSeconds * 1000);

    refreshCountdownId = setInterval(function() {
        refreshRemainingSeconds--;

        if (refreshRemainingSeconds <= 0) {
            refreshRemainingSeconds = refreshIntervalSeconds;
        }

        updateRefreshRemainingText();
    }, 1000);
}

/**
 * 새로고침 주기 select 박스 change 이벤트를 바인딩한다.
 * 사용자가 주기를 바꾸면 자동 새로고침도 재시작한다.
 */
function bindRefreshControl() {
    const select = document.getElementById('refreshSeconds');

    if (!select) {
        return;
    }

    select.addEventListener('change', function() {
        refreshIntervalSeconds = parseInt(this.value, 10);
        startAutoRefresh();
    });
}


// =============================
// 초기 실행
// =============================

/**
 * DOM 로드 완료 후 초기 이벤트 바인딩 및 첫 데이터 조회를 수행한다.
 */
document.addEventListener('DOMContentLoaded', function() {
    bindRefreshControl();
    fetchAllLogs();
    startAutoRefresh();
});