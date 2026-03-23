package mig.progress.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Repository;

import egovframework.example.mig.service.MigProgressDetailLogVO;

@Repository("migProgressTestRepository")
public class MigProgressTestRepository {

    public List<MigProgressDetailLogVO> selectAllProgressLogs() {
        List<MigProgressDetailLogVO> logs = new ArrayList<MigProgressDetailLogVO>();

        logs.add(createLog("카드", "회원", "TB_CARD_USER", "카드회원", "2026-03-20 09:00:00", "2026-03-20 09:03:15", "00:03:15", 1200L, 1200L, 0L, "COMPLETE"));
        logs.add(createLog("카드", "회원", "TB_CARD_USER_HIS", "카드회원이력", "2026-03-20 09:01:00", "", "", 3500L, 3200L, 300L, "RUNNING"));
        logs.add(createLog("카드", "보험", "TB_CARD_INS", "카드보험", "", "", "", 0L, 0L, 0L, "WAIT"));
        logs.add(createLog("카드", "보험", "TB_CARD_INS_HIS", "카드보험이력", "2026-03-20 09:10:00", "2026-03-20 09:11:40", "00:01:40", 800L, 790L, 10L, "ERROR"));
        logs.add(createLog("공통", "코드", "TB_CODE_M", "코드마스터", "2026-03-20 08:40:00", "2026-03-20 08:40:50", "00:00:50", 150L, 150L, 0L, "COMPLETE"));
        logs.add(createLog("공통", "코드", "TB_CODE_D", "코드상세", "2026-03-20 08:41:00", "2026-03-20 08:42:10", "00:01:10", 400L, 400L, 0L, "COMPLETE"));

        return logs;
    }

    private MigProgressDetailLogVO createLog(
            String jobLvl1,
            String jobLvl2,
            String tableName,
            String tableKorName,
            String startTime,
            String endTime,
            String elapsedTime,
            Long beforeCount,
            Long afterCount,
            Long diffCount,
            String jobStatus
    ) {
        MigProgressDetailLogVO log = new MigProgressDetailLogVO();
        log.setJobLvl1(jobLvl1);
        log.setJobLvl2(jobLvl2);
        log.setTableName(tableName);
        log.setTableKorName(tableKorName);
        log.setStartTime(startTime);
        log.setEndTime(endTime);
        log.setElapsedTime(elapsedTime);
        log.setBeforeCount(beforeCount);
        log.setAfterCount(afterCount);
        log.setDiffCount(diffCount);
        log.setJobStatus(jobStatus);
        return log;
    }
}
