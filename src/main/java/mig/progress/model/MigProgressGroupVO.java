package mig.progress.service;

import java.util.List;
/**
 * 상세 로그들을 업무 단위로 묶은 그룹 VO
 *
 * 예:
 * - jobLvl1 = "예금"
 * - jobLvl2 = "원장"
 *
 * 이런 식으로 같은 업무 묶음의 상세 로그들을 logs 에 담고,
 * 그 그룹의 집계값(완료건수, 진행률 등)을 함께 가진다.
 */
public class MigProgressGroupVO {

    private String groupKey;
    private String jobLvl1;
    private String jobLvl2;
    private int targetTableCount;
    private int completedTableCount;
    private int errorTableCount;
    private int runningTableCount;
    private int remainTableCount;
    private int progressRate;
    private String jobStatus;
    private List<MigProgressDetailLogVO> logs;

    public String getGroupKey() {
        return groupKey;
    }

    public void setGroupKey(String groupKey) {
        this.groupKey = groupKey;
    }

    public String getJobLvl1() {
        return jobLvl1;
    }

    public void setJobLvl1(String jobLvl1) {
        this.jobLvl1 = jobLvl1;
    }

    public String getJobLvl2() {
        return jobLvl2;
    }

    public void setJobLvl2(String jobLvl2) {
        this.jobLvl2 = jobLvl2;
    }

    public int getTargetTableCount() {
        return targetTableCount;
    }

    public void setTargetTableCount(int targetTableCount) {
        this.targetTableCount = targetTableCount;
    }

    public int getCompletedTableCount() {
        return completedTableCount;
    }

    public void setCompletedTableCount(int completedTableCount) {
        this.completedTableCount = completedTableCount;
    }

    public int getErrorTableCount() {
        return errorTableCount;
    }

    public void setErrorTableCount(int errorTableCount) {
        this.errorTableCount = errorTableCount;
    }

    public int getRunningTableCount() {
        return runningTableCount;
    }

    public void setRunningTableCount(int runningTableCount) {
        this.runningTableCount = runningTableCount;
    }

    public int getRemainTableCount() {
        return remainTableCount;
    }

    public void setRemainTableCount(int remainTableCount) {
        this.remainTableCount = remainTableCount;
    }

    public int getProgressRate() {
        return progressRate;
    }

    public void setProgressRate(int progressRate) {
        this.progressRate = progressRate;
    }

    public String getJobStatus() {
        return jobStatus;
    }

    public void setJobStatus(String jobStatus) {
        this.jobStatus = jobStatus;
    }

    public List<MigProgressDetailLogVO> getLogs() {
        return logs;
    }

    public void setLogs(List<MigProgressDetailLogVO> logs) {
        this.logs = logs;
    }
}
