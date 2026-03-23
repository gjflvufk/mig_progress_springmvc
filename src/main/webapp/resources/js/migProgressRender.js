// =============================
// 화면 계산 및 렌더링 함수
// =============================

// ---------------------------------------------------------------------
// [calculateSummary]
// 전체 로그 배열(logs)을 받아서
// 화면 상단에 표시할 요약 통계값을 계산하는 함수
//
// 예를 들면:
// - 전체 대상 건수
// - 완료 건수
// - 오류 건수
// - 진행중 건수
// - 남은 건수
// - 전체 진행률
// - 전체 경과 시간
//
// 이 함수는 "화면에 바로 그리는 역할"이 아니라
// "그리기 전에 필요한 값을 계산해서 객체로 반환하는 역할"이다.
// ---------------------------------------------------------------------
function calculateSummary(logs) {
    // 전체 로그 건수
    // logs가 배열이므로 length로 개수를 구한다.
    const totalCount = logs.length;

    // 상태별 건수를 세기 위한 변수들
    let completedCount = 0; // 완료 건수
    let errorCount = 0;     // 오류 건수
    let runningCount = 0;   // 진행중 건수

    // 전체 시작/종료 시각 범위를 구하기 위한 변수
    // minStartTime: 가장 빠른 시작시간
    // maxEndTime: 가장 늦은 종료시간
    let minStartTime = null;
    let maxEndTime = null;

    // logs 배열을 하나씩 순회하면서 요약 정보를 계산한다.
    logs.forEach(function(log) {
        // jobStatus 값에 따라 건수를 증가시킨다.
        if (log.jobStatus === 'COMPLETE') completedCount++;
        if (log.jobStatus === 'ERROR') errorCount++;
        if (log.jobStatus === 'RUNNING') runningCount++;

        // 문자열 형태의 시작/종료 시간을 Date 객체로 변환한다.
        // parseDateTime은 별도 유틸 함수라고 보면 된다.
        const startDate = parseDateTime(log.startTime);
        const endDate = parseDateTime(log.endTime);

        // 가장 빠른 시작시간 찾기
        // 아직 minStartTime이 없거나, 현재 시작시간이 더 빠르면 교체
        if (startDate && (!minStartTime || startDate < minStartTime)) {
            minStartTime = startDate;
        }

        // 가장 늦은 종료시간 찾기
        // 아직 maxEndTime이 없거나, 현재 종료시간이 더 늦으면 교체
        if (endDate && (!maxEndTime || endDate > maxEndTime)) {
            maxEndTime = endDate;
        }
    });

    // 남은 건수
    // 전체 - 완료 - 오류
    // 음수가 되지 않도록 Math.max(0, ...) 처리
    const remainCount = Math.max(0, totalCount - completedCount - errorCount);

    // 전체 진행률(%)
    // 완료 건수 / 전체 건수 * 100
    // 전체 건수가 0이면 0으로 처리
    const progressRate = totalCount > 0 ? Math.floor((completedCount / totalCount) * 100) : 0;

    // 기본 경과시간은 00:00:00으로 초기화
    let elapsedTime = '00:00:00';

    // 시작시간이 하나라도 있으면 경과시간을 계산한다.
    if (minStartTime) {
        // 종료시간이 존재하면 가장 늦은 종료시간을 기준으로,
        // 종료시간이 없으면 "현재 시간(new Date())" 기준으로 계산한다.
        // 즉 아직 진행중인 작업이 있으면 현재까지의 경과시간으로 본다.
        const endBase = maxEndTime ? maxEndTime : new Date();

        // millisecond 차이를 second 단위로 변환
        const diffSeconds = Math.max(
            0,
            Math.floor((endBase.getTime() - minStartTime.getTime()) / 1000)
        );

        // 초(second)를 HH:mm:ss 문자열로 변환
        elapsedTime = formatSeconds(diffSeconds);
    }

    // 계산한 요약 정보를 객체 형태로 반환
    // 이 반환값이 나중에 renderSummary(summary)로 넘어간다.
    return {
        totalCount: totalCount,           // 전체 건수
        completedCount: completedCount,   // 완료 건수
        errorCount: errorCount,           // 오류 건수
        runningCount: runningCount,       // 진행중 건수
        remainCount: remainCount,         // 잔여 건수
        progressRate: progressRate,       // 진행률(%)
        elapsedTime: elapsedTime,         // 전체 경과시간
        targetTime: '08:00:00'            // 목표 시간(현재는 고정값)
    };
}

