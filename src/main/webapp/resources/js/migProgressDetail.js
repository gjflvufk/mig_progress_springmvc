/**
 * 상세 화면 JS
 *
 * 역할:
 * 1. URL에서 groupKey를 읽는다.
 * 2. 해당 groupKey의 상세 데이터를 서버에서 조회한다.
 * 3. 상단 그룹 요약 정보 + 하단 로그 테이블을 렌더한다.
 * 4. 5초마다 다시 조회한다.
 *
 * 포인트:
 * - 메인 화면과 같은 서버 캐시를 보기 때문에 같은 스냅샷을 공유한다.
 * - sessionStorage에 의존하지 않으므로 새 탭 새로고침에도 안전하다.
 */

window.contextPath = window.contextPath || "";
const DETAIL_REFRESH_INTERVAL = 5000;
let currentGroupKey = "";

/**
 * URL query string에서 groupKey를 읽는다.
 */
function readGroupKey() {
    const params = new URLSearchParams(window.location.search);
    return params.get("groupKey") || "";
}

/**
 * 상세 데이터를 조회한다.
 */
function fetchDetailData() {
    if (!currentGroupKey) {
        console.error("groupKey 없음");
        return;
    }

    const url = window.contextPath
        + "/mig/progress/detail/data?groupKey="
        + encodeURIComponent(currentGroupKey);

    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(group) {
            console.log("detail group =", group);

            if (!group) {
                renderEmptyState();
                return;
            }

            renderDetailHeader(group);
            renderDetailTable(group.logs || []);
        })
        .catch(function(error) {
            console.error("상세 화면 조회 실패", error);
        });
}

/**
 * 상세 화면 상단 그룹 정보 렌더
 */
function renderDetailHeader(group) {
    setText("detailJobLvl1", group.jobLvl1 || "");
    setText("detailJobLvl2", group.jobLvl2 || "");
    setText("detailProgressRate", safeNumber(group.progressRate) + "%");
    setText("detailTargetTableCount", safeNumber(group.targetTableCount));
    setText("detailCompletedTableCount", safeNumber(group.completedTableCount));
    setText("detailErrorTableCount", safeNumber(group.errorTableCount));
    setText("detailRemainTableCount", safeNumber(group.remainTableCount));
    setText("detailJobStatus", group.jobStatus || "");
}

/**
 * 상세 로그 테이블 렌더
 */
function renderDetailTable(logs) {
    const tbody = document.getElementById("detailTableBody");

    if (!tbody) {
        console.error("detailTableBody 요소를 찾지 못함");
        return;
    }

    let html = "";

    if (!logs || logs.length === 0) {
        html += "<tr>";
        html += "  <td colspan='9'>상세 로그가 없습니다.</td>";
        html += "</tr>";

        tbody.innerHTML = html;
        return;
    }

    logs.forEach(function(log) {
        html += "<tr>";

        html += "<td>" + safeText(log.tableName) + "</td>";
        html += "<td>" + safeText(log.tableKorName) + "</td>";
        html += "<td>" + safeText(log.startTime) + "</td>";
        html += "<td>" + safeText(log.endTime) + "</td>";
        html += "<td>" + safeText(log.elapsedTime) + "</td>";
        html += "<td>" + safeNumber(log.beforeCount) + "</td>";
        html += "<td>" + safeNumber(log.afterCount) + "</td>";
        html += "<td>" + safeNumber(log.diffCount) + "</td>";
        html += "<td>" + safeText(log.jobStatus) + "</td>";

        html += "</tr>";
    });

    tbody.innerHTML = html;
}

/**
 * 데이터가 없을 때 기본 화면 처리
 */
function renderEmptyState() {
    setText("detailJobLvl1", "");
    setText("detailJobLvl2", "");
    setText("detailProgressRate", "0%");
    setText("detailTargetTableCount", "0");
    setText("detailCompletedTableCount", "0");
    setText("detailErrorTableCount", "0");
    setText("detailRemainTableCount", "0");
    setText("detailJobStatus", "");
    renderDetailTable([]);
}

/**
 * DOMContentLoaded 시 최초 조회 + 주기 재조회
 */
document.addEventListener("DOMContentLoaded", function() {
    console.log("migProgressDetail.js loaded");

    currentGroupKey = readGroupKey();

    if (!currentGroupKey) {
        console.error("상세 화면 groupKey 없음");
        renderEmptyState();
        return;
    }

    fetchDetailData();
    setInterval(fetchDetailData, DETAIL_REFRESH_INTERVAL);
});

function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value == null ? "" : value;
}

function safeText(value) {
    return value == null ? "" : String(value);
}

function safeNumber(value) {
    return value == null ? 0 : value;
}
