package mig.progress.controller;

import java.util.Collections;

import javax.annotation.Resource;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import egovframework.example.mig.service.MigProgressResponseVO;
import egovframework.example.mig.service.MigProgressService;

@Controller
public class MigProgressController {

    @Resource(name = "migProgressService")
    private MigProgressService migProgressService;

    /**
     * 진행률 메인 화면 진입
     * URL 예시: /migprogress.do
     */
    @RequestMapping(value = "/migprogress", method = RequestMethod.GET)
    public String showMigProgressPage() {
        return "migProgress";
    }

@RequestMapping("/mig/progress/detail.do")
public String detailPage() {
    return "migProgressDetail";
}
    /**
     * 화면에서 사용할 전체 진행률 데이터 조회
     * 반환 구조:
     * - summary: 상단 요약 정보
     * - groups : 마스터/상세 테이블 정보
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
}