// ---------------------------------------------------------------------
// [renderSummary]
// calculateSummary에서 계산된 summary 객체를 받아서
// 실제 HTML 화면의 상단 요약 영역에 값을 넣는 함수
//
// 즉 이 함수는 "계산"이 아니라 "화면 반영"이 목적이다.
// ---------------------------------------------------------------------
function renderSummary(summary) {
    // 경과시간 / 목표시간 비율을 퍼센트로 계산
    // 예: 경과시간이 4시간, 목표시간이 8시간이면 50%
    // Math.min(100, ...) 으로 최대 100%까지만 표시
    const timeProgress = Math.min(
        100,
        Math.floor((toSeconds(summary.elapsedTime) / Math.max(1, toSeconds(summary.targetTime))) * 100)
    );

    // "완료건수 / 전체건수" 형식으로 표시
    // numberFormat은 천 단위 콤마를 붙여주는 유틸 함수
    document.getElementById('completedOverTotalText').textContent =
        numberFormat(summary.completedCount) + ' / ' + numberFormat(summary.totalCount);

    // 잔여 건수 표시
    document.getElementById('remainCountText').textContent = numberFormat(summary.remainCount);

    // 전체 진행률 텍스트 표시
    document.getElementById('totalProgressText').textContent = summary.progressRate + '%';

    // 진행률 바의 width를 퍼센트로 지정
    // 예: 70이면 width = "70%"
    document.getElementById('totalProgressBar').style.width = summary.progressRate + '%';

    // 요약 테이블(또는 카드)에 각 수치 반영
    document.getElementById('totalTargetTableCount').textContent = numberFormat(summary.totalCount);
    document.getElementById('totalCompletedTableCount').textContent = numberFormat(summary.completedCount);
    document.getElementById('totalErrorTableCount').textContent = numberFormat(summary.errorCount);
    document.getElementById('totalRunningTableCount').textContent = numberFormat(summary.runningCount);

    // 시간 관련 텍스트 표시
    document.getElementById('elapsedTimeText').textContent = summary.elapsedTime;
    document.getElementById('targetTimeText').textContent = summary.targetTime;
    document.getElementById('timeProgressText').textContent = timeProgress + '%';
}

