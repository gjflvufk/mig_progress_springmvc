// =============================
// 화면 제어 + 서버 호출 전용
// - summary 계산 / 그룹핑 계산은 서버에서 완료된 상태로 내려온다.
// - JS는 응답을 받아 화면에 반영만 한다.
// =============================

let refreshIntervalSeconds = 5;
let refreshIntervalId = null;
let refreshCountdownId = null;
let refreshRemainingSeconds = 5;
let openedGroupKeys = new Set();

function fetchAllProgress() {
    fetch(window.contextPath + '/mig/progress/all')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            const summary = data && data.summary ? data.summary : null;
            const groups = data && data.groups ? data.groups : [];

            renderSummary(summary);
            renderMasterTable(groups);
        })
        .catch(function(error) {
            console.error('전체 진행률 조회 실패', error);
        });
}

function updateRefreshRemainingText() {
    const target = document.getElementById('refreshRemainingText');

    if (!target) {
        return;
    }

    target.textContent = '다음 갱신 ' + refreshRemainingSeconds + '초';
}

function resetRefreshCountdown() {
    refreshRemainingSeconds = refreshIntervalSeconds;
    updateRefreshRemainingText();
}

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

function startAutoRefresh() {
    stopAutoRefresh();
    resetRefreshCountdown();

    refreshIntervalId = setInterval(function() {
        fetchAllProgress();
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

document.addEventListener('DOMContentLoaded', function() {
    bindRefreshControl();
    fetchAllProgress();
    startAutoRefresh();
});
