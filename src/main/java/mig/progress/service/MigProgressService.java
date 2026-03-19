package mig.progress.service;

import mig.progress.model.MigLog;

import java.util.List;

/**
 * 서비스 인터페이스다.
 *
 * 지금은 Repository 위임만 하지만,
 * 나중에 요구사항이 커지면 여기서
 * - 조회조건 검증
 * - 통계 계산
 * - 응답 가공
 * - 권한 처리
 * 를 추가하기 쉽다.
 */
public interface MigProgressService {

    List<MigLog> selectAllLogs();
}
