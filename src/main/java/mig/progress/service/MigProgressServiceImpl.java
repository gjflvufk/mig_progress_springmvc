package mig.progress.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.stereotype.Service;

import mig.progress.cache.MigProgressCache;
import mig.progress.repository.MigProgressRepository;
import mig.progress.vo.MigProgressDetailLogVO;
import mig.progress.vo.MigProgressGroupVO;
import mig.progress.vo.MigProgressResponseVO;
import mig.progress.vo.MigProgressSummaryVO;

/**
 * 진행 현황 서비스 구현체다.
 *
 * 이번 리팩토링 핵심:
 * 1. Repository 조회 결과를 매번 새로 만들지 않고 서버 캐시를 우선 사용한다.
 * 2. 메인 화면과 상세 화면이 같은 스냅샷을 공유하게 만든다.
 * 3. 상세 화면 때문에 DB를 한 번 더 치지 않게 한다.
 */
@Service("migProgressService")
public class MigProgressServiceImpl implements MigProgressService {

    private static final String STATUS_COMPLETE = "COMPLETE";
    private static final String STATUS_ERROR = "ERROR";
    private static final String STATUS_RUNNING = "RUNNING";
    private static final String STATUS_WAIT = "WAIT";
    private static final String DEFAULT_TARGET_TIME = "08:00:00";

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 실제 로그 원본을 조회하는 Repository
     *
     * 주의:
     * - 현재 test/db 분기는 RepositoryImpl 안에 이미 들어가 있으므로
     *   서비스에서는 그걸 신경 쓰지 않는다.
     */
    @Resource(name = "migProgressRepository")
    private MigProgressRepository migProgressRepository;

    /**
     * 서버 공용 캐시
     */
    @Resource(name = "migProgressCache")
    private MigProgressCache migProgressCache;

    /**
     * 메인 화면용 전체 응답을 반환한다.
     *
     * 흐름:
     * 1. 캐시 조회
     * 2. 캐시 있으면 그대로 반환
     * 3. 캐시 없으면 Repository 조회
     * 4. summary/groups 생성
     * 5. 캐시에 저장 후 반환
     */
    @Override
    public MigProgressResponseVO selectMigProgress() throws Exception {
        MigProgressResponseVO cachedResponse = migProgressCache.get();

        if (cachedResponse != null) {
            System.out.println("=== 서버 캐시 히트: DB/Test 재조회 없이 응답 반환 ===");
            return cachedResponse;
        }

        System.out.println("=== 서버 캐시 미스: Repository 조회 후 캐시 저장 ===");

        @SuppressWarnings("unchecked")
        List<MigProgressDetailLogVO> logs = migProgressRepository.selectAllProgressLogs();

        if (logs == null) {
            logs = new ArrayList<MigProgressDetailLogVO>();
        }

        MigProgressResponseVO response = new MigProgressResponseVO();
        response.setSummary(buildSummary(logs));
        response.setGroups(buildGroups(logs));

        migProgressCache.put(response);

        return response;
    }

    /**
     * 상세 화면용 그룹 1건을 반환한다.
     *
     * 포인트:
     * - selectMigProgress()를 다시 호출하지만
     *   실제로는 캐시가 살아 있으면 같은 스냅샷을 재사용한다.
     * - 즉 상세 화면도 메인 화면과 같은 시점 데이터를 본다.
     */
    @Override
    public MigProgressGroupVO selectGroupDetail(String groupKey) throws Exception {
        MigProgressResponseVO response = selectMigProgress();

        if (response == null || response.getGroups() == null) {
            return null;
        }

        for (MigProgressGroupVO group : response.getGroups()) {
            if (groupKey.equals(group.getGroupKey())) {
                return group;
            }
        }

        return null;
    }

    /**
     * 전체 로그를 기준으로 상단 summary를 만든다.
     */
    private MigProgressSummaryVO buildSummary(List<MigProgressDetailLogVO> logs) {
        MigProgressSummaryVO summary = new MigProgressSummaryVO();

        int totalCount = logs.size();
        int completedCount = 0;
        int errorCount = 0;
        int runningCount = 0;

        LocalDateTime minStartTime = null;
        LocalDateTime maxEndTime = null;

        for (MigProgressDetailLogVO log : logs) {
            if (log == null) {
                continue;
            }

            if (STATUS_COMPLETE.equals(log.getJobStatus())) {
                completedCount++;
            }
            if (STATUS_ERROR.equals(log.getJobStatus())) {
                errorCount++;
            }
            if (STATUS_RUNNING.equals(log.getJobStatus())) {
                runningCount++;
            }

            LocalDateTime startDateTime = parseDateTime(log.getStartTime());
            LocalDateTime endDateTime = parseDateTime(log.getEndTime());

            if (startDateTime != null
                    && (minStartTime == null || startDateTime.isBefore(minStartTime))) {
                minStartTime = startDateTime;
            }

            if (endDateTime != null
                    && (maxEndTime == null || endDateTime.isAfter(maxEndTime))) {
                maxEndTime = endDateTime;
            }
        }

        int remainCount = Math.max(0, totalCount - completedCount - errorCount);
        int progressRate = totalCount > 0 ? (completedCount * 100) / totalCount : 0;
        String elapsedTime = calculateElapsedTime(minStartTime, maxEndTime);

        summary.setTotalCount(totalCount);
        summary.setCompletedCount(completedCount);
        summary.setErrorCount(errorCount);
        summary.setRunningCount(runningCount);
        summary.setRemainCount(remainCount);
        summary.setProgressRate(progressRate);
        summary.setElapsedTime(elapsedTime);
        summary.setTargetTime(DEFAULT_TARGET_TIME);

        return summary;
    }

