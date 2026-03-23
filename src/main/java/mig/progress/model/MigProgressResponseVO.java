package mig.progress.service;

import java.util.ArrayList;
import java.util.List;

public class MigProgressResponseVO {

    private MigProgressSummaryVO summary;
    private List<MigProgressGroupVO> groups;

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
        response.setGroups(new ArrayList<MigProgressGroupVO>());
        return response;
    }

    public MigProgressSummaryVO getSummary() {
        return summary;
    }

    public void setSummary(MigProgressSummaryVO summary) {
        this.summary = summary;
    }

    public List<MigProgressGroupVO> getGroups() {
        return groups;
    }

    public void setGroups(List<MigProgressGroupVO> groups) {
        this.groups = groups;
    }
}
