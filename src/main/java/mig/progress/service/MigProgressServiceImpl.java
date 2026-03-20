package mig.progress.service;

import mig.progress.model.MigLogVO;
import mig.progress.repository.MigProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 서비스 구현체다.
 *
 * 현재는 전체 로그 조회만 수행한다.
 * 나중에 DB 연결 후에도 Controller 는 이 Service 만 바라보게 하고,
 * 내부 구현만 바꾸면 되므로 변경 영향이 줄어든다.
 */
@Service
public class MigProgressServiceImpl implements MigProgressService {

    private final MigProgressRepository migProgressRepository;

    /**
     * 생성자 주입 방식 사용.
     *
     * 이유:
     * - 필수 의존성이 명확하다.
     * - 테스트 시 가짜 구현체 주입이 쉽다.
     * - 필드 주입보다 구조 파악이 쉽다.
     */
    @Autowired
    public MigProgressServiceImpl(MigProgressRepository migProgressRepository) {
        this.migProgressRepository = migProgressRepository;
    }

    @Override
    public List<MigLogVO> selectAllLogs() {
        return migProgressRepository.selectAllLogs();
    }
}
