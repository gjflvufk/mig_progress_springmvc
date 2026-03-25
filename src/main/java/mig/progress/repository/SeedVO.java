package mig.progress.repository;

public class MigProgressSeedVO {

    private String jobLvl1;
    private String jobLvl2;
    private String tableName;
    private String tableKorName;
    private Long beforeCount;

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

    public Long getBeforeCount() {
        return beforeCount;
    }

    public void setBeforeCount(Long beforeCount) {
        this.beforeCount = beforeCount;
    }
}