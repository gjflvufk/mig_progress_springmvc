package mig.progress.model;

/**
 * 화면에서 1개 테이블의 진행 상태를 표현하는 모델이다.
 * 지금은 FakeRepository 가 이 객체를 1000건 만들어서 반환한다.
 *
 * 나중에 DB 를 붙이면
 * - ResultSet 을 이 객체로 매핑하거나
 * - MyBatis / JPA DTO 로 사용하면 된다.
 */
public class MigLog {

    private long logId;
    private String jobLvl1;
    private String jobLvl2;
    private String tableName;
    private String tableKorName;
    private String startTime;
    private String endTime;
    private String elapsedTime;
    private long beforeCount;
    private long afterCount;
    private long diffCount;
    private String jobStatus;

    public long getLogId() {
        return logId;
    }

    public void setLogId(long logId) {
        this.logId = logId;
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

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public String getTableKorName() {
        return tableKorName;
    }

    public void setTableKorName(String tableKorName) {
        this.tableKorName = tableKorName;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getElapsedTime() {
        return elapsedTime;
    }

    public void setElapsedTime(String elapsedTime) {
        this.elapsedTime = elapsedTime;
    }

    public long getBeforeCount() {
        return beforeCount;
    }

    public void setBeforeCount(long beforeCount) {
        this.beforeCount = beforeCount;
    }

    public long getAfterCount() {
        return afterCount;
    }

    public void setAfterCount(long afterCount) {
        this.afterCount = afterCount;
    }

    public long getDiffCount() {
        return diffCount;
    }

    public void setDiffCount(long diffCount) {
        this.diffCount = diffCount;
    }

    public String getJobStatus() {
        return jobStatus;
    }

    public void setJobStatus(String jobStatus) {
        this.jobStatus = jobStatus;
    }
}
