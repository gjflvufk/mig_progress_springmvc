let refreshIntervalSeconds = 5;
let refreshIntervalId = null;
let refreshCountdownId = null;
let refreshRemainingSeconds = 5;
let openedGroupKeys = new Set();

// ===== 유틸 =====
function numberFormat(value) {
    if (value === null || value === undefined || value === '') {
        return '0';
    }
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getStatusLabel(status) {
    if (status === 'COMPLETE') return '완료';
    if (status === 'ERROR') return '오류';
    if (status === 'WAIT') return '대기';
    return '진행중';
}

function getStatusClass(status) {
    if (status === 'COMPLETE') return 'status-complete';
    if (status === 'ERROR') return 'status-error';
    if (status === 'WAIT') return 'status-wait';
    return 'status-progress';
}

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

function formatSeconds(totalSeconds) {
    const hour = Math.floor(totalSeconds / 3600);
    const minute = Math.floor((totalSeconds % 3600) / 60);
    const second = totalSeconds % 60;

    return String(hour).padStart(2, '0')
        + ':' + String(minute).padStart(2, '0')
        + ':' + String(second).padStart(2, '0');
}

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

// ===== 상단 통계 계산 =====
function calculateSummary(logs) {
    const totalCount = logs.length;
    let completedCount = 0;
    let errorCount = 0;
    let runningCount = 0;
    let minStartTime = null;
    let maxEndTime = null;

    logs.forEach(function(log) {
        if (log.jobStatus === 'COMPLETE') completedCount++;
        if (log.jobStatus === 'ERROR') errorCount++;
        if (log.jobStatus === 'RUNNING') runningCount++;

        const startDate = parseDateTime(log.startTime);
        const endDate = parseDateTime(log.endTime);

        if (startDate && (!minStartTime || startDate < minStartTime)) {
            minStartTime = startDate;
        }

        if (endDate && (!maxEndTime || endDate > maxEndTime)) {
            maxEndTime = endDate;
        }
    });

    const remainCount = Math.max(0, totalCount - completedCount - errorCount);
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
        remainCount: remainCount,
        progressRate: progressRate,
        elapsedTime: elapsedTime,
        targetTime: '08:00:00'
    };
}

