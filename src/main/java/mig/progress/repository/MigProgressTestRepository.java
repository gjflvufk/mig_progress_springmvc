package mig.progress.repository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Repository;

import mig.progress.model.MigProgressDetailLogVO;

@Repository("migProgressTestRepository")
public class MigProgressTestRepository {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final String WAIT = "WAIT";
    private static final String RUNNING = "RUNNING";
    private static final String COMPLETE = "COMPLETE";
    private static final String ERROR = "ERROR";

    private final LocalDateTime baseTime = LocalDateTime.now();
    private List<MigProgressSeedVO> seedList;

    public List<MigProgressDetailLogVO> selectAllProgressLogs() {
        if (seedList == null) {
            seedList = createSeedList();
        }
        return simulate(seedList);
    }

    private List<MigProgressSeedVO> createSeedList() {
        List<MigProgressSeedVO> list = new ArrayList<MigProgressSeedVO>();

        for (int i = 1; i <= 1000; i++) {
            MigProgressSeedVO seed = new MigProgressSeedVO();
            seed.setJobLvl1("업무" + ((i - 1) / 200 + 1));
            seed.setJobLvl2("세부업무" + ((i - 1) / 50 + 1));
            seed.setTableName("TB_SAMPLE_" + i);
            seed.setTableKorName("샘플_" + i);
            seed.setBeforeCount(1000L + i);
            list.add(seed);
        }

        return list;
    }

    private List<MigProgressDetailLogVO> simulate(List<MigProgressSeedVO> seedList) {
        List<MigProgressDetailLogVO> result = new ArrayList<MigProgressDetailLogVO>();

        LocalDateTime now = LocalDateTime.now();
        long elapsedSeconds = Duration.between(baseTime, now).getSeconds();

        int completeCount = (int) ((elapsedSeconds / 5) * 20);
        int runningStart = completeCount;
        int runningEnd = runningStart + 5;

        if (completeCount > seedList.size()) {
            completeCount = seedList.size();
        }

        for (int i = 0; i < seedList.size(); i++) {
            MigProgressSeedVO seed = seedList.get(i);

            MigProgressDetailLogVO log = new MigProgressDetailLogVO();
            log.setJobLvl1(seed.getJobLvl1());
            log.setJobLvl2(seed.getJobLvl2());
            log.setTableName(seed.getTableName());
            log.setTableKorName(seed.getTableKorName());
            log.setBeforeCount(seed.getBeforeCount());

            LocalDateTime start = baseTime.plusSeconds(i);

            if (i < completeCount) {
                if (i % 120 == 0 && i != 0) {
                    log.setJobStatus(ERROR);
                    log.setAfterCount(seed.getBeforeCount() - 3);
                    log.setDiffCount(3L);
                } else {
                    log.setJobStatus(COMPLETE);
                    log.setAfterCount(seed.getBeforeCount());
                    log.setDiffCount(0L);
                }

                log.setStartTime(start.format(FORMATTER));
                log.setEndTime(start.plusSeconds(3).format(FORMATTER));
                log.setElapsedTime("00:00:03");

            } else if (i >= runningStart && i < runningEnd) {
                log.setJobStatus(RUNNING);
                log.setStartTime(start.format(FORMATTER));
                log.setEndTime("");
                log.setElapsedTime(calcElapsed(start, now));
                log.setAfterCount(0L);
                log.setDiffCount(0L);

            } else {
                log.setJobStatus(WAIT);
                log.setStartTime("");
                log.setEndTime("");
                log.setElapsedTime("");
                log.setAfterCount(0L);
                log.setDiffCount(0L);
            }

            result.add(log);
        }

        return result;
    }

    private String calcElapsed(LocalDateTime start, LocalDateTime now) {
        long sec = Duration.between(start, now).getSeconds();

        if (sec < 0) {
            sec = 0;
        }

        long h = sec / 3600;
        long m = (sec % 3600) / 60;
        long s = sec % 60;

        return String.format("%02d:%02d:%02d", h, m, s);
    }
}