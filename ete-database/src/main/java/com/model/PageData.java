package com.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.*;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * @author AndyChen
 * @version <ul>
 * <li>2018/3/7 AndyChen,new
 * </ul>
 * @since 2018/3/7
 */
@Entity
@Table(name = "E2E_PAGE_DATA")
public class PageData implements Serializable {

    private static final Logger logger = LoggerFactory.getLogger(PageData.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "TEST_CASE_NAME", nullable = false)
    private String testCaseName;

    @Column(name = "PAGE_URL", nullable = false)
    private String pageUrl;

    @Column(name = "DATA_JSON_STR", nullable = false)
    private String dataJsonStr;

    @Transient
    private List<JsonData> jsonDatas; //TODOed must order data


    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTestCaseName() {
        return testCaseName;
    }

    public void setTestCaseName(String testCaseName) {
        this.testCaseName = testCaseName;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
    }

    public String getDataJsonStr() {
        return dataJsonStr;
    }

    public void setDataJsonStr(String dataJsonStr) throws IOException {
        this.dataJsonStr = dataJsonStr;
        if (this.jsonDatas != null)
            return;
        ObjectMapper mapper = new ObjectMapper();
        List<JsonData> dataJsonList = mapper.readValue(dataJsonStr, new TypeReference<List<JsonData>>() {
        });
        List<JsonData> resultDatas = new ArrayList<>();
        resultDatas.addAll(dataJsonList);
        this.jsonDatas = resultDatas;
    }

    public List<JsonData> getJsonDatas() {
        if (this.jsonDatas == null && this.dataJsonStr != null) {
            try {
                this.setDataJsonStr(this.dataJsonStr);
            } catch (IOException e) {
                logger.warn("", e);
            }
        }
        return jsonDatas;
    }

    private void setJsonDatas(List<JsonData> jsonDatas) throws IOException {
        this.jsonDatas = jsonDatas;
        if (this.dataJsonStr != null)
            return;
        this.dataJsonStr = new ObjectMapper().writeValueAsString(jsonDatas);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PageData)) return false;
        PageData pageData = (PageData) o;
        return getId() == pageData.getId() && (getTestCaseName() != null ? getTestCaseName().equals(pageData.getTestCaseName())
                : pageData.getTestCaseName() == null) && (getPageUrl() != null ? getPageUrl().equals(pageData.getPageUrl())
                : pageData.getPageUrl() == null) && (getDataJsonStr() != null ? getDataJsonStr().equals(pageData.getDataJsonStr())
                : pageData.getDataJsonStr() == null) && (getJsonDatas() != null ? getJsonDatas().equals(pageData.getJsonDatas())
                : pageData.getJsonDatas() == null);
    }

    @Override
    public int hashCode() {
        int result = getId();
        result = 31 * result + (getTestCaseName() != null ? getTestCaseName().hashCode() : 0);
        result = 31 * result + (getPageUrl() != null ? getPageUrl().hashCode() : 0);
        result = 31 * result + (getDataJsonStr() != null ? getDataJsonStr().hashCode() : 0);
        result = 31 * result + (getJsonDatas() != null ? getJsonDatas().hashCode() : 0);
        return result;
    }

    @Override
    public String toString() {
        return "PageData{" +
                "id=" + id +
                ", testCaseName='" + testCaseName + '\'' +
                ", pageUrl='" + pageUrl + '\'' +
                ", dataJsonStr='" + dataJsonStr + '\'' +
                ", jsonDatas=" + jsonDatas +
                '}';
    }
}
