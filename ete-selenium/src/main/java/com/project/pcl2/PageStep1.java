package com.project.pcl2;

import com.model.PageData;
import com.service.PageTestService;
import org.openqa.selenium.WebDriver;

/**
 * @author AndyChen
 * @version <ul>
 *          <li>2018/3/07, AndyChen,new
 *          </ul>
 * @since 2018/3/07
 */
public class PageStep1 extends PageTestService {

    public PageStep1(WebDriver driver, PageTestService nextService, PageData pageData) {
        super(driver, nextService, pageData);
        super.setUseCommonSetData(true);
    }

    public PageStep1(WebDriver driver, PageData pageData) {
        super(driver, pageData);
        super.setUseCommonSetData(true);
    }

    @Override
    protected void setDataToPageUsePageOwnWay() {


    }
}
