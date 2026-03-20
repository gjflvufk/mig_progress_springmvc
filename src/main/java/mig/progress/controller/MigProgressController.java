package mig.progress.controller;
import java.util.Collections;
import java.util.List;

import mig.progress.model.MigLogVO;
import mig.progress.service.MigProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

/**
 * 화면 진입과 데이터 조회를 담당하는 Controller 다.
 *
 * URL 구성
 * ------------------------------------------------------------------
 * 1) /mig/progress/view.do
 *    - JSP 화면으로 이동
 *
 * 2) /mig/progress/all.do
 *    - 전체 로그 1000건 JSON 반환
 *    - 화면의 JavaScript 가 이 API 를 호출해 통계를 계산한다.
 */
@Controller
@RequestMapping("/mig/progress")
public class MigProgressController {

    private final MigProgressService migProgressService;

    @Autowired
    public MigProgressController(MigProgressService migProgressService) {
        this.migProgressService = migProgressService;
    }

    /**
     * 전환 진행률 JSP 화면 진입.
     *
     * 반환 문자열 "migProgress" 는
     * ViewResolver 설정에 의해
     * /WEB-INF/views/migProgress.jsp 로 연결된다.
     */
    @RequestMapping(value = "migprogress", method = RequestMethod.GET)
    public String showMigProgressPage() {
        return "migProgress";
    }

    /**
     * 전체 로그 JSON 반환.
     *
     * @ResponseBody 가 붙어 있으므로
     * 반환 객체(List<MigLog>)는 JSP 로 가지 않고
     * JSON 으로 변환되어 브라우저에 내려간다.
     */
    @RequestMapping(value = "mig/progress/all", method = RequestMethod.GET)
    @ResponseBody
    public List<MigLogVO> selectAllLogs() {
        try{
          return migProgressService.selectAllLogs();  
        }catch(Exception e){
          e.printStackTrace();
          return Collections.emptyList();
        }
        
    }
}
