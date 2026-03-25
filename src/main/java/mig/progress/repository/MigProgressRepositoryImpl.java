package mig.progress.repository;

import java.util.List;

import javax.annotation.Resource;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import mig.progress.model.MigProgressDetailLogVO;

@Repository("migProgressRepository")
public class MigProgressRepositoryImpl implements MigProgressRepository {

    private static final String NAMESPACE = "mig.progress.repository.MigProgressRepository";

    @Resource(name = "migProgressTestRepository")
    private MigProgressTestRepository migProgressTestRepository;

    @Resource(name = "sqlSession")
    private SqlSessionTemplate sqlSession;

    @Value("${mig.progress.data-source:test}")
    private String dataSourceType;

    @Override
    public List<MigProgressDetailLogVO> selectAllProgressLogs() throws Exception {
        if (isTestMode()) {
            return selectAllProgressLogsFromTest();
        }

        return selectAllProgressLogsFromDb();
    }

    private List<MigProgressDetailLogVO> selectAllProgressLogsFromTest() {
        return migProgressTestRepository.selectAllProgressLogs();
    }

    private List<MigProgressDetailLogVO> selectAllProgressLogsFromDb() {
        return sqlSession.selectList(NAMESPACE + ".selectAllProgressLogs");
    }

    private boolean isTestMode() {
        return "test".equalsIgnoreCase(dataSourceType);
    }
}