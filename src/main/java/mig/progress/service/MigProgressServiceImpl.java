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

import mig.progress.vo.MigProgressDetailLogVO;
import mig.progress.vo.MigProgressGroupVO;
import mig.progress.vo.MigProgressResponseVO;
import mig.progress.service.MigProgressService;
import mig.progress.vo.MigProgressSummaryVO;

/**
 * 진행 현황 화면용 서비스 구현체
 *
 * 역할:
 * 1. Repository 에서 전체 로그를 조회한다.
 * 2. 전체 로그를 기반으로 상단 요약(summary)을 계산한다.
 * 3. 업무 레벨1/레벨2 기준으로 그룹핑해서 하단 목록(groups)을 만든다.
 * 4. summary + groups 를 하나의 응답 VO 로 묶어 Controller 에 넘긴다.
 *
 * @Service("migProgressService")
 * - Spring 이 이 클래스를 서비스 빈으로 등록한다.
 * - 이름을 명시했기 때문에 다른 곳에서 "migProgressService" 로 주입 가능하다.
 */
@Service("migProgressService")
public class MigProgressServiceImpl implements MigProgressService {

    /** 완료 상태 문자열 상수 */
    private static final String STATUS_COMPLETE = "COMPLETE";

    /** 오류 상태 문자열 상수 */
    private static final String STATUS_ERROR = "ERROR";

    /** 실행 중 상태 문자열 상수 */
    private static final String STATUS_RUNNING = "RUNNING";

    /** 대기 상태 문자열 상수 */
    private static final String STATUS_WAIT = "WAIT";

    /** 목표 시간(현재는 고정값) */
    private static final String DEFAULT_TARGET_TIME = "08:00:00";

    /**
     * 날짜 문자열 파싱 포맷
     * 예: "2026-03-25 09:10:30"
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 테스트용 Repository 주입
     *
     * @Resource(name = "migProgressTestRepository")
     * - 이름 기준으로 빈을 찾아 주입한다.
     * - @Autowired 는 타입 기준이 기본이고,
     *   @Resource 는 이름 기준이 기본이라는 차이가 있다.
     */
    @Resource(name = "migProgressTestRepository")
    private MigProgressTestRepository migProgressTestRepository;

    /**
     * 화면 응답 전체를 만든다.
     *
     * 처리 순서:
     * 1. Repository 에서 로그 전체 조회
     * 2. 상단 요약(summary) 계산
     * 3. 업무 그룹 목록(groups) 계산
     * 4. 응답 VO 에 담아서 반환
     *
     * @return summary + groups 가 담긴 응답 객체
     * @throws Exception 상위 계층으로 예외 전달
     */
    @Override
    public MigProgressResponseVO selectMigProgress() throws Exception {
        // 전체 진행 로그를 조회한다.
        List logs = migProgressTestRepository.selectAllProgressLogs();

        // 전체 로그 기준으로 상단 카드/바에 표시할 요약 통계를 만든다.
        MigProgressSummaryVO summary = buildSummary(logs);

        // 업무 레벨별 그룹 목록과 각 그룹의 상세 로그를 만든다.
        List groups = buildGroups(logs);

        // 최종 응답 객체를 생성하고 summary, groups 를 세팅한다.
        MigProgressResponseVO response = new MigProgressResponseVO();
        response.setSummary(summary);
        response.setGroups(groups);

        return response;
    }

