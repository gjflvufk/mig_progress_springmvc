/**
 * 메인 화면 JS
 *
 * 역할:
 * 1. 전체 진행 현황(summary + groups) 조회
 * 2. 상단 summary 렌더
 * 3. 업무별 마스터 테이블 렌더
 * 4. 클릭 시 새 탭 상세 화면 오픈
 *
 * 주의:
 * - 상세 데이터 자체를 세션스토리지에 넣지 않는다.
 * - 새 탭에서는 groupKey만 받아서 서버에 다시 요청한다.
 * - 단, 서버는 캐시를 사용하므로 DB는 불필요하게 여러 번 안 친다.
 */

window.contextPath = window.contextPath || "";
const MAIN_REFRESH_INTERVAL = 5000;
let currentGroups = [];

/**
 * 전체 진행 현황을 조회한다.
 */
function fetchAllLogs() {
    fetch(window.contextPath + "/mig/progress/all")
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log("main data =", data);

            const summary = data.summary || {};
            const groups = data.groups || [];

            currentGroups = groups;

            renderSummary(summary);
            renderMaster(groups);
        })
        .catch(function(error) {
            console.error("메인 화면 조회 실패", error);
        });
}

/**
 * 상단 summary 영역 렌더
 */
function renderSummary(summary) {
    const totalCount = summary.totalCount || 0;
    const completedCount = summary.completedCount || 0;
    const errorCount = summary.errorCount || 0;
    const runningCount = summary.runningCount || 0;
    const remainCount = summary.remainCount || 0;
    const progressRate = summary.progressRate || 0;
    const elapsedTime = summary.elapsedTime || "00:00:00";
    const targetTime = summary.targetTime || "00:00:00";

    setText("totalCount", totalCount);
    setText("completedCount", completedCount);
    setText("errorCount", errorCount);
    setText("runningCount", runningCount);
    setText("remainCount", remainCount);
    setText("elapsedTime", elapsedTime);
    setText("targetTime", targetTime);
    setText("progressRateText", progressRate + "%");

    const progressBar = document.getElementById("progressBar");

    if (progressBar) {
        progressBar.style.width = progressRate + "%";
    }
}

/**
 * 마스터 테이블 렌더
 *
 * 주의:
 * - 헤더 칸 수와 td 칸 수를 반드시 맞춘다.
 * - 클릭 시 openDetailPage(groupKey) 호출
 */
function renderMaster(groups) {
    const tbody = document.getElementById("masterTableBody");

    if (!tbody) {
        console.error("masterTableBody 요소를 찾지 못함");
        return;
    }

    let html = "";

    if (!groups || groups.length === 0) {
        html += "<tr>";
        html += "  <td colspan='8'>데이터가 없습니다.</td>";
        html += "</tr>";

        tbody.innerHTML = html;
        return;
    }

    groups.forEach(function(group) {
        const groupKey = group.groupKey || "";

        html += "<tr class='master-row' onclick=\"openDetailPage('" + escapeJs(groupKey) + "')\">";

        html += "<td>" + safeText(group.jobLvl1) + "</td>";
        html += "<td>" + safeText(group.jobLvl2) + "</td>";
        html += "<td>" + safeNumber(group.progressRate) + "%</td>";
        html += "<td>" + safeNumber(group.targetTableCount) + "</td>";
        html += "<td>" + safeNumber(group.completedTableCount) + "</td>";
        html += "<td>" + safeNumber(group.errorTableCount) + "</td>";
        html += "<td>" + safeNumber(group.remainTableCount) + "</td>";
        html += "<td>" + safeText(group.jobStatus) + "</td>";

        html += "</tr>";
    });

    tbody.innerHTML = html;
}

/**
 * 행 클릭 시 상세 화면을 새 탭으로 연다.
 *
 * 포인트:
 * - sessionStorage를 쓰지 않는다.
 * - groupKey만 query string으로 넘긴다.
 * - 상세 탭도 자기 화면에서 다시 서버 조회한다.
 */
function openDetailPage(groupKey) {
    if (!groupKey) {
        console.error("groupKey 없음");
        return;
    }

    const url = window.contextPath
        + "/mig/progress/detail?groupKey="
        + encodeURIComponent(groupKey);

    window.open(url, "_blank");
}

/**
 * DOMContentLoaded 시 최초 1회 조회 후 주기적으로 재조회한다.
 */
document.addEventListener("DOMContentLoaded", function() {
    console.log("migProgress.js loaded");

    fetchAllLogs();
    setInterval(fetchAllLogs, MAIN_REFRESH_INTERVAL);
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

function escapeJs(value) {
    return safeText(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}