// ---------------------------------------------------------------------
// [groupMaster]
// 원본 로그 목록(logs)을
// jobLvl1 + jobLvl2 기준으로 그룹핑하는 함수
//
// 예를 들면:
// - jobLvl1 = "카드"
// - jobLvl2 = "회원"
//
// 이런 값이 같은 로그들을 하나의 그룹으로 묶는다.
//
// 그리고 각 그룹마다:
// - 대상 건수
// - 완료 건수
// - 오류 건수
// - 진행중 건수
// - 남은 건수
// - 진행률
// - 대표 상태
// 를 계산해서 반환한다.
//
// 반환 결과는 "마스터 테이블" 렌더링에 사용된다.
// ---------------------------------------------------------------------
function groupMaster(logs) {
    // 그룹별 데이터를 임시로 담아둘 객체
    // key를 기준으로 그룹을 누적한다.
    const groupMap = {};

    // 전체 로그를 하나씩 순회하면서 그룹에 담는다.
    logs.forEach(function(log) {
        // 그룹 키 생성
        // jobLvl1 + "||" + jobLvl2 조합으로 유니크 키를 만든다.
        const key = (log.jobLvl1 || '') + '||' + (log.jobLvl2 || '');

        // 아직 해당 그룹이 없으면 새로 생성
        if (!groupMap[key]) {
            groupMap[key] = {
                groupKey: key,             // 그룹 고유 키
                jobLvl1: log.jobLvl1 || '',// 1차 분류명
                jobLvl2: log.jobLvl2 || '',// 2차 분류명
                logs: [],                  // 이 그룹에 속한 원본 로그 목록
                targetTableCount: 0,       // 그룹 전체 대상 건수
                completedTableCount: 0,    // 그룹 완료 건수
                errorTableCount: 0,        // 그룹 오류 건수
                runningTableCount: 0,      // 그룹 진행중 건수
                remainTableCount: 0,       // 그룹 잔여 건수
                progressRate: 0,           // 그룹 진행률
                jobStatus: 'WAIT'          // 그룹 대표 상태
            };
        }

        // 해당 그룹의 logs 배열에 현재 로그 추가
        groupMap[key].logs.push(log);
    });

    // groupMap 객체를 실제 배열 형태로 바꾼다.
    const result = Object.keys(groupMap).map(function(key) {
        const group = groupMap[key];

        // 그룹 대상 건수 = 해당 그룹의 로그 개수
        group.targetTableCount = group.logs.length;

        // 상태별 개수 계산
        group.completedTableCount = group.logs.filter(function(log) {
            return log.jobStatus === 'COMPLETE';
        }).length;

        group.errorTableCount = group.logs.filter(function(log) {
            return log.jobStatus === 'ERROR';
        }).length;

        group.runningTableCount = group.logs.filter(function(log) {
            return log.jobStatus === 'RUNNING';
        }).length;

        // 남은 건수 계산
        group.remainTableCount = Math.max(
            0,
            group.targetTableCount - group.completedTableCount - group.errorTableCount
        );

        // 진행률 계산
        group.progressRate = group.targetTableCount > 0
            ? Math.floor((group.completedTableCount / group.targetTableCount) * 100)
            : 0;

        // 그룹 대표 상태 결정
        // 우선순위:
        // 1) 오류가 하나라도 있으면 ERROR
        // 2) 전부 완료면 COMPLETE
        // 3) 진행중이 있거나 일부 완료면 RUNNING
        // 4) 그 외는 WAIT
        if (group.errorTableCount > 0) {
            group.jobStatus = 'ERROR';
        } else if (group.completedTableCount === group.targetTableCount) {
            group.jobStatus = 'COMPLETE';
        } else if (group.runningTableCount > 0 || group.completedTableCount > 0) {
            group.jobStatus = 'RUNNING';
        } else {
            group.jobStatus = 'WAIT';
        }

        // 그룹 내부 상세 로그는 테이블명 기준 정렬
        group.logs.sort(function(a, b) {
            return (a.tableName || '').localeCompare(b.tableName || '');
        });

        return group;
    });

    // 최종 그룹 배열 정렬
    // 먼저 jobLvl1, 같으면 jobLvl2 기준으로 정렬
    result.sort(function(a, b) {
        if (a.jobLvl1 === b.jobLvl1) {
            return a.jobLvl2.localeCompare(b.jobLvl2);
        }
        return a.jobLvl1.localeCompare(b.jobLvl1);
    });

    return result;
}

// ---------------------------------------------------------------------
// [createDetailTable]
// 특정 그룹의 상세 로그 목록을 받아서
// HTML 문자열 형태의 상세 테이블을 만들어 반환하는 함수
//
// 반환값은 실제 DOM 객체가 아니라 "HTML 문자열"이다.
// 나중에 innerHTML로 화면에 삽입된다.
// ---------------------------------------------------------------------
function createDetailTable(logs) {
    let html = '';

    // 테이블 시작
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

    // 상세 데이터가 없는 경우 빈 메시지 출력
    if (!logs || logs.length === 0) {
        html += '<tr><td colspan="9" class="empty-message">상세 데이터가 없습니다.</td></tr>';
    } else {
        // 상세 데이터가 있으면 행(row)을 하나씩 생성
        logs.forEach(function(log) {
            html += '<tr>';

            // 테이블명 앞에 트리 모양 표시
            html += '<td class="tree-cell"><span class="tree-branch">└─</span>' + (log.tableName || '') + '</td>';

            // 나머지 컬럼들 출력
            html += '<td>' + (log.tableKorName || '') + '</td>';
            html += '<td>' + (log.startTime || '') + '</td>';
            html += '<td>' + (log.endTime || '') + '</td>';
            html += '<td>' + (log.elapsedTime || '') + '</td>';
            html += '<td>' + numberFormat(log.beforeCount) + '</td>';
            html += '<td>' + numberFormat(log.afterCount) + '</td>';
            html += '<td>' + numberFormat(log.diffCount) + '</td>';

            // 상태는 라벨과 CSS 클래스 모두 적용해서 출력
            html += '<td><span class="' + getStatusClass(log.jobStatus) + '">' + getStatusLabel(log.jobStatus) + '</span></td>';

            html += '</tr>';
        });
    }

    // 테이블 닫기
    html += '</tbody>';
    html += '</table>';

    return html;
}

