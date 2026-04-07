/**
 * 상세 화면 JS
 *
 * 역할:
 * 1. URL에서 groupKey를 읽는다.
 * 2. 해당 groupKey의 상세 데이터를 서버에서 조회한다.
 * 3. 상단 그룹 요약 정보 + 하단 로그 테이블을 렌더한다.
 * 4. 5초마다 다시 조회한다.
 */

window.contextPath = window.contextPath || "";

var DETAIL_REFRESH_INTERVAL = 5000;
var currentGroupKey = "";

/* ── 유틸 ── */
function setText(elementId, value) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = value == null ? "" : value;

    /* 진행률 바 연동 */
    if (elementId === "detailProgressRate") {
        var fill = document.getElementById("detailProgressBarFill");
        if (fill) fill.style.width = Math.min(parseFloat(value) || 0, 100) + "%";
    }

    /* 상태 배지 연동 */
    if (elementId === "detailJobStatus") {
        updateStatusBadge(String(value || ""));
    }
}

function safeText(value)   { return value == null ? "" : String(value); }
function safeNumber(value) { return value == null ? 0  : value; }

/* ── 상태 배지 ── */
function updateStatusBadge(status) {
    var el = document.getElementById("detailJobStatus");
    if (!el) return;
    el.className = "status-badge";
    var s = status.toLowerCase();
    if      (s.indexOf("완료") >= 0 || s.indexOf("done")    >= 0 || s.indexOf("success") >= 0) el.classList.add("badge-done");
    else if (s.indexOf("오류") >= 0 || s.indexOf("error")   >= 0 || s.indexOf("fail")    >= 0) el.classList.add("badge-error");
    else if (s.indexOf("진행") >= 0 || s.indexOf("running") >= 0)                              el.classList.add("badge-running");
    else                                                                                         el.classList.add("badge-waiting");
    el.textContent = status || "대기중";
}

/* ── URL에서 groupKey 읽기 ── */
function readGroupKey() {
    var params = new URLSearchParams(window.location.search);
    return params.get("groupKey") || "";
}

/* ── 서버 조회 ── */
function fetchDetailData() {
    if (!currentGroupKey) {
        console.error("groupKey 없음");
        return;
    }
    var url = window.contextPath
        + "/mig/progress/detail/data?groupKey="
        + encodeURIComponent(currentGroupKey);

    fetch(url)
        .then(function(response) { return response.json(); })
        .then(function(group) {
            if (!group) { renderEmptyState(); return; }
            renderDetailHeader(group);
            renderDetailTable(group.logs || []);
        })
        .catch(function(error) {
            console.error("상세 화면 조회 실패", error);
        });
}

/* ── 헤더 렌더 ── */
function renderDetailHeader(group) {
    setText("detailJobLvl1",            group.jobLvl1            || "");
    setText("detailJobLvl2",            group.jobLvl2            || "");
    setText("detailProgressRate",       safeNumber(group.progressRate) + "%");
    setText("detailTargetTableCount",   safeNumber(group.targetTableCount));
    setText("detailCompletedTableCount",safeNumber(group.completedTableCount));
    setText("detailErrorTableCount",    safeNumber(group.errorTableCount));
    setText("detailRemainTableCount",   safeNumber(group.remainTableCount));
    setText("detailJobStatus",          group.jobStatus || "");
}

/* ── 테이블 렌더 ── */
function renderDetailTable(logs) {
    var tbody   = document.getElementById("detailTableBody");
    var countEl = document.getElementById("detailLogCount");
    if (!tbody) { console.error("detailTableBody 요소를 찾지 못함"); return; }

    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="9">상세 로그가 없습니다.</td></tr>';
        if (countEl) countEl.textContent = "총 0건";
        return;
    }

    if (countEl) countEl.textContent = "총 " + logs.length + "건";

    var html = "";
    logs.forEach(function(log) {
        var statusBadge = makeStatusBadge(log.jobStatus);
        var diff        = log.diffCount == null ? 0 : log.diffCount;
        var diffCls     = diff > 0 ? "diff-plus" : diff < 0 ? "diff-minus" : "";

        html += "<tr>";
        html += "<td>" + safeText(log.tableName)     + "</td>";
        html += "<td>" + safeText(log.tableKorName)  + "</td>";
        html += "<td>" + safeText(log.startTime)     + "</td>";
        html += "<td>" + safeText(log.endTime)       + "</td>";
        html += "<td>" + safeText(log.elapsedTime)   + "</td>";
        html += "<td>" + safeNumber(log.beforeCount) + "</td>";
        html += "<td>" + safeNumber(log.afterCount)  + "</td>";
        html += '<td class="' + diffCls + '">' + diff + "</td>";
        html += "<td>" + statusBadge + "</td>";
        html += "</tr>";
    });
    tbody.innerHTML = html;
}

/* ── 테이블 상태 배지 생성 ── */
function makeStatusBadge(status) {
    var s   = String(status || "").toLowerCase();
    var cls = "tbl-waiting";
    if      (s.indexOf("완료") >= 0 || s.indexOf("done")    >= 0 || s.indexOf("success") >= 0) cls = "tbl-done";
    else if (s.indexOf("오류") >= 0 || s.indexOf("error")   >= 0 || s.indexOf("fail")    >= 0) cls = "tbl-error";
    else if (s.indexOf("진행") >= 0 || s.indexOf("running") >= 0)                              cls = "tbl-running";
    return '<span class="tbl-badge ' + cls + '">' + safeText(status) + '</span>';
}

/* ── 빈 상태 ── */
function renderEmptyState() {
    setText("detailJobLvl1",             "");
    setText("detailJobLvl2",             "");
    setText("detailProgressRate",        "0%");
    setText("detailTargetTableCount",    "0");
    setText("detailCompletedTableCount", "0");
    setText("detailErrorTableCount",     "0");
    setText("detailRemainTableCount",    "0");
    setText("detailJobStatus",           "");
    renderDetailTable([]);
}

/* ── 초기화 ── */
document.addEventListener("DOMContentLoaded", function() {
    currentGroupKey = readGroupKey();
    if (!currentGroupKey) {
        console.error("상세 화면 groupKey 없음");
        renderEmptyState();
        return;
    }
    fetchDetailData();
    setInterval(fetchDetailData, DETAIL_REFRESH_INTERVAL);
});
