// =============================
// 화면 렌더링 전용 함수
// - 서버에서 이미 계산한 summary / groups를 받아서 화면에 표현만 한다.
// - 집계/그룹핑 계산 로직은 자바(ServiceImpl)에서 처리한다.
// =============================

/**
 * 상단 요약 영역 렌더링
 * @param {Object} summary 서버에서 계산해서 내려준 요약 정보
 */
function renderSummary(summary) {
    if (!summary) {
        return;
    }

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

/**
 * 특정 그룹의 상세 로그를 HTML 테이블 문자열로 생성한다.
 * 트리 문자는 직접 넣지 않고, CSS 클래스만 넣어서 트리 모양을 만든다.
 */
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
        logs.forEach(function(log, index) {
            const isLast = index === logs.length - 1;

            html += '<tr>';
            html += '<td class="tree-cell depth-1 ' + (isLast ? 'tree-last' : 'tree-mid') + '">';
            html += '    <span class="tree-node-label">' + (log.tableName || '') + '</span>';
            html += '</td>';
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


/**
 * 마스터 테이블 렌더링
 * @param {Array} groups 서버에서 계산해서 내려준 그룹 목록
 */
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

/**
 * 마스터 행 클릭 토글 바인딩
 */
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
