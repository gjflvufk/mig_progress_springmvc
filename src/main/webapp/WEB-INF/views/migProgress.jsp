<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>MIG 전환 진행률</title>
    <script>
        /**
         * JS에서 사용할 contextPath를 먼저 주입한다.
         */
        window.contextPath = '${pageContext.request.contextPath}';
    </script>
    <script src="${pageContext.request.contextPath}/resources/js/migProgress.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }

        .summary-box {
            margin-bottom: 20px;
        }

        .progress-bar-wrap {
            width: 100%;
            height: 22px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 8px;
        }

        .progress-bar {
            width: 0%;
            height: 100%;
            background: #4caf50;
            transition: width 0.25s ease;
        }

        .summary-text {
            margin-bottom: 16px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead th {
            background: #f3f4f6;
        }

        th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: center;
        }

        .master-row {
            cursor: pointer;
        }

        .master-row:hover {
            background: #f9fafb;
        }

        .guide-text {
            margin: 10px 0 16px;
            color: #4b5563;
            font-size: 13px;
        }
    </style>
</head>
<body>

<h2>전환 진행 상황판</h2>

<div class="summary-box">
    <div class="progress-bar-wrap">
        <div id="progressBar" class="progress-bar"></div>
    </div>

    <div class="summary-text">
        진행률:
        <strong id="progressRateText">0%</strong>
        /
        전체:
        <strong id="totalCount">0</strong>
        /
        완료:
        <strong id="completedCount">0</strong>
        /
        오류:
        <strong id="errorCount">0</strong>
        /
        진행중:
        <strong id="runningCount">0</strong>
        /
        잔여:
        <strong id="remainCount">0</strong>
        /
        소요시간:
        <strong id="elapsedTime">00:00:00</strong>
        /
        목표시간:
        <strong id="targetTime">00:00:00</strong>
    </div>
</div>

<div class="guide-text">
    업무 행을 클릭하면 상세 로그가 새 탭에서 열립니다.
</div>

<table>
    <thead>
        <tr>
            <th>업무level1</th>
            <th>업무level2</th>
            <th>업무별진행률</th>
            <th>대상테이블건수</th>
            <th>완료테이블건수</th>
            <th>오류테이블건수</th>
            <th>잔여테이블건수</th>
            <th>작업상태</th>
        </tr>
    </thead>
    <tbody id="masterTableBody">
        <tr>
            <td colspan="8">조회 중...</td>
        </tr>
    </tbody>
</table>

</body>
</html>
