<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>MIG 전환 상세 로그</title>
    <script>
        window.contextPath = '${pageContext.request.contextPath}';
    </script>
    <script src="${pageContext.request.contextPath}/resources/js/migProgressDetail.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }

        .detail-summary {
            margin-bottom: 18px;
            padding: 12px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
        }

        .detail-summary div {
            margin-bottom: 6px;
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
    </style>
</head>
<body>

<h2>전환 상세 로그</h2>

<div class="detail-summary">
    <div>
        업무level1:
        <strong id="detailJobLvl1"></strong>
    </div>
    <div>
        업무level2:
        <strong id="detailJobLvl2"></strong>
    </div>
    <div>
        진행률:
        <strong id="detailProgressRate">0%</strong>
        /
        대상:
        <strong id="detailTargetTableCount">0</strong>
        /
        완료:
        <strong id="detailCompletedTableCount">0</strong>
        /
        오류:
        <strong id="detailErrorTableCount">0</strong>
        /
        잔여:
        <strong id="detailRemainTableCount">0</strong>
        /
        상태:
        <strong id="detailJobStatus"></strong>
    </div>
</div>

<table>
    <thead>
        <tr>
            <th>테이블명</th>
            <th>테이블한글명</th>
            <th>시작시간</th>
            <th>종료시간</th>
            <th>소요시간</th>
            <th>시작건수</th>
            <th>사후건수</th>
            <th>차이건수</th>
            <th>작업상태</th>
        </tr>
    </thead>
    <tbody id="detailTableBody">
        <tr>
            <td colspan="9">조회 중...</td>
        </tr>
    </tbody>
</table>

</body>
</html>