    /**
     * 전체 로그를 그룹 단위(jobLvl1 + jobLvl2)로 묶는다.
     */
    private List<MigProgressGroupVO> buildGroups(List<MigProgressDetailLogVO> logs) {
        Map<String, MigProgressGroupVO> groupMap =
                new LinkedHashMap<String, MigProgressGroupVO>();

        for (MigProgressDetailLogVO log : logs) {
            if (log == null) {
                continue;
            }

            String groupKey = safe(log.getJobLvl1()) + "||" + safe(log.getJobLvl2());

            MigProgressGroupVO group = groupMap.get(groupKey);

            if (group == null) {
                group = new MigProgressGroupVO();
                group.setGroupKey(groupKey);
                group.setJobLvl1(safe(log.getJobLvl1()));
                group.setJobLvl2(safe(log.getJobLvl2()));
                group.setLogs(new ArrayList<MigProgressDetailLogVO>());

                groupMap.put(groupKey, group);
            }

            if (group.getLogs() == null) {
                group.setLogs(new ArrayList<MigProgressDetailLogVO>());
            }

            group.getLogs().add(log);
        }

        List<MigProgressGroupVO> groups = new ArrayList<MigProgressGroupVO>(groupMap.values());

        for (MigProgressGroupVO group : groups) {
            List<MigProgressDetailLogVO> detailLogs = group.getLogs();

            int targetTableCount = detailLogs.size();
            int completedTableCount = countByStatus(detailLogs, STATUS_COMPLETE);
            int errorTableCount = countByStatus(detailLogs, STATUS_ERROR);
            int runningTableCount = countByStatus(detailLogs, STATUS_RUNNING);
            int remainTableCount = Math.max(0, targetTableCount - completedTableCount - errorTableCount);
            int progressRate = targetTableCount > 0
                    ? (completedTableCount * 100) / targetTableCount
                    : 0;

            group.setTargetTableCount(targetTableCount);
            group.setCompletedTableCount(completedTableCount);
            group.setErrorTableCount(errorTableCount);
            group.setRunningTableCount(runningTableCount);
            group.setRemainTableCount(remainTableCount);
            group.setProgressRate(progressRate);

            group.setJobStatus(
                    resolveGroupStatus(
                            targetTableCount,
                            completedTableCount,
                            errorTableCount,
                            runningTableCount
                    )
            );

            Collections.sort(detailLogs, new Comparator<MigProgressDetailLogVO>() {
                @Override
                public int compare(MigProgressDetailLogVO o1, MigProgressDetailLogVO o2) {
                    return safe(o1.getTableName()).compareTo(safe(o2.getTableName()));
                }
            });
        }

        Collections.sort(groups, new Comparator<MigProgressGroupVO>() {
            @Override
            public int compare(MigProgressGroupVO o1, MigProgressGroupVO o2) {
                int firstCompare = safe(o1.getJobLvl1()).compareTo(safe(o2.getJobLvl1()));

                if (firstCompare != 0) {
                    return firstCompare;
                }

                return safe(o1.getJobLvl2()).compareTo(safe(o2.getJobLvl2()));
            }
        });

        return groups;
    }

    private int countByStatus(List<MigProgressDetailLogVO> logs, String jobStatus) {
        int count = 0;

        for (MigProgressDetailLogVO log : logs) {
            if (log != null && jobStatus.equals(log.getJobStatus())) {
                count++;
            }
        }

        return count;
    }

    private String resolveGroupStatus(
            int targetTableCount,
            int completedTableCount,
            int errorTableCount,
            int runningTableCount
    ) {
        if (errorTableCount > 0) {
            return STATUS_ERROR;
        }

        if (targetTableCount > 0 && completedTableCount == targetTableCount) {
            return STATUS_COMPLETE;
        }

        if (runningTableCount > 0 || completedTableCount > 0) {
            return STATUS_RUNNING;
        }

        return STATUS_WAIT;
    }

    private LocalDateTime parseDateTime(String dateTimeText) {
        if (dateTimeText == null || "".equals(dateTimeText.trim())) {
            return null;
        }

        return LocalDateTime.parse(dateTimeText, DATE_TIME_FORMATTER);
    }

    private String calculateElapsedTime(LocalDateTime minStartTime, LocalDateTime maxEndTime) {
        if (minStartTime == null) {
            return "00:00:00";
        }

        LocalDateTime endBase = maxEndTime != null ? maxEndTime : LocalDateTime.now();

        Duration duration = Duration.between(minStartTime, endBase);
        long totalSeconds = Math.max(0L, duration.getSeconds());

        long hours = totalSeconds / 3600L;
        long minutes = (totalSeconds % 3600L) / 60L;
        long seconds = totalSeconds % 60L;

        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
