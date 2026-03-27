package mig.progress.controller;

import javax.annotation.Resource;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import mig.progress.service.MigProgressService;
import mig.progress.vo.MigProgressGroupVO;
import mig.progress.vo.MigProgressResponseVO;

/**
 * 진행 현황 컨트롤러다.
 *
 * 이번 리팩토링 포인트:
 * - 메인 화면 진입
 * - 메인 화면 데이터 API
 * - 상세 화면 진입
 * - 상세 화면 데이터 API
 *
 * 메인/상세가 서로 다른 URL을 사용하지만,
 * 내부적으로는 같은 서버 캐시 응답을 공유한다.
 */
@Controller
public class MigProgressController {

    @Resource(name = "migProgressService")
    private MigProgressService migProgressService;

    /**
     * 메인 화면 진입
     *
     * 예:
     * /migprogress.do
     */
    @RequestMapping(value = "/migprogress", method = RequestMethod.GET)
    public String showMigProgressPage() {
        return "migProgress";
    }

    /**
     * 메인 화면용 전체 진행 현황 API
     *
     * 반환:
     * - summary
     * - groups
     */
    @RequestMapping(value = "/mig/progress/all", method = RequestMethod.GET)
    @ResponseBody
    public MigProgressResponseVO selectAllProgress() {
        try {
            return migProgressService.selectMigProgress();
        } catch (Exception e) {
            e.printStackTrace();
            return MigProgressResponseVO.empty();
        }
    }

    /**
     * 상세 화면 진입
     *
     * 메인 화면에서 새 탭으로 이 URL을 연다.
     * groupKey는 JS에서 query string으로 전달한다.
     */
    @RequestMapping(value = "/mig/progress/detail", method = RequestMethod.GET)
    public String showMigProgressDetailPage() {
        return "migProgressDetail";
    }

    /**
     * 상세 화면용 특정 그룹 조회 API
     *
     * 메인과 같은 캐시 스냅샷 안에서 groupKey에 해당하는 그룹 1건을 찾아 반환한다.
     */
    @RequestMapping(value = "/mig/progress/detail/data", method = RequestMethod.GET)
    @ResponseBody
    public MigProgressGroupVO selectDetailProgress(String groupKey) {
        try {
            return migProgressService.selectGroupDetail(groupKey);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
