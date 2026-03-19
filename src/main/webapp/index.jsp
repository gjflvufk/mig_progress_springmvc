<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
    // 웹앱 첫 진입 시 진행률 화면으로 바로 보내기 위한 간단한 진입 페이지
    response.sendRedirect(request.getContextPath() + "/mig/progress/view.do");
%>
