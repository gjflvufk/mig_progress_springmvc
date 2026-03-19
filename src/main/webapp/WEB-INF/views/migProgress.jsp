<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>MIG 전환 진행률</title>
    <link rel="stylesheet" href="<c:url value='/resources/css/migProgress.css' />">
</head>
<body>
<div class="page-wrap">
    <h1 class="page-title">MIG 전환 진행률</h1>

    <div class="top-summary-wrap">
        <div class="progress-panel">
            <div class="progress-top-bar">
                <div class="progress-top-left">
                    <div class="progress-count-line">
                        완료건수 / 전체건수 :
                        <strong id="completedOverTotalText">0 / 0</strong>
                    </div>
                    <div class="progress-count-line">
                        잔여 :
                        <strong id="remainCountText">0</strong>
                    </div>
                </div>

                <div class="progress-top-right">
                    <label class="refresh-label" for="refreshSeconds">새로고침</label>
                    <select id="refreshSeconds" class="refresh-select">
                        <option value="3">3초</option>
                        <option value="5" selected>5초</option>
                        <option value="10">10초</option>
                        <option value="30">30초</option>
                        <option value="60">1분</option>
                    </select>
                    <div class="refresh-remaining" id="refreshRemainingText">다음 갱신 5초</div>
                </div>
            </div>

            <div class="progress-header">
                <div class="progress-title">전체 전환 진행률</div>
                <div class="progress-percent" id="totalProgressText">0%</div>
            </div>

            <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="totalProgressBar"></div>
            </div>

            <div class="progress-meta">
                <div>전체 대상 테이블: <strong id="totalTargetTableCount">0</strong>건</div>
                <div>완료 테이블: <strong id="totalCompletedTableCount">0</strong>건</div>
                <div>오류 테이블: <strong id="totalErrorTableCount">0</strong>건</div>
                <div>진행중 테이블: <strong id="totalRunningTableCount">0</strong>건</div>
            </div>
        </div>

        <div class="summary-panel">
            <div class="summary-item">
                <div class="summary-key">전체 소요시간</div>
                <div class="summary-value" id="elapsedTimeText">00:00:00</div>
            </div>
            <div class="summary-item">
                <div class="summary-key">목표시간</div>
                <div class="summary-value" id="targetTimeText">08:00:00</div>
            </div>
            <div class="summary-item">
                <div class="summary-key">시간 진행률</div>
                <div class="summary-value" id="timeProgressText">0%</div>
            </div>
        </div>
    </div>

    <div class="grid-panel">
        <div class="grid-title">업무별 전환 현황</div>

        <div class="table-wrap">
            <table class="grid-table">
                <thead>
                <tr>
                    <th>업무Level1</th>
                    <th>업무Level2</th>
                    <th>업무별진행률</th>
                    <th>대상테이블건수</th>
                    <th>완료테이블건수</th>
                    <th>오류테이블건수</th>
                    <th>잔여테이블건수</th>
                    <th>작업상태</th>
                </tr>
                </thead>
                <tbody id="masterTableBody">
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
    window.contextPath = "${pageContext.request.contextPath}";
</script>
<script src="<c:url value='/resources/js/migProgress.js' />"></script>
</body>
</html>
