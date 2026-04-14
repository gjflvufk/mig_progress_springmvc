package mig.progress.scheduler;

import java.time.LocalDateTime;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import mig.progress.model.MigProgressDetailLogVO;

/**
 * 마이그레이션 시뮬레이션 스케줄러
 *
 * data-source=hsql 일 때만 동작.
 * 실제 전환 잡과 동일한 흐름:
 * 1. INSERT RUNNING
 * 2. sleep (작업 수행 시뮬레이션)
 * 3. UPDATE COMPLETE or ERROR
 *
 * 50건 x 6초 = 약 5분
 */
@Component
public class MigProgressSimulationScheduler {

    private static final String NAMESPACE =
        "mig.progress.repository.MigProgressRepository";

    private static final long RUNNING_DURATION_MS = 3000;
    private static final long NEXT_INTERVAL_MS    = 3000;
    private static final int  ERROR_INTERVAL      = 12;

    @Resource(name = "sqlSession")
    private SqlSessionTemplate sqlSession;

    @Value("${mig.progress.data-source:test}")
    private String dataSourceType;

    @PostConstruct
    public void start() {
        if (!"hsql".equalsIgnoreCase(dataSourceType)) {
            return;
        }

        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                simulate();
            }
        });
        thread.setDaemon(true);
        thread.setName("mig-simulation-thread");
        thread.start();

        System.out.println("=== 마이그레이션 시뮬레이션 시작 (약 5분) ===");
    }

    private void simulate() {
        try {
            List<MigProgressDetailLogVO> targets =
                sqlSession.selectList(NAMESPACE + ".selectAllTargets");

            if (targets == null || targets.isEmpty()) {
                System.out.println("=== 시뮬레이션: 대상 없음 ===");
                return;
            }

            int index = 0;

            for (MigProgressDetailLogVO target : targets) {
                index++;

                // ① INSERT RUNNING
                LocalDateTime startTime = LocalDateTime.now();

                MigProgressDetailLogVO startLog = new MigProgressDetailLogVO();
                startLog.setTableName(target.getTableName());
                startLog.setJobLvl1(target.getJobLvl1());
                startLog.setJobLvl2(target.getJobLvl2());
                startLog.setStartTime(startTime);
                startLog.setBeforeCount(1000L + index);

                sqlSession.insert(NAMESPACE + ".insertStartLog", startLog);
                System.out.println("=== RUNNING [" + index + "] " + target.getTableName() + " ===");

                // ② 작업 수행 시뮬레이션
                Thread.sleep(RUNNING_DURATION_MS);

                // ③ UPDATE COMPLETE or ERROR
                LocalDateTime endTime = LocalDateTime.now();
                long beforeCount = 1000L + index;

                MigProgressDetailLogVO doneLog = new MigProgressDetailLogVO();
                doneLog.setTableName(target.getTableName());
                doneLog.setEndTime(endTime);

                if (index % ERROR_INTERVAL == 0) {
                    doneLog.setAfterCount(beforeCount - 3);
                    doneLog.setDiffCount(3L);
                    sqlSession.update(NAMESPACE + ".updateErrorLog", doneLog);
                    System.out.println("=== ERROR [" + index + "] " + target.getTableName() + " ===");
                } else {
                    doneLog.setAfterCount(beforeCount);
                    doneLog.setDiffCount(0L);
                    sqlSession.update(NAMESPACE + ".updateCompleteLog", doneLog);
                    System.out.println("=== COMPLETE [" + index + "] " + target.getTableName() + " ===");
                }

                // ④ 다음 건 대기
                Thread.sleep(NEXT_INTERVAL_MS);
            }

            System.out.println("=== 시뮬레이션 완료 ===");

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