function renderSummary(summary) {
    const timeProgress = Math.min(
        100,
        Math.floor((toSeconds(summary.elapsedTime) / Math.max(1, toSeconds(summary.targetTime))) * 100)
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

// ===== 로그를 마스터 그룹으로 변환 =====
function groupMaster(logs) {
    const groupMap = {};

    logs.forEach(function(log) {
        const key = (log.jobLvl1 || '') + '||' + (log.jobLvl2 || '');

        if (!groupMap[key]) {
            groupMap[key] = {
                groupKey: key,
                jobLvl1: log.jobLvl1 || '',
                jobLvl2: log.jobLvl2 || '',
                logs: [],
                targetTableCount: 0,
                completedTableCount: 0,
                errorTableCount: 0,
                runningTableCount: 0,
                remainTableCount: 0,
                progressRate: 0,
                jobStatus: 'WAIT'
            };
        }

        groupMap[key].logs.push(log);
    });

    const result = Object.keys(groupMap).map(function(key) {
        const group = groupMap[key];

        group.targetTableCount = group.logs.length;
        group.completedTableCount = group.logs.filter(function(log) { return log.jobStatus === 'COMPLETE'; }).length;
        group.errorTableCount = group.logs.filter(function(log) { return log.jobStatus === 'ERROR'; }).length;
        group.runningTableCount = group.logs.filter(function(log) { return log.jobStatus === 'RUNNING'; }).length;
        group.remainTableCount = Math.max(0, group.targetTableCount - group.completedTableCount - group.errorTableCount);
        group.progressRate = group.targetTableCount > 0
            ? Math.floor((group.completedTableCount / group.targetTableCount) * 100)
            : 0;

        if (group.errorTableCount > 0) {
            group.jobStatus = 'ERROR';
        } else if (group.completedTableCount === group.targetTableCount) {
            group.jobStatus = 'COMPLETE';
        } else if (group.runningTableCount > 0 || group.completedTableCount > 0) {
            group.jobStatus = 'RUNNING';
        } else {
            group.jobStatus = 'WAIT';
        }

        group.logs.sort(function(a, b) {
            return (a.tableName || '').localeCompare(b.tableName || '');
        });

        return group;
    });

    result.sort(function(a, b) {
        if (a.jobLvl1 === b.jobLvl1) {
            return a.jobLvl2.localeCompare(b.jobLvl2);
        }
        return a.jobLvl1.localeCompare(b.jobLvl1);
    });

    return result;
}

// ===== 상세 테이블 HTML =====
function createDetailTable(logs) {
    let html = '';
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

    if (!logs || logs.length === 0) {
        html += '<tr><td colspan="9" class="empty-message">상세 데이터가 없습니다.</td></tr>';
    } else {
        logs.forEach(function(log) {
            html += '<tr>';
            html += '<td class="tree-cell"><span class="tree-branch">└─</span>' + (log.tableName || '') + '</td>';
            html += '<td>' + (log.tableKorName || '') + '</td>';
            html += '<td>' + (log.startTime || '') + '</td>';
            html += '<td>' + (log.endTime || '') + '</td>';
            html += '<td>' + (log.elapsedTime || '') + '</td>';
            html += '<td>' + numberFormat(log.beforeCount) + '</td>';
            html += '<td>' + numberFormat(log.afterCount) + '</td>';
            html += '<td>' + numberFormat(log.diffCount) + '</td>';
            html += '<td><span class="' + getStatusClass(log.jobStatus) + '">' + getStatusLabel(log.jobStatus) + '</span></td>';
            html += '</tr>';
        });
    }

    html += '</tbody>';
    html += '</table>';
    return html;
}

// ===== 마스터 테이블 렌더링 =====
function renderMasterTable(groups) {
    const tbody = document.getElementById('masterTableBody');

    if (!tbody) {
        return;
    }

    let html = '';

    if (!groups || groups.length === 0) {
        html += '<tr><td colspan="8" class="empty-message">데이터가 없습니다.</td></tr>';
        tbody.innerHTML = html;
        return;
    }

    groups.forEach(function(group) {
        const opened = openedGroupKeys.has(group.groupKey);

        html += '<tr class="master-row' + (opened ? ' selected' : '') + '" data-group-key="' + group.groupKey + '">';
        html += '<td><span class="toggle-icon">' + (opened ? '▼' : '▶') + '</span>' + (group.jobLvl1 || '') + '</td>';
        html += '<td>' + (group.jobLvl2 || '') + '</td>';
        html += '<td>' + (group.progressRate || 0) + '%</td>';
        html += '<td>' + numberFormat(group.targetTableCount) + '</td>';
        html += '<td>' + numberFormat(group.completedTableCount) + '</td>';
        html += '<td>' + numberFormat(group.errorTableCount) + '</td>';
        html += '<td>' + numberFormat(group.remainTableCount) + '</td>';
        html += '<td><span class="' + getStatusClass(group.jobStatus) + '">' + getStatusLabel(group.jobStatus) + '</span></td>';
        html += '</tr>';

        html += '<tr class="detail-row' + (opened ? ' open' : '') + '" id="detail-row-' + group.groupKey + '">';
        html += '<td colspan="8" class="detail-cell">';
        html += createDetailTable(group.logs);
        html += '</td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
    bindToggle();
}

// ===== 토글 =====
function bindToggle() {
    document.querySelectorAll('.master-row').forEach(function(row) {
        row.addEventListener('click', function() {
            const key = row.getAttribute('data-group-key');

            if (openedGroupKeys.has(key)) {
                openedGroupKeys.delete(key);
            } else {
                openedGroupKeys.add(key);
            }

            const detail = document.getElementById('detail-row-' + key);
            const icon = row.querySelector('.toggle-icon');

            if (!detail) {
                return;
            }

            const isOpen = detail.classList.contains('open');

            if (isOpen) {
                detail.classList.remove('open');
                row.classList.remove('selected');
                if (icon) {
                    icon.textContent = '▶';
                }
            } else {
                detail.classList.add('open');
                row.classList.add('selected');
                if (icon) {
                    icon.textContent = '▼';
                }
            }
        });
    });
}

// ===== 서버 호출 =====
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

// ===== 자동 새로고침 =====
function updateRefreshRemainingText() {
    document.getElementById('refreshRemainingText').textContent =
        '다음 갱신 ' + refreshRemainingSeconds + '초';
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

// ===== 시작 =====
document.addEventListener('DOMContentLoaded', function() {
    bindRefreshControl();
    fetchAllLogs();
    startAutoRefresh();
});