// ---------------------------------------------------------------------
// [renderMasterTable]
// groupMaster(logs)로 만들어진 그룹 배열(groups)을 받아서
// 마스터 테이블 전체를 다시 그리는 함수
//
// 이 함수는:
// 1) 마스터 행 생성
// 2) 각 마스터 행 아래 상세 행 생성
// 3) tbody에 innerHTML로 통째로 반영
// 4) 클릭 이벤트(bindToggle) 다시 연결
// 을 수행한다.
// ---------------------------------------------------------------------
function renderMasterTable(groups) {
    // 마스터 테이블 본문 영역(tbody) 찾기
    const tbody = document.getElementById('masterTableBody');

    // tbody가 없으면 더 이상 진행하지 않음
    if (!tbody) {
        return;
    }

    let html = '';

    // 그룹 데이터가 없으면 빈 메시지를 표시하고 종료
    if (!groups || groups.length === 0) {
        html += '<tr><td colspan="8" class="empty-message">데이터가 없습니다.</td></tr>';
        tbody.innerHTML = html;
        return;
    }

    // 각 그룹마다 마스터 행 + 상세 행을 생성
    groups.forEach(function(group) {
        // 이 그룹이 현재 펼쳐져 있는지 여부
        // openedGroupKeys는 외부(전역)에서 관리하는 Set이라고 보면 된다.
        const opened = openedGroupKeys.has(group.groupKey);

        // -------------------------
        // 1. 마스터 행 생성
        // -------------------------
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

        // -------------------------
        // 2. 상세 행 생성
        // -------------------------
        // 마스터 행 아래에 숨겨진 상세 row를 붙여둔다.
        // opened 상태면 open 클래스를 추가해서 화면에 보이게 한다.
        html += '<tr class="detail-row' + (opened ? ' open' : '') + '" id="detail-row-' + group.groupKey + '">';
        html += '<td colspan="8" class="detail-cell">';
        html += createDetailTable(group.logs);
        html += '</td>';
        html += '</tr>';
    });

    // 기존 tbody 내용을 새 HTML로 통째로 교체
    tbody.innerHTML = html;

    // innerHTML로 다시 그리면 기존 이벤트가 사라지므로
    // 마스터 행 클릭 이벤트를 다시 연결해야 한다.
    bindToggle();
}

// ---------------------------------------------------------------------
// [bindToggle]
// 마스터 행(.master-row)을 클릭했을 때
// 바로 아래 상세 행(.detail-row)을 열고 닫는 이벤트를 연결하는 함수
//
// 이 함수는 renderMasterTable에서 HTML을 다시 그린 직후마다
// 다시 호출되어야 한다.
// ---------------------------------------------------------------------
function bindToggle() {
    // 현재 화면에 있는 모든 마스터 행을 찾는다.
    document.querySelectorAll('.master-row').forEach(function(row) {
        // 각 마스터 행에 클릭 이벤트 추가
        row.addEventListener('click', function() {
            // 이 마스터 행이 어떤 그룹인지 식별하기 위한 key
            const key = row.getAttribute('data-group-key');

            // 현재 열린 그룹 Set에 key를 넣거나 제거해서
            // 열린 상태를 기억한다.
            if (openedGroupKeys.has(key)) {
                openedGroupKeys.delete(key);
            } else {
                openedGroupKeys.add(key);
            }

            // 이 그룹에 해당하는 상세 row 찾기
            const detail = document.getElementById('detail-row-' + key);

            // 토글 아이콘(▶ / ▼) 찾기
            const icon = row.querySelector('.toggle-icon');

            // 상세 row가 없으면 종료
            if (!detail) {
                return;
            }

            // 현재 열려 있는지 여부 확인
            const isOpen = detail.classList.contains('open');

            // 이미 열려 있으면 닫기 처리
            if (isOpen) {
                detail.classList.remove('open');   // 상세영역 닫기
                row.classList.remove('selected');  // 선택 강조 제거

                if (icon) {
                    icon.textContent = '▶';        // 닫힌 상태 아이콘
                }
            } else {
                // 닫혀 있으면 열기 처리
                detail.classList.add('open');      // 상세영역 열기
                row.classList.add('selected');     // 선택 강조 추가

                if (icon) {
                    icon.textContent = '▼';        // 열린 상태 아이콘
                }
            }
        });
    });
}