    /**
     * 전체 로그 기준 상단 요약 정보를 계산한다.
     *
     * 계산 항목:
     * - 전체 건수
     * - 완료 건수
     * - 오류 건수
     * - 실행 중 건수
     * - 잔여 건수
     * - 진행률
     * - 전체 소요시간
     * - 목표시간
     *
     * 내부에서 쓰는 기본 함수 설명:
     * - logs.size() : 리스트 원소 개수 반환
     * - equals()    : 문자열 값 비교
     * - Math.max()  : 두 값 중 큰 값 반환
     *
     * @param logs 전체 로그 목록
     * @return 상단 요약 VO
     */
    private MigProgressSummaryVO buildSummary(List logs) {
        MigProgressSummaryVO summary = new MigProgressSummaryVO();

        int totalCount = logs.size();
        int completedCount = 0;
        int errorCount = 0;
        int runningCount = 0;

        // 가장 빠른 시작시간, 가장 늦은 종료시간을 찾기 위한 변수
        LocalDateTime minStartTime = null;
        LocalDateTime maxEndTime = null;

        for (MigProgressDetailLogVO log : logs) {
            // 상태별 건수 누적
            if (STATUS_COMPLETE.equals(log.getJobStatus())) {
                completedCount++;
            }
            if (STATUS_ERROR.equals(log.getJobStatus())) {
                errorCount++;
            }
            if (STATUS_RUNNING.equals(log.getJobStatus())) {
                runningCount++;
            }

            // 문자열 시간을 LocalDateTime 으로 변환
            LocalDateTime startDateTime = parseDateTime(log.getStartTime());
            LocalDateTime endDateTime = parseDateTime(log.getEndTime());

            // 전체 로그 중 가장 이른 시작시간 계산
            if (startDateTime != null
                    && (minStartTime == null || startDateTime.isBefore(minStartTime))) {
                minStartTime = startDateTime;
            }

            // 전체 로그 중 가장 늦은 종료시간 계산
            if (endDateTime != null
                    && (maxEndTime == null || endDateTime.isAfter(maxEndTime))) {
                maxEndTime = endDateTime;
            }
        }

        // 잔여 = 전체 - 완료 - 오류
        // 음수가 되지 않게 Math.max(0, 값) 처리
        int remainCount = Math.max(0, totalCount - completedCount - errorCount);

        // 진행률 = 완료 / 전체 * 100
        // totalCount 가 0이면 0으로 처리해서 0 나누기 방지
        int progressRate = totalCount > 0 ? (completedCount * 100) / totalCount : 0;

        // 전체 시작~종료 기준 소요시간 문자열 계산
        String elapsedTime = calculateElapsedTime(minStartTime, maxEndTime);

        // 요약 VO 세팅
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
     * 전체 로그를 jobLvl1 + jobLvl2 기준으로 그룹핑한다.
     *
     * 처리 순서:
     * 1. groupKey 생성
     * 2. LinkedHashMap 에 그룹 누적
     * 3. 그룹별 집계값 계산
     * 4. 그룹 내부 상세 로그 정렬
     * 5. 그룹 목록 자체도 정렬
     *
     * 내부 기본 함수 설명:
     * - LinkedHashMap : 입력 순서를 유지하는 Map
     * - get(key)      : key 에 해당하는 값 조회
     * - put(key, val) : Map 에 값 저장
     * - Collections.sort() : 리스트 정렬
     *
     * @param logs 전체 로그 목록
     * @return 그룹 목록
     */
    private List buildGroups(List logs) {
        // 그룹 순서를 유지하기 위해 LinkedHashMap 사용
        Map groupMap = new LinkedHashMap();

        for (MigProgressDetailLogVO log : logs) {
            // null 방지용 safe() 를 사용해서 그룹키 생성
            String groupKey = safe(log.getJobLvl1()) + "||" + safe(log.getJobLvl2());

            MigProgressGroupVO group = groupMap.get(groupKey);

            // 아직 없는 그룹이면 새로 생성
            if (group == null) {
                group = new MigProgressGroupVO();
                group.setGroupKey(groupKey);
                group.setJobLvl1(safe(log.getJobLvl1()));
                group.setJobLvl2(safe(log.getJobLvl2()));
                group.setLogs(new ArrayList());

                groupMap.put(groupKey, group);
            }

            // 해당 그룹의 상세 로그 목록에 현재 로그 추가
            group.getLogs().add(log);
        }

        // Map 의 값들만 꺼내서 List 로 변환
        List groups = new ArrayList(groupMap.values());

        for (MigProgressGroupVO group : groups) {
            List detailLogs = group.getLogs();

            int targetTableCount = detailLogs.size();
            int completedTableCount = countByStatus(detailLogs, STATUS_COMPLETE);
            int errorTableCount = countByStatus(detailLogs, STATUS_ERROR);
            int runningTableCount = countByStatus(detailLogs, STATUS_RUNNING);
            int remainTableCount = Math.max(0, targetTableCount - completedTableCount - errorTableCount);
            int progressRate = targetTableCount > 0
                    ? (completedTableCount * 100) / targetTableCount
                    : 0;

            // 그룹 단위 집계 정보 세팅
            group.setTargetTableCount(targetTableCount);
            group.setCompletedTableCount(completedTableCount);
            group.setErrorTableCount(errorTableCount);
            group.setRunningTableCount(runningTableCount);
            group.setRemainTableCount(remainTableCount);
            group.setProgressRate(progressRate);

            // 그룹의 대표 상태를 결정
            group.setJobStatus(
                    resolveGroupStatus(
                            targetTableCount,
                            completedTableCount,
                            errorTableCount,
                            runningTableCount
                    )
            );

            // 그룹 내부 상세 로그를 테이블명 기준 오름차순 정렬
            Collections.sort(detailLogs, new Comparator() {
                @Override
                public int compare(MigProgressDetailLogVO o1, MigProgressDetailLogVO o2) {
                    return safe(o1.getTableName()).compareTo(safe(o2.getTableName()));
                }
            });
        }

        // 그룹 목록을 업무 레벨1 -> 업무 레벨2 순으로 정렬
        Collections.sort(groups, new Comparator() {
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

    /**
     * 특정 상태값과 일치하는 로그 개수를 센다.
     *
     * @param logs 상태를 검사할 로그 목록
     * @param jobStatus 찾고 싶은 상태값
     * @return 일치 건수
     */
    private int countByStatus(List logs, String jobStatus) {
        int count = 0;

        for (MigProgressDetailLogVO log : logs) {
            if (jobStatus.equals(log.getJobStatus())) {
                count++;
            }
        }

        return count;
    }

    /**
     * 그룹 대표 상태를 결정한다.
     *
     * 우선순위:
     * 1. 오류가 하나라도 있으면 ERROR
     * 2. 전부 완료면 COMPLETE
     * 3. 실행중이 있거나 일부라도 완료됐으면 RUNNING
     * 4. 그 외는 WAIT
     *
     * @return 그룹 대표 상태 문자열
     */
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

    /**
     * 문자열 시간을 LocalDateTime 으로 변환한다.
     *
     * 기본 함수 설명:
     * - trim() : 앞뒤 공백 제거
     * - parse() : 문자열을 날짜/시간 객체로 변환
     *
     * @param dateTimeText "yyyy-MM-dd HH:mm:ss" 형식 문자열
     * @return 변환된 LocalDateTime, 값이 비어있으면 null
     */
    private LocalDateTime parseDateTime(String dateTimeText) {
        if (dateTimeText == null || "".equals(dateTimeText.trim())) {
            return null;
        }

        return LocalDateTime.parse(dateTimeText, DATE_TIME_FORMATTER);
    }

    /**
     * 전체 소요시간 문자열을 만든다.
     *
     * minStartTime ~ maxEndTime 차이를 구해서
     * HH:mm:ss 형식 문자열로 반환한다.
     *
     * maxEndTime 이 없으면 현재 시간(LocalDateTime.now()) 기준으로 계산한다.
     *
     * 기본 함수 설명:
     * - Duration.between(a, b) : 두 시간 차이를 Duration 으로 계산
     * - getSeconds()           : 전체 초 반환
     * - String.format()        : 지정한 형식대로 문자열 생성
     *
     * @param minStartTime 가장 빠른 시작시간
     * @param maxEndTime 가장 늦은 종료시간
     * @return HH:mm:ss 형식 소요시간
     */
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

    /**
     * null 방지용 문자열 정리 함수
     *
     * null 이면 빈 문자열("") 반환,
     * 아니면 원래 문자열 그대로 반환한다.
     *
     * compareTo(), 문자열 결합, 화면 표시 전에
     * NullPointerException 방지용으로 자주 쓴다.
     *
     * @param value 원본 문자열
     * @return null 이 아니면 원본, null 이면 ""
     */
    private String safe(String value) {
        return value == null ? "" : value;
    }
}