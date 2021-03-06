package com.service;

import com.model.PageData;
import com.model.TestCase;
import org.openqa.selenium.WebDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

/**
 * @author AndyChen
 * @version <ul>
 * <li>2018/3/08, AndyChen,new
 * </ul>
 * @since 2018/3/08
 */
@Service
public class PageTestControlService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PageTestControlService.class);

    private final
    ApplicationContext applicationContext;

    @Autowired
    public PageTestControlService(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    public void startTest(WebDriver driver, String hostUrl, TestCase testCase) throws NoSuchMethodException,
            InstantiationException,
            IllegalAccessException, InvocationTargetException {
        try {
            if(hostUrl.lastIndexOf('/') == hostUrl.length() - 1)
                hostUrl = hostUrl.substring(0, hostUrl.length() - 1 );
            List<PageData> pageDatas = testCase.getPageDatas();
            ArrayList<PageTestService> testServices = this.initAllClasses(driver, testCase, pageDatas);
            //TODO change logic
            PageTestService indexService = testServices.get(0);
            indexService.testPage(true, hostUrl);
        } finally {
            driver.quit();
        }
    }

    private ArrayList<PageTestService> initAllClasses(WebDriver driver, TestCase testCase, List<PageData> pageDatas) throws
            InvocationTargetException, NoSuchMethodException, InstantiationException, IllegalAccessException {

        Class<?>[] classess = getPageServiceClasses(testCase);
        ArrayList<PageTestService> testServices = new ArrayList<>();
        PageTestService[] temp = new PageTestService[pageDatas.size()];

        for (int i = pageDatas.size() - 1; i >= 0; i--) {
            if (i == pageDatas.size() - 1) {
                temp[i] = this.initClasses(driver, pageDatas.get(i), classess[i]);
            } else {
                PageTestService preTestService = temp[i + 1];
                temp[i] = this.initClasses(driver, preTestService, pageDatas.get(i), classess[i]);
            }
        }
        testServices.addAll(Arrays.asList(temp));
        return testServices;
    }

    private PageTestService initClasses(WebDriver driver, PageData pageData, Class<?> initClass) throws
            NoSuchMethodException, IllegalAccessException, InstantiationException, InvocationTargetException {
        Class[] oParam = new Class[2];
        oParam[0] = WebDriver.class;
        oParam[1] = PageData.class;
        Constructor constructor = initClass.getConstructor(oParam);
        Object[] paramObjs = new Object[2];
        paramObjs[0] = driver;
        paramObjs[1] = pageData;
        return (PageTestService) constructor.newInstance(paramObjs);
    }

    private PageTestService initClasses(WebDriver driver, PageTestService nextService, PageData pageData,
                                        Class<?> initClass) throws NoSuchMethodException,
            IllegalAccessException, InvocationTargetException, InstantiationException {
        Class[] oParam = new Class[3];
        oParam[0] = WebDriver.class;
        oParam[1] = PageTestService.class;
        oParam[2] = PageData.class;
        Constructor constructor = initClass.getConstructor(oParam);

        Object[] paramObjs = new Object[3];
        paramObjs[0] = driver;
        paramObjs[1] = nextService;
        paramObjs[2] = pageData;
        return (PageTestService) constructor.newInstance(paramObjs);
    }

    private Class[] getPageServiceClasses(TestCase testCase) {
        HashMap serviceClassesMap =
                applicationContext.getBean("serviceClassesMap", HashMap.class);
        List<PageData> pageDatas = testCase.getPageDatas();
        List<Class> list = new ArrayList<>();
        for (PageData pageData : pageDatas) {
            String pageUrl = pageData.getPageUrl();
            String serviceClassUrl = String.valueOf(serviceClassesMap.get(pageUrl)).replaceAll("-", "_");
            Class serviceClass = null;
            try {
                if (!"null".equals(serviceClassUrl))
                    serviceClass = Class.forName(serviceClassUrl);
            } catch (ClassNotFoundException e) {
                LOGGER.warn("",e);
            }
            list.add(serviceClass);
        }
        return list.toArray(new Class[list.size()]);
    }
}
