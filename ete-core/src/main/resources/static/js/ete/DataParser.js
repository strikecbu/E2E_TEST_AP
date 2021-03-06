/**
 * @author MarkHuang
 * @since  2018/3/08
 */
//import is not support from chrome
// import {ShortKey} from 'tool';

(($) => {
    const $TEST_CASE_TABLES = $('#append_table');
    const JSON_OBJECT_KEY = ['id', 'value', 'dataType', 'beforeScript'];
    const DEFAULT_PAGE_URL_ARRAY = DEFAULT_PAGE_URL === '' ? [] : DEFAULT_PAGE_URL.split(',');
    let testCaseName = '';
    let hostUrl = '';
    let pageUrl = [];
    //紀錄每一頁的table element
    let $dataTable = [];
    //紀錄page中table的行數
    let countDataTableRow = [];
    //有幾頁page,這邊的page不是真的分頁,只是複數table的隱藏與顯示,
    //且一個table對應一個page,一次只顯示一個table
    let pageCount = 0;
    let nowDisplayPage = 0;
    //紀錄在產生json data時所遇到的錯誤
    let generateJsonDataErrorMsg = [];

    /**
     * 在頁面載入時初始化頁面
     * 1.在console放入banner
     * 2.新增一個初始頁面
     * 3.將當前頁面的頁碼套上active效果
     */
    (function initPage() {
        Banner.welcome();
        newPage(true);
        displayPage(pageCount);
        $('.page_btn').eq(nowDisplayPage - 1).addClass('page-active');
        Logger.info("page is init");
    }());

    /**
     * 新增一個page,並隱藏其他page的table
     * @param initFirst 初始化每一個table的第一行
     * @param isAfter   頁面是添加在當前table之後還是所有table之後
     */
    function newPage(initFirst = false, isAfter = false) {
        let pageIndex = 0;
        if (isAfter) {
            $dataTable[nowDisplayPage - 1].parent().after(createTableElement());
            resetAllPage();
            pageIndex = nowDisplayPage + 1;
        } else {
            $TEST_CASE_TABLES.append(createTableElement());
            pageIndex = pageCount;
        }
        $dataTable[pageIndex - 1] = $(`.page_tab`).eq(pageIndex - 1).find('tbody');
        if (initFirst) {
            $dataTable[pageIndex - 1].append(createTableDataElement(pageIndex));
        }
        $('#append_page_number').before(
            `<li class="my-pagination-item page_btn cursor-point" page="${pageCount}">
                <span class=" my-pagination-link ">
                    ${pageCount}
                </span>
            </li>`);
    }

    /**
     * 將所有table隱藏,只顯示傳入的頁面編號對應的table
     * @param pageNumber 頁面編號
     */
    function displayPage(pageNumber) {
        $(`table`).addClass('hide');
        $(`.page_tab`).eq(pageNumber - 1).removeClass('hide');
        clearAllPageAction();
        $('.page_btn').eq(pageNumber - 1).addClass('page-active');
        nowDisplayPage = pageNumber;
    }

    /**
     * 刪除目前所有的page,並初始化所有的參數
     * 1.刪除所有table
     * 2.刪除所有頁碼
     * 3.初始化所有頁面參數
     */
    function deleteAllPage() {
        $('table').remove();
        $('.page_btn').remove();
        $dataTable = [];
        pageUrl = [];
        countDataTableRow = [];
        pageCount = 0;
        nowDisplayPage = 0;
    }

    /**
     * 刪除頁面下方所有page編號的hover效果
     */
    function clearAllPageAction() {
        $('.page_btn').removeClass('page-active');
    }

    /**
     * 重置所有的page,table將page的對應關係完全刷新
     */
    function resetAllPage() {
        $dataTable = [];
        countDataTableRow = [];
        pageCount = 0;
        const $TABLE = $TEST_CASE_TABLES.find('table');
        const $PAGE_NUMBER = $('.page_btn');
        $TEST_CASE_TABLES.find('tbody').each((index, me) => {
            pageCount++;
            $TABLE.eq(index).attr('id', 'page_' + (index + 1));
            countDataTableRow.push($(me).find('tr').length);
            $dataTable.push($(me));
            $PAGE_NUMBER.eq(index).attr('page', pageCount);
            $PAGE_NUMBER.eq(index).find('.my-pagination-link').text(index + 1);
        });
    }

    /**
     * 重置table中所有列的編號
     */
    function resetTableRowOrder() {
        countDataTableRow[nowDisplayPage - 1] = 0;
        $dataTable[nowDisplayPage - 1].find('tr').each((index, me) => {
            $(me).find('td:first').text(index + 1);
            countDataTableRow[nowDisplayPage - 1] = index + 1;
        });
    }

    /**
     * table顯示p元素還是input元素
     * @param isInput input元素是否顯示
     */
    function displayTableSpan(isInput = true) {
        const TBODY = $('tbody');
        if (isInput) {
            TBODY.addClass('hide-odd-span');
            TBODY.removeClass('hide-even-span');
        } else {
            TBODY.addClass('hide-even-span');
            TBODY.removeClass('hide-odd-span');
        }
    }

    /**
     * 清空所有table的所有列的focus效果
     */
    function clearPageFocusRow() {
        if ((!window.event.ctrlKey && !window.event.shiftKey)) {
            $(`.page_tab`).eq(nowDisplayPage - 1).find('tr').removeClass('focusNow');
        }
    }

    /**
     * 新增一列在當前focus的元素下方,若無元素被focus則新增一列在最下方
     */
    function plusRow() {
        const $TR = $dataTable[nowDisplayPage - 1].find('tr');
        let isAnyTrAdd = false;
        if ($TR.length !== 0) {
            $TR.each((index, me) => {
                if ($(me).hasClass('focusNow')) {
                    $(me).after(createTableDataElement(nowDisplayPage));
                    isAnyTrAdd = true;
                }
            });
            if (!isAnyTrAdd) {
                $TR.last().after(createTableDataElement(nowDisplayPage));
            }
        } else {
            $dataTable[nowDisplayPage - 1].append(createTableDataElement(nowDisplayPage))
        }
        resetTableRowOrder();
    }

    /**
     * 在最後方新增一頁
     */
    function plusPage() {
        newPage(true);
        pageUrl = EteArrayUtil.insert(pageUrl, pageCount, '');
    }

    /**
     * 在當前頁面後新增一頁
     */
    function plusPageAfterCurrentPage() {
        newPage(true, true);
        pageUrl = EteArrayUtil.insert(pageUrl, nowDisplayPage, '');
    }

    /**
     * 刪除當前focus的列元素,若無元素被focus則刪除最下方一列,若只剩一列則刪除當前頁面
     */
    function minusRow() {
        const $TR = $dataTable[nowDisplayPage - 1].find('tr');
        if ($TR.length === 1) {
            minusCurrentPage();
            return;
        }
        let isAnyTrRemove = false;
        $TR.each((index, me) => {
            if ($(me).hasClass('focusNow')) {
                $(me).remove();
                isAnyTrRemove = true;
            }
        });
        if (!isAnyTrRemove) {
            $TR.last().remove();
        }
        resetTableRowOrder();
    }

    /**
     * 刪除最後面一頁,若只剩一頁則不做動作
     */
    function minusPage() {
        if (pageCount <= 1) return;
        const NOW_PAGE_INDEX = nowDisplayPage - 1;
        pageUrl = pageUrl.remove(pageCount - 1);
        $('table:last').remove();
        $('.page_btn:last').remove();
        resetAllPage();
        if (NOW_PAGE_INDEX === pageCount) displayPage(pageCount);
    }

    /**
     * 刪除當前頁面,若只剩一頁則不動作
     */
    function minusCurrentPage() {
        if (pageCount <= 1) return;
        const NOW_PAGE_INDEX = nowDisplayPage - 1;
        pageUrl = pageUrl.remove(NOW_PAGE_INDEX);
        $('table').eq(NOW_PAGE_INDEX).remove();
        $('.page_btn').eq(NOW_PAGE_INDEX).remove();
        resetAllPage();
        displayPage(NOW_PAGE_INDEX === 0 ? 1 : NOW_PAGE_INDEX);
    }

    /**
     * 產生popup視窗,給使用者完善test case資料
     */
    function popupTestCaseInformation() {
        let options = '';
        DEFAULT_PAGE_URL_ARRAY.forEach(value => {
            options += `
                <option value='${value}'>${value}</option>`;
        });
        let urlElement = '';
        for (let i = 0; i < pageCount; i++) {
            urlElement += `
                    <div   class="pop-block-div">
                        <div>
                        <span>page ${i + 1} url : </span>
                        <select class='pop-sel pop-url'>
                            ${options}
                        </select>
                        </div>
                    </div>`;
        }
        const POP_HTML = `
            <div>
                <h3>${PROJECT_NAME}</h3>
                <div class="pop-block-div" style='text-align: right;font-size: 1.2rem;'>
                    <div style="margin-bottom: 1rem;">
                        <span>Test Case Name : </span>
                        <input spellcheck='false' class="pop-inp" id="pop-test-case-name" type='text' />
                    </div>
                    <div>
                        <span>Host Url :</span>
                        <input spellcheck='false' class="pop-inp" id="pop-test-case-host-url" type='text' />
                    </div>
                </div>
                <div class="popup-inner-div">${urlElement}</div>
                <div class="text-right" id="pop-save"><button>save</button></div>
            </div>`;
        PopUp.pop(POP_HTML);
        $('#pop-test-case-name').val(testCaseName || '');
        $('#pop-test-case-host-url').val(hostUrl || '');
        const $POP_URL = $('.pop-url');
        $POP_URL.each((i, e) => {
            e.value = pageUrl[i] || '';
        });
    }

    /**
     * 產生選擇test case的popup視窗
     * @param testCaseNameArray 所有test case的名稱
     */
    function popupChoseTestCase(testCaseNameArray = []) {
        let testCaseElements = '';
        testCaseNameArray.forEach(name => {
            testCaseElements += `
                <div class="pop-block-div take_json_data"   style='text-align: left;font-size: 1.2rem' case-name='${name}'>
                    <div><span>Test Case Name : </span><span>${name} </span></div>  
                </div>`;
        });
        const POP_HTML = `
            <div>
                <h3>${PROJECT_NAME}</h3>
                <div class="popup-inner-div">${testCaseElements}</div>
                <div class="text-right" ><button id="load-test-case">load</button></div>
            </div>`;
        PopUp.pop(POP_HTML);
    }

    /**
     * 解析json陣列,並設置test case的url
     * @param jsonTestCaseArray test case的json陣列
     * @returns {Promise.<void>}
     */
    async function analyzeJsonArray(jsonTestCaseArray) {
        testCaseName = jsonTestCaseArray[0]['testCaseName'] || '';
        jsonTestCaseArray.forEach(async data => {
            pageUrl.push(data['pageUrl']);
            await injectPageJsonData(JSON.parse(data['dataJsonStr']));
        });
    }

    /**
     * 讀取json data並依照資料內容產生page與table
     * @param pageJsonDataArray json data陣列
     */
    async function injectPageJsonData(pageJsonDataArray = {}) {
        return new Promise((resolve) => {
            newPage();
            let thisDataTable = $(`.page_tab`).eq(pageCount - 1).find('tbody');
            $dataTable.push(thisDataTable);
            pageJsonDataArray.forEach((jsonObj, rowIndex) => {
                thisDataTable.append(createTableDataElement(pageCount));
                const $TD = thisDataTable.find('td');
                const $ITEM = $TD.find('span');
                JSON_OBJECT_KEY.forEach((key, index) => {
                    $ITEM.eq(rowIndex * 8 + index * 2).text(jsonObj[key]);
                    $ITEM.eq(rowIndex * 8 + index * 2 + 1).find('input, select').val(jsonObj[key]);
                });
            });
            resolve(true);
        });
    }

    /**
     * 創建 table element
     * @returns {string}
     */
    function createTableElement() {
        pageCount++;
        return `
            <table class='table table-responsive table-hover hide page_tab'>
                <thead onselectstart="return false">
                    <tr class='not_focus'>
                        <th>
                            <span class='plus img-hover-opa1 cursor-point'><img class='w1rem' src='./image/plus.png'/></span>
                            <span class='minus  padding-ld6 img-hover-opa1 cursor-point'><img class='w1d4rem' src='./image/minus.png'/></span>
                            <span class='edit  padding-ld6 img-hover-opa1 cursor-point'><img class='w1rem' src='./image/edit.png'/></span>
                            <span class='save padding-ld6 img-hover-opa1 cursor-point'><img class='w1rem' src='./image/save.png'/></span>
                        </th>
                        <th>ID</th>
                        <th>Value</th>
                        <th>Type</th>
                        <th> BeforeScript</th>
                    </tr>
                </thead>
                <tbody class='hide-odd-span'  id='data_table'></tbody>
            </table>`;
    }


    /**
     * 創建table element的內部元素
     * @param page current page 當前頁面
     * @returns {string} new table element string
     */
    function createTableDataElement(page) {
        countDataTableRow[page - 1] = countDataTableRow[page - 1] || 0;
        const ROW = countDataTableRow[page - 1];
        countDataTableRow[page - 1]++;
        return `
            <tr tabindex='1'>
                <td>
                    ${ROW + 1}
                </td>
                <td>
                    <span></span>
                    <span><input spellcheck='false'   type='text'/></span>
                </td>
                <td>
                    <span></span>
                    <span><input spellcheck='false'   type='text'/></span>
                </td>
                <td>
                    <span>text</span>
                    <span>
                        <select>
                            <option value='text'>text</option>
                            <option value='select'>select</option>
                            <option value='radio'>radio</option>
                            <option value='checkbox'>checkbox</option>
                        </select>
                    </span>
                </td>
                <td>
                    <span></span>
                    <span><input spellcheck='false'   type='text'/></span>
                </td>
            </tr>`;
    }

    /**
     *遍歷所有table中的input元素,並將其值保存為物件,若欄位id為空,且before script 也為空,
     * 則保存警告訊息至全域變數generateJsonDataErrorMsg[]
     * @returns {Array} json object array   json 物件
     */
    function generatePageJsonObject(page) {
        let pageJsonObject = [];
        let jsonObject = {};
        const $TR = $dataTable[page - 1].find('tr');
        const $ITEM = $TR.find('td').find('span');
        for (let i = 0; i < $TR.length * 4; i++) {
            jsonObject[JSON_OBJECT_KEY[i % 4]] = $ITEM.eq(i * 2 + 1).find('input, select').val();
            if (i % 4 === 3) {
                pageJsonObject[pageJsonObject.length] = jsonObject;
                if (jsonObject['id'] === '' && jsonObject['beforeScript'] === '') {
                    generateJsonDataErrorMsg.push(`第${page}頁第${~~(i / 4) + 1}列的id不得為空`);
                }
                jsonObject = {};
            }
        }
        return pageJsonObject;
    }

    /**
     * 產生pageData的物件
     * @returns {Array}
     */
    function generateJsonPageDataArray() {
        let jsonPageDataArray = [];
        generateJsonDataErrorMsg = [];
        for (let i = 1; i <= pageCount; i++) {
            let jsonObject = {};
            jsonObject.pageUrl = pageUrl[i - 1];
            jsonObject.jsonDatas = generatePageJsonObject(i);
            jsonObject.testCaseName = testCaseName;
            jsonPageDataArray.push(jsonObject);
        }
        return jsonPageDataArray;
    }

    /**
     * 產生testCase的物件
     * @returns {{testCaseName: string, projectName, pageDatas: Array}}
     */
    function generateJsonTestCase() {
        return {
            testCaseName: testCaseName,
            projectName: PROJECT_NAME,
            pageDatas: generateJsonPageDataArray(),
            hostUrl: $("#hostUrl").val()
        };
    }

    /**
     * 傳入後端project name回傳json格式的test case
     * @returns {Promise}
     */
    async function getJsonObjectArray() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "GET",
                contentType: "application/json",
                url: "./allTestCaseData?projectName=" + PROJECT_NAME,
                dataType: 'json',
                cache: false,
                timeout: 600000,
                success: function (data) {
                    if (data && data.length !== 0) {
                        resolve(data);
                    } else {
                        reject(new Error('data is empty'));
                    }
                },
                error: function (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * 將產生的test case 物件傳給後端,預設為PUT傳輸
     * @param mappingType 傳輸的方法
     * @returns {Promise}
     */
    async function sendJsonObjectArray(mappingType = 'PUT') {
        return new Promise((resolve, reject) => {
            const TEST_CASE_DATA = JSON.stringify(generateJsonTestCase());
            if (generateJsonDataErrorMsg.length !== 0) {
                generateJsonDataErrorMsg.forEach(msg => Logger.error(msg));
                reject(new Error('data is not ok'));
                return;
            }
            $.ajax({
                type: mappingType,
                contentType: "application/json",
                url: "./testCaseData",
                data: TEST_CASE_DATA,
                timeout: 600000,
                success: function (d) {
                    resolve(d);
                }, error: function (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * 向後端傳送test case name
     * @returns {Promise}
     */
    async function sendTestCaseNameAndHostUrl() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                contentType: "application/json",
                url: "./testCaseData",
                data: {testCaseName, hostUrl},
                timeout: 600000,
                success: function (d) {
                    d === true ? resolve(true) : resolve(false);
                }, error: function (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * 讀取test case物件並依照page data數量產生table
     * @param currentTarget
     * @returns {Promise.<void>}
     */
    async function injectTestCase(currentTarget) {
        deleteAllPage();
        let testCaseArray = await getJsonObjectArrayFromCache();
        let pageDataArray = [];
        testCaseArray.forEach(thisTestCase => {
            if (thisTestCase['testCaseName'] === currentTarget.attr('case-name')) {
                pageDataArray = thisTestCase['pageDatas'];
                testCaseName = thisTestCase['testCaseName'];
            }
        });
        console.time('inject ajax json time');
        await analyzeJsonArray(pageDataArray);
        console.timeEnd('inject ajax json time');
        displayPage(1);
        displayTableSpan(false);
        return new Promise(resolve => resolve(true));
    }

    /**
     * 將取得的 json物件放入 html session緩存
     * @returns {Promise}
     */
    async function cacheJsonObjectData() {
        return new Promise(async (resolve) => {
            let data;
            try {
                data = await getJsonObjectArray();
            } catch (e) {
                Logger.error(e.message);
            }
            if (Object.prototype.toString.call(data) === '[object Array]') {
                sessionStorage.setItem(PROJECT_NAME + 'JsonArrayData', JSON.stringify(data));
                resolve(true);
            } else {
                Logger.error('get cache data fail');
            }
        });
    }

    /**
     * 從緩存中取得json物件,若緩存為空則呼叫ajax getJsonObjectArray()
     * @returns {Promise.<*>}
     */
    async function getJsonObjectArrayFromCache() {
        let data;
        console.time('take data time');
        if (sessionStorage.getItem(PROJECT_NAME + 'JsonArrayData') !== null) {
            data = JSON.parse(sessionStorage.getItem(PROJECT_NAME + 'JsonArrayData'));
            Logger.debug('json data is get from cache')
        } else {
            try {
                data = await getJsonObjectArray();
            } catch (e) {
                Logger.error(e);
            }
        }
        console.timeEnd('take data time');
        return data;
    }

    /**
     * 在頁面在入時就將json物件放入緩存
     */
    (async function execCache() {
        await cacheJsonObjectData();
    }());

    /**
     * 檢驗test case資料是否正確
     * @returns {boolean}
     */
    function checkTestCaseData() {
        testCaseDetail();
        const TRIM_PAGE_URL = EteArrayUtil.trim(pageUrl);
        let isOk =
            !(testCaseName === '' || hostUrl === '' || PROJECT_NAME === '' || TRIM_PAGE_URL.length < pageCount);
        if (!isOk) {
            popupTestCaseInformation();
        }
        return isOk;
    }

    /**
     * 輸出test case的細節
     */
    function testCaseDetail() {
        Logger.debug(testCaseName);
        Logger.debug(PROJECT_NAME);
        Logger.debug(pageUrl);
    }

    /**
     * 不同作業系統綁定不同快捷鍵
     */
    const KEY_MAP = (function () {
        return navigator.platform.includes('Mac') ? {
            save: ['ctrlKey', 'shiftKey', 83],
            edit: ['ctrlKey', 'shiftKey', 65],
            plusRow: ['ctrlKey', 'shiftKey', 90],
            plusPageInTail: ['ctrlKey', 'altKey', 90],
            plusPageAfterCurrentPage: ['shiftKey', 'altKey', 90],
            minusRow: ['ctrlKey', 'shiftKey', 88],
            minusPageInTail: ['ctrlKey', 'altKey', 88],
            minusCurrentPage: ['shiftKey', 'altKey', 88],
            pageLeft: [37],
            pageRight: [39]
        } : {
            save: ['ctrlKey', 'shiftKey', 83],
            edit: ['ctrlKey', 'shiftKey', 65],
            plusRow: ['ctrlKey', 'shiftKey', 90],
            plusPageInTail: ['ctrlKey', 'altKey', 90],
            plusPageAfterCurrentPage: ['shiftKey', 'altKey', 90],
            minusRow: ['ctrlKey', 'shiftKey', 88],
            minusPageInTail: ['ctrlKey', 'altKey', 88],
            minusCurrentPage: ['shiftKey', 'altKey', 88],
            pageLeft: ['ctrlKey', 37],
            pageRight: ['ctrlKey', 39]
        };
    }());

    /**
     *每個綁定的快捷鍵所對應的方法
     */
    const KEY_FUNCTION = {
        save: () => displayTableSpan(false),
        edit: () => displayTableSpan(true),
        plusRow: () => plusRow(),
        plusPageInTail: () => plusPage(),
        plusPageAfterCurrentPage: () => plusPageAfterCurrentPage(),
        minusRow: () => minusRow(),
        minusPageInTail: () => minusPage(),
        minusCurrentPage: () => minusCurrentPage(),
        pageLeft: () => $('.my-pagination-link--wide.first').trigger('click'),
        pageRight: () => $('.my-pagination-link--wide.last').trigger('click'),
    };

    ShortKey.init(KEY_MAP, KEY_FUNCTION);

    //=======================頁面事件開始==========================
    /**
     * 新增一個row或page
     */
    $(document).on('click', '.plus', (e) => e.ctrlKey ? plusPage() : e.shiftKey ? plusPageAfterCurrentPage() : plusRow());

    /**
     * 刪除一個row或page
     */
    $(document).on('click', '.minus', (e) => e.ctrlKey ? minusPage() : e.shiftKey ? minusCurrentPage() : minusRow());

    /**
     * 將table中的input隱藏,p顯示
     */
    $(document).on('click', '.edit', () => displayTableSpan(true));

    /**
     * 開始測試或保存test case,保存成功時會刷新cache
     * @param mappingType post=>保存後測試 put=>只保存不測試
     * @returns {Promise.<*>}
     */
    async function startTestCase(mappingType = 'PUT') {
        let sendResult;
        try {
            if (mappingType === 'GET') {
                sendResult = await sendTestCaseNameAndHostUrl();
            } else {
                sendResult = await sendJsonObjectArray(mappingType);
            }
        } catch (e) {
            Logger.error(e.message);
        }
        if (sendResult) {
            displayTableSpan(false);
            sessionStorage.removeItem('jsonArrayData');
            try {
                const CACHE_RESULT = await cacheJsonObjectData();
                if (CACHE_RESULT) {
                    Logger.debug('cache is refresh');
                }
            } catch (e) {
                Logger.error(e);
            }
        }
        return new Promise(resolve => resolve(true));
    }

    /**
     * 先確認資料完整性,若沒問題就會開始
     */
    $(document).on('click', '#start-btn', async () => {
        if (!checkTestCaseData()) return false;
        let result = await startTestCase('GET');
        if (result) {
            alert('your test is success');
        }
    });

    /**
     * 先確認資料完整性,若沒問題則送後端保存至DB
     */
    $(document).on('click', '.save', async () => {
        if (!checkTestCaseData()) return false;
        let promise = await startTestCase('PUT');
        if (promise) {
            alert('your save is ok');
        }
    });

    /**
     * test case pop視窗的save按鈕
     */
    $(document).on('click', '#pop-save', () => {
        testCaseName = $('#pop-test-case-name').val();
        hostUrl = $('#pop-test-case-host-url').val();
        pageUrl = [];
        $('.pop-url').each(function () {
            const $THIS_VAL = $(this).val();
            if (!!$THIS_VAL && $THIS_VAL !== '') {
                pageUrl.push($THIS_VAL);
            }
        });
        $('.close').trigger('click');
    });

    /**
     * 點擊頁碼旁邊的'<',則向前跳一頁,若目前為第一頁,則跳至最後一頁
     */
    $(document).on('click', '.my-pagination-link--wide.first', () => {
        $('.page_btn').eq((nowDisplayPage - 1 <= 0) ? pageCount - 1 : nowDisplayPage - 2).trigger('click');
    });

    /**
     * 點擊頁碼旁邊的'>',則向後跳一頁,若目前為最後一頁,則跳至第一頁
     */
    $(document).on('click', '.my-pagination-link--wide.last', () => {
        $('.page_btn').eq((nowDisplayPage === pageCount) ? 0 : nowDisplayPage).trigger('click');
    });

    /**
     * 彈出test case選項視窗
     */
    $(document).on('click', '#load_test_case_data', async () => {
        const DATA = await getJsonObjectArrayFromCache();
        if (!DATA) return;
        let testCaseNameArray = [];
        DATA.forEach(testCase => {
            testCaseNameArray.push(testCase['testCaseName']);
        });
        popupChoseTestCase(testCaseNameArray);
    });

    /**
     * 載入被選擇的test case
     */
    $(document).on('click', '#load-test-case', async () => {
        let $popFocusNow = $('.popFocusNow');
        let isInject;
        if ($popFocusNow.length === 0) return false;
        else isInject = await injectTestCase($popFocusNow);
        if (isInject) {
            Logger.debug('data inject successful');
            $('.close').trigger('click');
        }
    });

    /**
     * 編輯test case基本資料
     */
    $(document).on('click', '#modify_test_case', async () => popupTestCaseInformation());

    //從ajax 取得 json data object  array 然後塞進test case table中
    $(document).on({
        click: async (e) => {
            $('.modal-body').find('div').each((index, target) => $(target).removeClass('popFocusNow'));
            $(e.currentTarget).addClass('popFocusNow');
        }, dblclick: async (e) => {
            let success = await injectTestCase($(e.currentTarget));
            if (success) {
                $('.close').trigger('click');
            }
        }
    }, '.take_json_data');

    // 產生 test case 的json array data
    $(document).on('click', '#generate_json_data', () => Logger.debug(JSON.stringify(generateJsonTestCase())));

    $(document).on('click', '#new_page', () => newPage(true));

    $(document).on('click', '.page_btn', (e) => {
        $('.page_btn').removeClass('page-active');
        displayPage(~~$(e.currentTarget).attr('page'));
    });

    /**
     * 當input的資料變更時,他隔壁的span也會跟著變更
     */
    $(document).on({
        change: (e) => {
            let $this = $(e.currentTarget);
            $this.parent().parent().find('span').eq(0).text($this.val());
        }
    }, 'input:not(.pop-inp), select:not(.pop-sel)');

    /**
     * table列被點擊時產生聚焦效果,並添加class focusNow
     */
    $(document).on({
        click: (e) => {
            let $this = $(e.currentTarget);
            clearPageFocusRow();
            if (!$this.hasClass('not_focus')) {
                $this.toggleClass('focusNow');
            }
        }
    }, 'tr');

    /**
     * 如果在table外點擊,則列元素聚焦效果消除
     */
    $(document).on({
        click: (e) => {
            if ($dataTable[nowDisplayPage - 1] && $dataTable[nowDisplayPage - 1].has(e.target).length === 0) {
                clearPageFocusRow();
            }
        }
    }, 'html');
    //=======================頁面事件結束==========================
})($);