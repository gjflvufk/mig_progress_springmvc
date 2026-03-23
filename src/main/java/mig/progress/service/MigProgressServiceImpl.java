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

import egovframework.example.mig.service.MigProgressDetailLogVO;
import egovframework.example.mig.service.MigProgressGroupVO;
import egovframework.example.mig.service.MigProgressResponseVO;
import egovframework.example.mig.service.MigProgressService;
import egovframework.example.mig.service.MigProgressSummaryVO;

@Service("migProgressService")
public class MigProgressServiceImpl implements MigProgressService {

    private static final String STATUS_COMPLETE = "COMPLETE";
    private static final String STATUS_ERROR = "ERROR";
    private static final String STATUS_RUNNING = "RUNNING";
    private static final String STATUS_WAIT = "WAIT";

    private static final String DEFAULT_TARGET_TIME = "08:00:00";
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Resource(name = "migProgressTestRepository")
    private MigProgressTestRepository migProgressTestRepository;

    @Override
    public MigProgressResponseVO selectMigProgress() throws Exception {
        List<MigProgressDetailLogVO> logs = migProgressTestRepository.selectAllProgressLogs();

        MigProgressSummaryVO summary = buildSummary(logs);
        List<MigProgressGroupVO> groups = buildGroups(logs);

        MigProgressResponseVO response = new MigProgressResponseVO();
        response.setSummary(summary);
        response.setGroups(groups);
        return response;
    }

    private MigProgressSummaryVO buildSummary(List<MigProgressDetailLogVO> logs) {
        MigProgressSummaryVO summary = new MigProgressSummaryVO();

        int totalCount = logs.size();
        int completedCount = 0;
        int errorCount = 0;
        int runningCount = 0;

        LocalDateTime minStartTime = null;
        LocalDateTime maxEndTime = null;

        for (MigProgressDetailLogVO log : logs) {
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

            if (startDateTime != null && (minStartTime == null || startDateTime.isBefore(minStartTime))) {
                minStartTime = startDateTime;
            }

            if (endDateTime != null && (maxEndTime == null || endDateTime.isAfter(maxEndTime))) {
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

    private List<MigProgressGroupVO> buildGroups(List<MigProgressDetailLogVO> logs) {
        Map<String, MigProgressGroupVO> groupMap = new LinkedHashMap<String, MigProgressGroupVO>();

        for (MigProgressDetailLogVO log : logs) {
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
            int progressRate = targetTableCount > 0 ? (completedTableCount * 100) / targetTableCount : 0;

            group.setTargetTableCount(targetTableCount);
            group.setCompletedTableCount(completedTableCount);
            group.setErrorTableCount(errorTableCount);
            group.setRunningTableCount(runningTableCount);
            group.setRemainTableCount(remainTableCount);
            group.setProgressRate(progressRate);
            group.setJobStatus(resolveGroupStatus(targetTableCount, completedTableCount, errorTableCount, runningTableCount));

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
            if (jobStatus.equals(log.getJobStatus())) {
                count++;
            }
        }
        return count;
    }

    private String resolveGroupStatus(int targetTableCount, int completedTableCount, int errorTableCount, int runningTableCount) {
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
