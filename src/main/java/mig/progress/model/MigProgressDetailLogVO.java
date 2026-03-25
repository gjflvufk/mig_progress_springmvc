/**
 * 상세 로그 1건을 담는 VO
 *
 * 화면 기준으로는 "테이블 1개" 의 진행 상태 1행이라고 보면 된다.
 *
 * VO / DTO 느낌:
 * - DB 조회 결과 1행을 담기 좋음
 * - Service -> Controller -> JSON 응답으로 전달하기 좋음
 * - getter/setter 만 있는 전형적인 JavaBean 형태
 */
public class MigProgressDetailLogVO {

    private String jobLvl1;
    private String jobLvl2;
    private String tableName;
    private String tableKorName;
    private String startTime;
    private String endTime;
    private String elapsedTime;
    private Long beforeCount;
    private Long afterCount;
    private Long diffCount;
    private String jobStatus;

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

    public Long getBeforeCount() {
        return beforeCount;
    }

    public void setBeforeCount(Long beforeCount) {
        this.beforeCount = beforeCount;
    }

    public Long getAfterCount() {
        return afterCount;
    }

    public void setAfterCount(Long afterCount) {
        this.afterCount = afterCount;
    }

    public Long getDiffCount() {
        return diffCount;
    }

    public void setDiffCount(Long diffCount) {
        this.diffCount = diffCount;
    }

    public String getJobStatus() {
        return jobStatus;
    }

    public void setJobStatus(String jobStatus) {
        this.jobStatus = jobStatus;
    }
}
