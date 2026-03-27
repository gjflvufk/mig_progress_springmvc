package mig.progress.cache;

import java.time.LocalDateTime;

import mig.progress.vo.MigProgressResponseVO;

/**
 * 진행 현황 캐시 엔트리다.
 *
 * 역할:
 * 1. 실제 화면 응답 객체를 보관한다.
 * 2. 캐시에 언제 저장됐는지 시각을 보관한다.
 *
 * 왜 필요한가:
 * - 서버 캐시를 쓰면 "데이터"와 "만료 판단 기준 시각"을 같이 들고 있어야 한다.
 * - 메인 화면과 상세 화면이 같은 스냅샷을 보게 만들 수 있다.
 */
public class MigProgressCacheValue {

    /**
     * 메인 화면/상세 화면이 공용으로 사용할 응답 객체
     */
    private MigProgressResponseVO response;

    /**
     * 캐시에 저장된 시각
     */
    private LocalDateTime cachedAt;

    public MigProgressResponseVO getResponse() {
        return response;
    }

    public void setResponse(MigProgressResponseVO response) {
        this.response = response;
    }

    public LocalDateTime getCachedAt() {
        return cachedAt;
    }

    public void setCachedAt(LocalDateTime cachedAt) {
        this.cachedAt = cachedAt;
    }
}
