package mig.progress.repository;

import mig.progress.model.MigLogVO;
import org.springframework.stereotype.Repository;

import javax.annotation.PostConstruct;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * DB 가 아직 없는 상태에서 화면을 테스트하기 위한 임시 Repository 다.
 *
 * 동작 방식
 * ------------------------------------------------------------------
 * 1) 서버 시작 시 기준 메타데이터 1000건 생성
 * 2) 조회 시점(now) 기준으로 완료 건수가 점점 증가
 * 3) 5초마다 10건씩 완료되는 것처럼 보이게 구성
 * 4) 일부 건은 ERROR 로 만들어서 오류 상태도 화면에서 확인 가능
 *
 * 나중에 DB 연결 시에는 이 클래스를 그대로 두고,
 * DB 조회용 Repository 를 새로 만들어 인터페이스 구현체만 바꾸면 된다.
 */
@Repository
public class MigProgressFakeRepository implements MigProgressRepository {

    private static final int TOTAL_COUNT = 1000;
    private static final int COMPLETE_STEP_PER_5_SECONDS = 10;

    private final List<BaseMeta> baseMetaList = new ArrayList<>();
    private LocalDateTime appStartTime;

    /**
     * Spring 이 이 빈을 생성한 직후 1회 실행한다.
     * 여기서 더미 기준 데이터를 미리 만들어 둔다.
     */
    @PostConstruct
    public void init() {
        this.appStartTime = LocalDateTime.now();
        this.baseMetaList.addAll(createBaseMetaList());
    }

    @Override
    public List<MigLog> selectAllLogs() {
        LocalDateTime now = LocalDateTime.now();

        long elapsedSeconds = Duration.between(appStartTime, now).getSeconds();
        int completedCount = (int) ((elapsedSeconds / 5) * COMPLETE_STEP_PER_5_SECONDS);

        if (completedCount > TOTAL_COUNT) {
            completedCount = TOTAL_COUNT;
        }

        List<MigLog> result = new ArrayList<>();

        for (int i = 0; i < baseMetaList.size(); i++) {
            int seq = i + 1;
            BaseMeta meta = baseMetaList.get(i);

            MigLog log = new MigLog();
            log.setLogId(seq);
            log.setJobLvl1(meta.jobLvl1);
            log.setJobLvl2(meta.jobLvl2);
            log.setTableName(meta.tableName);
            log.setTableKorName(meta.tableKorName);

            // 시작시간은 보기 좋게 5초 간격으로 생성
            LocalDateTime startTime = appStartTime.plusSeconds((long) i * 5L);
            log.setStartTime(formatDateTime(startTime));
            log.setBeforeCount(meta.beforeCount);

            if (seq <= completedCount) {
                boolean isError = (seq % 50 == 0);
                LocalDateTime endTime = startTime.plusSeconds(5);

                log.setEndTime(formatDateTime(endTime));
                log.setElapsedTime("00:00:05");

                if (isError) {
                    log.setAfterCount(meta.beforeCount - 3);
                    log.setDiffCount(3);
                    log.setJobStatus("ERROR");
                } else {
                    log.setAfterCount(meta.beforeCount);
                    log.setDiffCount(0);
                    log.setJobStatus("COMPLETE");
                }

            } else if (seq == completedCount + 1 && completedCount < TOTAL_COUNT) {
                // 현재 딱 1건은 진행중으로 보이게 처리
                log.setEndTime("");
                log.setElapsedTime(calculateElapsedTime(startTime, now));
                log.setAfterCount(Math.max(0, meta.beforeCount - 1));
                log.setDiffCount(1);
                log.setJobStatus("RUNNING");

            } else {
                // 아직 시작 전인 대기 상태
                log.setEndTime("");
                log.setElapsedTime("00:00:00");
                log.setAfterCount(0);
                log.setDiffCount(meta.beforeCount);
                log.setJobStatus("WAIT");
            }

            result.add(log);
        }

        return result;
    }

    private List<BaseMeta> createBaseMetaList() {
        List<BaseMeta> list = new ArrayList<>();

        String[][] groups = {
            {"회원", "회원기본"},
            {"회원", "회원부가"},
            {"대출", "한도심사"},
            {"대출", "대출실행"},
            {"승인", "승인거래"},
            {"승인", "매입정산"},
            {"청구", "청구기본"},
            {"청구", "청구상세"},
            {"정산", "정산기본"},
            {"정산", "정산부가"}
        };

        for (int i = 1; i <= TOTAL_COUNT; i++) {
            String[] group = groups[(i - 1) % groups.length];

            BaseMeta meta = new BaseMeta();
            meta.jobLvl1 = group[0];
            meta.jobLvl2 = group[1];
            meta.tableName = String.format("TB_%04d", i);
            meta.tableKorName = group[0] + "_" + group[1] + "_테이블_" + i;
            meta.beforeCount = 1000L + (i * 13L);
            list.add(meta);
        }

        return list;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private String calculateElapsedTime(LocalDateTime startTime, LocalDateTime endTime) {
        long seconds = Duration.between(startTime, endTime).getSeconds();
        if (seconds < 0) {
            seconds = 0;
        }

        long hour = seconds / 3600;
        long minute = (seconds % 3600) / 60;
        long second = seconds % 60;

        return String.format("%02d:%02d:%02d", hour, minute, second);
    }

    /**
     * 실제 화면에서 쓰는 MigLog 는 상태값이 계속 바뀌므로,
     * 변하지 않는 기준정보만 따로 들고 있기 위한 내부 클래스다.
     */
    private static class BaseMeta {
        private String jobLvl1;
        private String jobLvl2;
        private String tableName;
        private String tableKorName;
        private long beforeCount;
    }
}
