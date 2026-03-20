package mig.progress.repository;

import mig.progress.model.MigLogVO;

import java.util.List;

/**
 * Repository 인터페이스다.
 *
 * 지금은 FakeRepository 구현체가 붙는다.
 * 나중에 DB 연결 시에는 이 인터페이스를 구현하는
 * RealRepository 를 추가해서 교체하면 된다.
 */
public interface MigProgressRepository {

    /**
     * 화면에 필요한 전체 로그를 조회한다.
     * 현재는 DB 대신 더미 데이터를 반환한다.
     */
    List<MigLog> selectAllLogs();
}
