package mig.progress.service;

import mig.progress.vo.MigProgressGroupVO;
import mig.progress.vo.MigProgressResponseVO;

/**
 * 진행 현황 서비스 인터페이스다.
 *
 * 역할:
 * - 메인 화면에서 쓸 전체 응답(summary + groups) 제공
 * - 상세 화면에서 쓸 특정 그룹 1건 제공
 */
public interface MigProgressService {

    /**
     * 메인 화면용 전체 진행 현황을 반환한다.
     */
    MigProgressResponseVO selectMigProgress() throws Exception;

    /**
     * groupKey에 해당하는 특정 그룹 1건을 반환한다.
     *
     * 이 메서드는 "같은 캐시 응답" 안에서 그룹을 찾아 반환한다.
     * 즉 상세 화면 때문에 DB를 따로 다시 치지 않는 구조다.
     */
    MigProgressGroupVO selectGroupDetail(String groupKey) throws Exception;
}
