<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>MIG 전환 상세 로그</title>
<script>
    window.contextPath = '${pageContext.request.contextPath}';
</script>
<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/migProgressDetail.css">
<script src="${pageContext.request.contextPath}/resources/js/migProgressDetail.js"></script>
</head>
<body>

<!-- 헤더 -->
<div class="page-header">
    <h2>전환 상세 로그</h2>
    <span class="refresh-badge">5초 자동 갱신</span>
    <span class="status-badge badge-waiting" id="detailJobStatus">대기중</span>
</div>

<!-- 요약 카드 -->
<div class="summary-wrap">
    <div class="summary-top">
        <span class="job-lvl1" id="detailJobLvl1">-</span>
        <span class="sep">›</span>
        <span class="job-lvl2" id="detailJobLvl2">-</span>
    </div>
    <div class="progress-row">
        <div class="progress-bar-wrap">
            <div class="progress-bar-fill" id="detailProgressBarFill"></div>
        </div>
        <span class="progress-pct" id="detailProgressRate">0%</span>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">대상</div>
            <div class="kpi-value" id="detailTargetTableCount">0</div>
        </div>
        <div class="kpi-card is-success">
            <div class="kpi-label">완료</div>
            <div class="kpi-value" id="detailCompletedTableCount">0</div>
        </div>
        <div class="kpi-card is-error">
            <div class="kpi-label">오류</div>
            <div class="kpi-value" id="detailErrorTableCount">0</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">잔여</div>
            <div class="kpi-value" id="detailRemainTableCount">0</div>
        </div>
    </div>
</div>

<!-- 로그 테이블 -->
<div class="table-wrap">
    <div class="table-header">
        <span class="table-title">테이블별 전환 로그</span>
        <span class="table-count" id="detailLogCount">-</span>
    </div>
    <div class="scroll-area">
        <table>
            <thead>
                <tr>
                    <th>테이블명</th>
                    <th>테이블 한글명</th>
                    <th>시작시간</th>
                    <th>종료시간</th>
                    <th>소요시간</th>
                    <th>시작건수</th>
                    <th>사후건수</th>
                    <th>차이건수</th>
                    <th>상태</th>
                </tr>
            </thead>
            <tbody id="detailTableBody">
                <tr><td colspan="9">조회 중...</td></tr>
            </tbody>
        </table>
    </div>
</div>

</body>
</html>
