/**
 * 이 파일 역할
 * ------------------------------------------------------------------
 * 1) /mig/progress/all.do API 호출
 * 2) 전체 로그로부터 통계 계산
 * 3) 마스터 그리드 / 상세 그리드 렌더링
 * 4) 새로고침 주기 제어
 */

let refreshIntervalSeconds = 5;
let refreshIntervalId = null;
let refreshCountdownId = null;
let refreshRemainingSeconds = 5;
let openedGroupKey = null;

function numberFormat(value) {
    if (value === null || value === undefined || value === '') {
        return '0';
    }
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getStatusLabel(status) {
    switch (status) {
        case 'RUNNING': return '진행중';
        case 'COMPLETE': return '완료';
        case 'ERROR': return '오류';
        default: return '대기';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'RUNNING': return 'status-running';
        case 'COMPLETE': return 'status-complete';
        case 'ERROR': return 'status-error';
        default: return 'status-wait';
    }
}

function toSeconds(hhmmss) {
    const parts = hhmmss.split(':').map(Number);
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
}

function formatSeconds(totalSeconds) {
    const hour = Math.floor(totalSeconds / 3600);
    const minute = Math.floor((totalSeconds % 3600) / 60);
    const second = totalSeconds % 60;

    return String(hour).padStart(2, '0') + ':'
        + String(minute).padStart(2, '0') + ':'
        + String(second).padStart(2, '0');
}

/**
 * 전체 로그 배열로부터 상단 요약 통계를 계산한다.
 *
 * 지금은 프론트에서 직접 계산하지만,
 * 나중에 데이터가 너무 많아지면 Service 쪽으로 옮길 수 있다.
 */
function calculateSummary(logs) {
    const totalCount = logs.length;
    let completedCount = 0;
    let errorCount = 0;
    let runningCount = 0;
    let minStartTime = null;
    let maxEndTime = null;

    logs.forEach(function (log) {
        if (log.jobStatus === 'COMPLETE') completedCount++;
        if (log.jobStatus === 'ERROR') errorCount++;
        if (log.jobStatus === 'RUNNING') runningCount++;

        if (log.startTime) {
            const startDate = new Date(log.startTime.replace(' ', 'T'));
            if (!minStartTime || startDate < minStartTime) {
                minStartTime = startDate;
            }
        }

        if (log.endTime) {
            const endDate = new Date(log.endTime.replace(' ', 'T'));
            if (!maxEndTime || endDate > maxEndTime) {
                maxEndTime = endDate;
            }
        }
    });

    const remainCount = totalCount - completedCount - errorCount;
    const progressRate = totalCount > 0 ? Math.floor((completedCount / totalCount) * 100) : 0;

    let elapsedTime = '00:00:00';
    if (minStartTime) {
        const endBase = maxEndTime ? maxEndTime : new Date();
        const diffSeconds = Math.max(0, Math.floor((endBase.getTime() - minStartTime.getTime()) / 1000));
        elapsedTime = formatSeconds(diffSeconds);
    }

    return {
        totalCount: totalCount,
        completedCount: completedCount,
        errorCount: errorCount,
        runningCount: runningCount,
        remainCount: remainCount < 0 ? 0 : remainCount,
        progressRate: progressRate,
        elapsedTime: elapsedTime,
        targetTime: '08:00:00'
    };
}

/**
 * 로그를 업무 Level1 + Level2 기준으로 그룹핑해서 마스터 그리드용 데이터로 바꾼다.
 */
function groupMaster(logs) {
    const groupMap = {};

    logs.forEach(function (log) {
        const key = log.jobLvl1 + '||' + log.jobLvl2;

        if (!groupMap[key]) {
            groupMap[key] = {
                groupKey: key,
                jobLvl1: log.jobLvl1,
                jobLvl2: log.jobLvl2,
                logs: []
            };
        }

        groupMap[key].logs.push(log);
    });

    const groups = Object.keys(groupMap).map(function (key) {
        const group = groupMap[key];

        const targetTableCount = group.logs.length;
        const completedTableCount = group.logs.filter(function (log) { return log.jobStatus === 'COMPLETE'; }).length;
        const errorTableCount = group.logs.filter(function (log) { return log.jobStatus === 'ERROR'; }).length;
        const runningTableCount = group.logs.filter(function (log) { return log.jobStatus === 'RUNNING'; }).length;
        const remainTableCount = targetTableCount - completedTableCount - errorTableCount;
        const progressRate = targetTableCount > 0 ? Math.floor((completedTableCount / targetTableCount) * 100) : 0;

        let jobStatus = 'WAIT';
        if (errorTableCount > 0) {
            jobStatus = 'ERROR';
        } else if (completedTableCount === targetTableCount) {
            jobStatus = 'COMPLETE';
        } else if (runningTableCount > 0 || completedTableCount > 0) {
            jobStatus = 'RUNNING';
        }

        group.logs.sort(function (a, b) {
            return a.tableName.localeCompare(b.tableName);
        });

        return {
            groupKey: group.groupKey,
            jobLvl1: group.jobLvl1,
            jobLvl2: group.jobLvl2,
            targetTableCount: targetTableCount,
            completedTableCount: completedTableCount,
            errorTableCount: errorTableCount,
            remainTableCount: remainTableCount,
            progressRate: progressRate,
            jobStatus: jobStatus,
            logs: group.logs
        };
    });

    groups.sort(function (a, b) {
        if (a.jobLvl1 === b.jobLvl1) {
            return a.jobLvl2.localeCompare(b.jobLvl2);
        }
        return a.jobLvl1.localeCompare(b.jobLvl1);
    });

    return groups;
}

function renderSummary(summary) {
    const timeProgress = Math.min(
        100,
        Math.floor((toSeconds(summary.elapsedTime) / toSeconds(summary.targetTime)) * 100)
    );

    document.getElementById('completedOverTotalText').textContent =
        numberFormat(summary.completedCount) + ' / ' + numberFormat(summary.totalCount);

    document.getElementById('remainCountText').textContent = numberFormat(summary.remainCount);
    document.getElementById('totalProgressText').textContent = summary.progressRate + '%';
    document.getElementById('totalProgressBar').style.width = summary.progressRate + '%';

    document.getElementById('totalTargetTableCount').textContent = numberFormat(summary.totalCount);
    document.getElementById('totalCompletedTableCount').textContent = numberFormat(summary.completedCount);
    document.getElementById('totalErrorTableCount').textContent = numberFormat(summary.errorCount);
    document.getElementById('totalRunningTableCount').textContent = numberFormat(summary.runningCount);

    document.getElementById('elapsedTimeText').textContent = summary.elapsedTime;
    document.getElementById('targetTimeText').textContent = summary.targetTime;
    document.getElementById('timeProgressText').textContent = timeProgress + '%';
}

function createDetailTable(logs) {
    let html = '';
    html += '<div class="detail-box">';
    html += '<div class="detail-title">테이블 상세 현황</div>';
    html += '<table class="detail-grid">';
    html += '<thead>';
    html += '<tr>';
    html += '<th>테이블명</th>';
    html += '<th>테이블한글명</th>';
    html += '<th>시작시간</th>';
    html += '<th>종료시간</th>';
    html += '<th>소요시간</th>';
    html += '<th>시작건수</th>';
    html += '<th>사후건수</th>';
    html += '<th>차이건수</th>';
    html += '<th>작업상태</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    logs.forEach(function (log) {
        html += '<tr>';
        html += '<td class="text-left">' + log.tableName + '</td>';
        html += '<td class="text-left">' + log.tableKorName + '</td>';
        html += '<td>' + (log.startTime || '') + '</td>';
        html += '<td>' + (log.endTime || '') + '</td>';
        html += '<td>' + (log.elapsedTime || '00:00:00') + '</td>';
        html += '<td>' + numberFormat(log.beforeCount) + '</td>';
        html += '<td>' + numberFormat(log.afterCount) + '</td>';
        html += '<td>' + numberFormat(log.diffCount) + '</td>';
        html += '<td><span class="status-badge ' + getStatusClass(log.jobStatus) + '">' + getStatusLabel(log.jobStatus) + '</span></td>';
        html += '</tr>';
    });

    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    return html;
}

