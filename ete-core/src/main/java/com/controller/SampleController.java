package com.controller;

import com.model.TestCase;
import com.service.BrowserControlService;
import com.service.impl.BrowserControlServiceImpl;
import com.service.impl.DataControlServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author MarkHuang
 * @version <ul>
 * <li>2018/2/7, MarkHuang,new
 * </ul>
 * @since 2018/2/7
 */
@Controller
public class SampleController {
    private final BrowserControlServiceImpl browserControlService;

    private final DataControlServiceImpl dataControlService;

    @Autowired
    public SampleController(DataControlServiceImpl dataControlService, BrowserControlServiceImpl browserControlService) {
        this.dataControlService = dataControlService;
        this.browserControlService = browserControlService;
    }

    @RequestMapping("/hello")
    @ResponseBody
    public String sampleMethod() {
        return "Hello E2E";
    }

    @RequestMapping("/data")
    public String show(Model model, String projectName) {
        model.addAttribute("metaTitle", "E2E Index");
        model.addAttribute("projectName", projectName);
        model.addAttribute("script", new String[]{"DataParser", "popup"});
        model.addAttribute("css", new String[]{"popup"});
        return "html/test_data";
    }

    @GetMapping("/project_name")
    @ResponseBody
    public List<String> getJsonResultViaAjax() {
        return dataControlService.getProjectName();
    }


    @PutMapping("/testCaseData")
    @ResponseBody
    public boolean putDataToDb(@RequestBody TestCase testCase) {
        //Todo delete是否需要新增一個 D欄位保留一次反悔的機會
        dataControlService.deletePageData(testCase.getTestCaseName());
        dataControlService.saveTestCase(testCase);
        return true;
    }

    @PostMapping("/testCaseData")
    @ResponseBody
    public boolean startTesting(@RequestBody TestCase testCase) {
        boolean savingResult = this.putDataToDb(testCase);
        if (!savingResult) return false;
        browserControlService.startTestProcedure(testCase, BrowserControlService.SELENIUM);
        return true;
    }

    @GetMapping("/testCaseData")
    @ResponseBody
    public boolean startTesting(@RequestBody String testCaseName) {
        TestCase testCase = dataControlService.getTestCase(testCaseName);
        browserControlService.startTestProcedure(testCase, BrowserControlService.SELENIUM);
        return true;
    }

    @GetMapping("/allTestCaseData")
    @ResponseBody
    public ResponseEntity<?> getAllTestCaseData(String projectName) {
        List<TestCase> testCaseList = dataControlService.loadAllTestCaseFromProject(projectName);
        return ResponseEntity.ok(testCaseList);
    }
}
