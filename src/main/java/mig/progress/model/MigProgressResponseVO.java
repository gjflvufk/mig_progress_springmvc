package mig.progress.service;

import java.util.ArrayList;
import java.util.List;

/**
 * 최종 응답 루트 VO
 *
 * JSON 으로 내려갈 때 보통 최상위 객체가 된다.
 * 구조:
 * {
 *   "summary": {...},
 *   "groups": [...]
 * }
 */
public class MigProgressResponseVO {

    /** 상단 전체 요약 */
    private MigProgressSummaryVO summary;

    /** 그룹 목록 */
    private List groups;

    /**
     * 데이터가 없을 때 사용할 기본 응답 생성
     *
     * 의미:
     * - null 대신 안전한 빈 응답을 내려주기 좋다.
     * - 프론트에서 summary/groups null 체크를 줄일 수 있다.
     *
     * new ArrayList():
     * - 비어있는 리스트를 새로 만든다.
     * - null 이 아니라 빈 목록([])을 내려주고 싶을 때 자주 쓴다.
     */
    public static MigProgressResponseVO empty() {
        MigProgressResponseVO response = new MigProgressResponseVO();

        MigProgressSummaryVO summary = new MigProgressSummaryVO();
        summary.setTotalCount(0);
        summary.setCompletedCount(0);
        summary.setErrorCount(0);
        summary.setRunningCount(0);
        summary.setRemainCount(0);
        summary.setProgressRate(0);
        summary.setElapsedTime("00:00:00");
        summary.setTargetTime("08:00:00");

        response.setSummary(summary);
        response.setGroups(new ArrayList());

        return response;
    }

    /** summary 값을 반환한다. */
    public MigProgressSummaryVO getSummary() {
        return summary;
    }

    /** summary 값을 저장한다. */
    public void setSummary(MigProgressSummaryVO summary) {
        this.summary = summary;
    }

    /** groups 값을 반환한다. */
    public List getGroups() {
        return groups;
    }

    /** groups 값을 저장한다. */
    public void setGroups(List groups) {
        this.groups = groups;
    }
}