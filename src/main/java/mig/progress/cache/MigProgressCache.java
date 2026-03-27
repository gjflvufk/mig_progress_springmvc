package mig.progress.cache;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import mig.progress.vo.MigProgressResponseVO;

/**
 * 서버 공용 캐시 컴포넌트다.
 *
 * 핵심 아이디어:
 * - DB에서 조회한 결과를 서버 메모리에 잠깐 저장한다.
 * - 여러 사용자가 같은 전환 현황을 볼 때, 같은 스냅샷을 재사용한다.
 * - 메인 화면과 상세 화면이 같은 시점 데이터를 보게 만든다.
 *
 * 주의:
 * - 이 캐시는 서버 메모리 캐시이므로 서버 재기동 시 초기화된다.
 * - 개인화 정보가 아니라 "전환 현황 공용 화면" 용도로 쓰는 구조다.
 */
@Component("migProgressCache")
public class MigProgressCache {

    /**
     * 지금 화면은 모든 사용자가 같은 현황을 봐야 하므로
     * 캐시 키를 하나만 사용한다.
     */
    private static final String CACHE_KEY = "migProgressResponse";

    /**
     * 캐시 유효시간(초)
     *
     * 예:
     * - 5초마다 화면 새로고침이면 TTL도 5초로 두는 것이 자연스럽다.
     * - TTL 동안에는 DB를 다시 조회하지 않는다.
     */
    private static final long TTL_SECONDS = 5L;

    /**
     * 실제 캐시 저장소
     *
     * ConcurrentHashMap을 쓴 이유:
     * - 여러 요청이 동시에 들어와도 기본적인 thread-safe를 확보하기 쉽다.
     * - 지금 프로젝트 규모에서는 별도 캐시 라이브러리 없이도 충분하다.
     */
    private final ConcurrentHashMap<String, MigProgressCacheValue> cacheMap =
            new ConcurrentHashMap<String, MigProgressCacheValue>();

    /**
     * 캐시에서 응답 객체를 조회한다.
     *
     * 동작:
     * 1. 캐시값이 없으면 null 반환
     * 2. 캐시값이 있지만 TTL이 지났으면 제거 후 null 반환
     * 3. 유효하면 캐시 응답 반환
     */
    public MigProgressResponseVO get() {
        MigProgressCacheValue cacheValue = cacheMap.get(CACHE_KEY);

        if (cacheValue == null) {
            return null;
        }

        if (isExpired(cacheValue)) {
            cacheMap.remove(CACHE_KEY);
            return null;
        }

        return cacheValue.getResponse();
    }

    /**
     * 캐시에 응답 객체를 저장한다.
     */
    public void put(MigProgressResponseVO response) {
        MigProgressCacheValue cacheValue = new MigProgressCacheValue();
        cacheValue.setResponse(response);
        cacheValue.setCachedAt(LocalDateTime.now());

        cacheMap.put(CACHE_KEY, cacheValue);
    }

    /**
     * 강제로 캐시를 비운다.
     *
     * 필요 시:
     * - 테스트 중 즉시 초기화
     * - 운영 중 강제 새로조회 버튼 연결
     */
    public void clear() {
        cacheMap.remove(CACHE_KEY);
    }

    /**
     * 캐시 만료 여부를 판단한다.
     */
    private boolean isExpired(MigProgressCacheValue cacheValue) {
        LocalDateTime cachedAt = cacheValue.getCachedAt();

        if (cachedAt == null) {
            return true;
        }

        return cachedAt.plusSeconds(TTL_SECONDS).isBefore(LocalDateTime.now());
    }
}