function renderMasterTable(groups) {
    const tbody = document.getElementById('masterTableBody');
    let html = '';

    groups.forEach(function (group) {
        const safeKey = group.groupKey.replace(/\|\|/g, '_');

        html += '<tr class="data-row" data-group-key="' + group.groupKey + '">';
        html += '<td>' + group.jobLvl1 + '</td>';
        html += '<td>' + group.jobLvl2 + '</td>';
        html += '<td>' + group.progressRate + '%</td>';
        html += '<td>' + numberFormat(group.targetTableCount) + '</td>';
        html += '<td>' + numberFormat(group.completedTableCount) + '</td>';
        html += '<td>' + numberFormat(group.errorTableCount) + '</td>';
        html += '<td>' + numberFormat(group.remainTableCount) + '</td>';
        html += '<td><span class="status-badge ' + getStatusClass(group.jobStatus) + '">' + getStatusLabel(group.jobStatus) + '</span></td>';
        html += '</tr>';

        html += '<tr class="detail-row" id="detail-row-' + safeKey + '">';
        html += '<td colspan="8" class="detail-cell">';
        html += createDetailTable(group.logs);
        html += '</td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;

    document.querySelectorAll('.data-row').forEach(function (row) {
        row.addEventListener('click', function () {
            const groupKey = this.getAttribute('data-group-key');
            const detailId = 'detail-row-' + groupKey.replace(/\|\|/g, '_');
            const detailRow = document.getElementById(detailId);
            const isOpen = detailRow.classList.contains('open');

            document.querySelectorAll('.detail-row').forEach(function (dr) {
                dr.classList.remove('open');
            });

            document.querySelectorAll('.data-row').forEach(function (r) {
                r.classList.remove('selected');
            });

            if (!isOpen) {
                detailRow.classList.add('open');
                this.classList.add('selected');
                openedGroupKey = groupKey;
            } else {
                openedGroupKey = null;
            }
        });
    });

    if (openedGroupKey) {
        const selectedRow = document.querySelector('.data-row[data-group-key="' + openedGroupKey + '"]');
        const selectedDetailRow = document.getElementById('detail-row-' + openedGroupKey.replace(/\|\|/g, '_'));

        if (selectedRow && selectedDetailRow) {
            selectedRow.classList.add('selected');
            selectedDetailRow.classList.add('open');
        }
    }
}

/**
 * Controller 의 전체조회 API 호출.
 *
 * 백엔드는 전체 로그만 반환하고,
 * 통계와 화면 가공은 프론트가 수행한다.
 */
function fetchAllLogs() {
    fetch(window.appContextPath + '/mig/progress/all.do')
        .then(function (response) {
            return response.json();
        })
        .then(function (logs) {
            const summary = calculateSummary(logs || []);
            const groups = groupMaster(logs || []);

            renderSummary(summary);
            renderMasterTable(groups);
        })
        .catch(function (error) {
            console.error('전체 로그 조회 실패', error);
        });
}

function updateRefreshRemainingText() {
    document.getElementById('refreshRemainingText').textContent = '다음 갱신 ' + refreshRemainingSeconds + '초';
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

    refreshIntervalId = setInterval(function () {
        fetchAllLogs();
        resetRefreshCountdown();
    }, refreshIntervalSeconds * 1000);

    refreshCountdownId = setInterval(function () {
        refreshRemainingSeconds--;
        if (refreshRemainingSeconds <= 0) {
            refreshRemainingSeconds = refreshIntervalSeconds;
        }
        updateRefreshRemainingText();
    }, 1000);
}

function bindRefreshControl() {
    document.getElementById('refreshSeconds').addEventListener('change', function () {
        refreshIntervalSeconds = parseInt(this.value, 10);
        startAutoRefresh();
    });
}

window.onload = function () {
    bindRefreshControl();
    fetchAllLogs();
    startAutoRefresh();
};
