let monitorsList = $("#monitor-list")
let pagination = $("#pagination")
let allCheckBox = $("input[name=all-check-box]")
let optionButton = $("#option-button")
let filterList = $("#filter-list")
let monitorReviewBtn = $("#btn-monitor-review")
let loadingReview = $("#loading-review")
let addMonitorForm = $("#form-monitor-add")
let addFilterBtn = $("#btn-add-filter")
let orderChangeBtn = $("#order-change")
let filterBadge = $("span.badge")

let currentPage = 1
let pageNums = 0
let monitorList = []

class TableData {
    constructor() {
        this.pageNums = 1
        this.monitorList = [{
            id: 0,
            name: "",
            create_date: "",
            helmet_detect: true,
        }]
        this.checkedMonitors = []
    }

    changePageNums(pageNums) {
        this.pageNums = pageNums
        this.clearChecked()
        drawPagination()
    }

    setMonitors(monitorList) {
        this.monitorList = monitorList
        this.clearChecked()
        drawTable()
    }

    getMonitorId(index) {
        return this.monitorList[index].id
    }

    check(index) {
        if (this.checkedMonitors.length === 0) {
            optionButton.removeClass("disabled")
        }
        this.checkedMonitors.push(this.monitorList[index].id)
        if (this.monitorList.length === this.checkedMonitors.length) {
            // 设置全选状态
            allCheckBox.prop("checked", true)
        }
    }

    uncheck(index) {
        if (this.monitorList.length === this.checkedMonitors.length) {
            // 取消全选状态
            allCheckBox.prop("checked", false)
        }
        this.checkedMonitors.splice(this.checkedMonitors.indexOf(this.monitorList[index].id), 1)

        if (this.checkedMonitors.length === 0) {
            optionButton.addClass("disabled")
        }
    }

    clearChecked() {
        // 取消全选
        this.checkedMonitors = []
        allCheckBox.prop("checked", false)
        monitorsList.find("input[name=chk]").each(function () {
            this.checked = false
        })
        optionButton.addClass("disabled")
    }

    allChecked() {
        // 全选
        let that = this
        monitorsList.find("input[name=chk]").each(function (i, item) {
            if (!item.checked) {
                that.checkedMonitors.push(that.monitorList[i].id)
                item.checked = true
            }
        })
        optionButton.removeClass("disabled")
    }
}

class QueryParams {
    constructor(queryURL) {
        this.queryURL = queryURL
        this.currentPage = 1
        this.pageSize = 10
        this.orderKey = "id"
        this.orderPref = "-"
        this.filter = []
    }

    changeOrderKey(key) {
        this.orderKey = key
        this.currentPage = 1;
        refreshTable()
    }

    changeOrderPref() {
        if (this.orderPref === "-") {
            this.orderPref = ""
            orderChangeBtn.html("<i class='ti-bar-chart'></i>")
        } else {
            this.orderPref = "-"
            orderChangeBtn.html("<i class='ti-bar-chart-alt'></i>")
        }
        this.currentPage = 1;
        refreshTable()
    }

    changeCurrentPage(newPage) {
        this.currentPage = newPage
        refreshTable()
    }
}

// 常量
let tableData = new TableData()
let queryParams = new QueryParams(monitorQueryURL)


// 重新获取表格数据
function refreshTable() {
    $.ajax({
        method: "GET",
        url: queryParams.queryURL,
        traditional: true,
        data: {
            currentPage: queryParams.currentPage,
            pageSize: queryParams.pageSize,
            order: queryParams.orderPref + queryParams.orderKey,
            filter: JSON.stringify(queryParams.filter.filter(f => {
                return f["value"] !== ""
            })),
        },
        success: function (data) {
            queryParams.currentPage = data["currentPage"]
            tableData.setMonitors(data["monitorList"])
            tableData.changePageNums(data["pageNums"])
        },
        error: function (e) {
            alert(e)
        }
    })
}

// 绘制表格
function drawTable() {
    let data = tableData.monitorList
    monitorsList.html("")
    for (let i = 0; i < data.length; i++) {
        monitorsList.append(
            "<tr>" +
            "<th class='custom-control custom-checkbox' scope='row'>" +
            "<label class='monitor-checkbox'>" +
            "<input type='checkbox' name='chk'> " + "<span>" + data[i].id + "</span>" +
            "</label>" +
            "</th>" +
            "<td class='clickable table-row-clickable'>" + data[i].name + "</td>" +
            "<td class='clickable table-row-clickable'>" + data[i].create_date + "</td>" +
            "<td class='clickable table-row-clickable'>" + data[i].source + "</td>" +
            "<td class='text-center'>" +
            "<label class='form-check-label form-switch helmet-detect-switch'>" +
            "<input class='form-check-input' type='checkbox' name='det' role='switch' " +
            (data[i].helmet_detect ? "checked" : "") + ">" +
            "</label>" +
            "</td>" +
            "<td>" +
            "<ul class='d-flex justify-content-center'>" +
            "<li class='me-3'><i class='clickable table-row-clickable fa fa-edit text-secondary'></i></li>" +
            "<li><i class='ti-trash text-danger'></i></li>" +
            "</ul>" +
            "</td>" +
            " </tr>"
        )
    }
}

function getEffectiveFilterNum() {
    let count = 0
    for (let i = 0; i < queryParams.filter.length; i++) {
        if (queryParams.filter[i].value !== "") {
            count++
        }
    }
    return count
}

// 获取分页栏的html
function getPageItems() {
    let curPage = queryParams.currentPage
    let pageNums = tableData.pageNums
    let s, e
    if (pageNums <= 7 || curPage <= 4) {
        s = 1
        e = pageNums
    } else if (curPage + 3 >= pageNums) {
        s = pageNums - 6
        e = pageNums
    } else {
        s = curPage - 3
        e = curPage + 3
    }

    let pageItems =
        "<ul class='pagination justify-content-center'>"
    // 前一页
    pageItems +=
        "<li class='page-item pre-page " + (curPage === 1 ? "disabled" : "") + "'>" +
        "<span class='page-link rounded'>前一页</span>" +
        "</li>"
    // 页数
    for (let i = s; i <= e; i++) {
        pageItems +=
            "<li class='page-item page-num " + (curPage === i ? "active" : "") + "'>" +
            "<span class='page-link rounded'>" + i + "</span>" +
            "</li>"
    }
    // 下一页
    pageItems +=
        "<li class='page-item next-page " + (curPage === pageNums ? "disabled" : "") + "'>" +
        "<span class='page-link rounded'>后一页</span>" +
        "</li>"
    // 页面快捷跳转
    pageItems +=
        "<li class='page-num-input-content'>" +
        "<div class='input-group h-100 align-items-center'>" +
        "<div>共 " + pageNums + " 页，跳至</div>" +
        "<input id='page-num-input' class='form-control rounded center-content h-75'>" +
        "<div>页</div>" +
        "</div>" +
        "</li>"
    pageItems +=
        "</ul>"
    return pageItems
}

// 绘制分页栏
function drawPagination() {
    // 绘制分页栏
    pagination.html("")
    if (tableData.pageNums <= 1) {
        return null
    }
    pagination.html(
        "<nav aria-label='...'>" +
        getPageItems() +
        "</nav>"
    )
}

// 判断class中是否包含disabled
function isDisabled(node) {
    return node.attr("class").split(" ").indexOf("disabled") >= 0
}

// 修改安全帽检测状态
function changeDetect(pkList, detect) {
    $.ajax({
        method: "POST",
        url: monitorDetectChangeURL,
        traditional: true,
        data: {
            pk_list: JSON.stringify(pkList),
            detect: detect,
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            if (data["code"] === 403) {
                alert(data["msg"])
                console.log(data)
            } else if (data["code"] === 200) {
                monitorsList.find("input[name=det]").each(function (i, item) {
                    if (tableData.checkedMonitors.indexOf(tableData.monitorList[i].id) >= 0 &&
                        item.checked !== detect) {
                        item.checked = detect
                    }
                })
                console.log(data["msg"])
            }
        },
        error: function (e) {

        }
    })
}

function filterHTML(selectHTML) {
    return "<div class='filter-item row align-items-start'>" +
        "<div class='col-3 text-end fs-14'>" + selectHTML + "</div>" +

        "<div class='col-2'>" +
        "<select class='col-select form-select form-select-sm'>" +
        "<option value='id' selected>ID</option>" +
        "<option value='name'>监控名</option>" +
        "<option value='create_date'>创建日期</option>" +
        "<option value='source'>监控源</option>" +
        "<option value='detect'>安全帽检测</option>" +
        "</select>" +
        "</div>" +

        "<div class='col-2'>" +
        "<select class='filter-select form-select form-select-sm fs-14'>" +
        "<option value='=' selected>=</option>" +
        "<option value='≠'>≠</option>" +
        "<option value='>'>></option>" +
        "<option value='<'><</option>" +
        "<option value='≥'>≥</option>" +
        "<option value='≤'>≤</option>" +
        "</select>" +
        "</div>" +

        "<div class='col-5 navbar'>" +
        "<input class='value-input form-control form-control-sm fs-14' type='number' min='0'>" +
        "<button class='remove-filter btn btn-sm btn-primary justify-content-end'>" +
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' " +
        "class='bi bi-trash3-fill' viewBox='0 0 16 16'>" +
        "<path d='M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z'>" +
        "</path>" +
        "</svg>" +
        "</button>" +
        "</div>" +

        "</div>"
}

// 初始
$(() => {
    refreshTable();
})

// 监听
monitorsList.on("click", ".table-row-clickable", function () {
    let index = $(this).parent().index()
    window.location.href = monitorInfoURL.replace("0", tableData.getMonitorId(index))
})

monitorsList.on("click", ".monitor-checkbox", function () {
    // 每行的checkbox
    let index = $(this).parent().parent().index()
    if ($(this).children("input").is(":checked")) {
        tableData.check(index)
    } else {
        tableData.uncheck(index)
    }
})

monitorsList.on("click", ".helmet-detect-switch", function () {
    // 安全帽检测开关
    let id = tableData.getMonitorId($(this).parent().parent().index())
    let detect = $(this).children("input").is(":checked")
    changeDetect([id], detect)
})

monitorsList.on("click", ".connection-test", function () {
    // 每行的连接测试按钮
})

pagination.on("click", ".pre-page", function () {
    // 上一页
    if (!isDisabled($(this))) {
        queryParams.changeCurrentPage(queryParams.currentPage - 1)
    }
})

pagination.on("click", ".page-num", function () {
    // 页面跳转按钮
    queryParams.changeCurrentPage($(this).children("span").html())
})

pagination.on("click", ".next-page", function () {
    // 下一页
    if (!isDisabled($(this))) {
        queryParams.changeCurrentPage(queryParams.currentPage + 1)
    }
})

pagination.on("keyup", "#page-num-input", function () {
    let that = $(this)[0]
    that.value = that.value.replace(/\D/, "")
})

pagination.on("keydown", "#page-num-input", function (e) {
    if (e.keyCode === 13) {
        // 输入回车
        queryParams.changeCurrentPage($(this)[0].value)
    }
})

allCheckBox.bind("click", function () {
    if (this.checked) {
        tableData.allChecked()
    } else {
        tableData.clearChecked()
    }
})

$("#open-checked-monitor-detect").click(function () {
    if (!isDisabled($(this))) {
        changeDetect(tableData.checkedMonitors, true)
    }
})

$("#close-checked-monitor-detect").click(function () {
    if (!isDisabled($(this))) {
        changeDetect(tableData.checkedMonitors, false)
    }
})

$("#test-checked-monitor-source").click(function () {
    monitorsList.find(".connection-test").each(function () {
        // TODO: 显示测试连接结果
        this.click()
    })
})

$("#delete-checked-monitor").click(function () {
    $.ajax({
        method: "POST",
        url: monitorDeleteURL,
        data: {
            pk_list: JSON.stringify(tableData.checkedMonitors),
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            console.log(data)
            refreshTable()
        },
        error: function (e) {
            console.log(e)
        }
    })
})

$("#btn-refresh").click(function () {
    refreshTable()
})

$("#filter-content").click(function (e) {
    e.stopPropagation();
})

addFilterBtn.click(function () {
    if (queryParams.filter.length === 0) {
        filterList.html(filterHTML(
            "<div class='mt-1 fs-14'>条件</div>"
        ))
        $(this).children("span").html("添加其它筛选器")
    } else {
        filterList.append(filterHTML(
            "<select class='operator-select form-select form-select-sm fs-14'>" +
            "<option value='and' selected>且(and)</option>" +
            "<option value='or'>或(or)</option>" +
            "</select>"
        ))
    }
    queryParams.filter.push({
        operator: "and",
        col: "id",
        filter: "=",
        value: "",
    })
})

addMonitorForm.submit(function (event) {
    event.preventDefault()
    let that = $(this)
    $.ajax({
        method: "POST",
        url: monitorInsertURL,
        data: {
            name: that.find("input[name=name]").val(),
            source: that.find("textarea[name=source]").val(),
            detect: that.find("input[name=detect]")[0].checked,
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            alert(data["msg"])
            if (data["code"] === 403) {
            } else if (data["code"] === 200) {
                that[0].reset()
                refreshTable()
            }
        },
        error: function (e) {
            console.log(e)
        }
    })
})

$("#monitor-name").on("keyup", function () {
    let that = $(this)[0]
    that.value = that.value.replace(/ /, "")
})

$("#monitor-source").on("keyup", function () {
    let that = $(this)[0]
    that.value = that.value.replace(/ /, "")
    if (that.value.length > 0) {
        monitorReviewBtn.removeClass("disabled")
    } else {
        monitorReviewBtn.addClass("disabled")
    }
})

monitorReviewBtn.click(function () {
    if (isDisabled($(this))) {
        return false
    }
    let that = $(this)
    loadingReview.removeClass("visually-hidden")
    that.html("连接中...")
    $.ajax({
        method: "GET",
        url: newSourceTestURL,
        data: {
            source: addMonitorForm.find("textarea[name=source]").val()
        },
        success: function (data) {
            let src
            if (data["connected"]) {
                src = reviewSourceURL + "?token=" + data["token"]
            } else {
                // 提示源无效
                src = "/static/img/404.jpeg"
            }
            $("#source-review").html("<img class='review-img' src='" + src + "' alt=''/>")
            loadingReview.addClass("visually-hidden")
            that.html("监控预览")
        },
        error: function (e) {
            alert(e.message)
            loadingReview.addClass("visually-hidden")
            that.html("监控预览")
        }
    })
    return false
})

filterList.on("change", ".operator-select", function () {
    let parent = $(this).parent().parent()
    let i = parent.index()
    queryParams.filter[i].operator = $(this).val()
    if (parent.find(".value-input").value !== "") {
        refreshTable()
    }
})

filterList.on("change", ".col-select", function () {
    let parentNode = $(this).parent().parent()
    let filterNode = parentNode.find(".filter-select")
    let valueNode = parentNode.find(".value-input")
    let i = parentNode.index()
    let val = $(this).val()
    queryParams.filter[i].col = val
    queryParams.filter[i].value = ""
    valueNode[0].value = ""
    if (val === "name" || val === "source") {
        queryParams.filter[i].filter = "contain"
        filterNode.html(
            "<option value='contain' selected>包含</option>" +
            "<option value='not_contain'>不包含</option>" +
            "<option value='pattern'>正则</option>" +
            "<option value='equal'>等于</option>" +
            "<option value='not_equal'>不等于</option>"
        )
        filterNode.prop("disabled", false)
        valueNode.prop("type", "text")
    } else if (val === "id") {
        queryParams.filter[i].filter = "="
        filterNode.html(
            "<option value='=' selected>=</option>" +
            "<option value='≠'>≠</option>" +
            "<option value='>'>></option>" +
            "<option value='<'><</option>" +
            "<option value='≥'>≥</option>" +
            "<option value='≤'>≤</option>"
        )
        filterNode.prop("disabled", false)
        valueNode.prop("type", "number")
    } else if (val === "create_date") {
        queryParams.filter[i].filter = "="
        filterNode.html(
            "<option value='=' selected>=</option>" +
            "<option value='≠'>≠</option>" +
            "<option value='>'>></option>" +
            "<option value='<'><</option>" +
            "<option value='≥'>≥</option>" +
            "<option value='≤'>≤</option>"
        )
        filterNode.prop("disabled", false)
        valueNode.prop("type", "datetime-local")
    } else if (val === "detect") {
        queryParams.filter[i].filter = "="
        filterNode.html("<option value='=' selected>=</option>")
        filterNode.prop("disabled", true)
    }
})

filterList.on("change", ".filter-select", function () {
    let i = $(this).parent().parent().index()
    queryParams.filter[i].filter = $(this).val()
})

filterList.on("change keydown", ".value-input", function () {
    let i = $(this).parent().parent().index()
    let that = $(this)[0]
    queryParams.filter[i].value = that.value
    if (that.value !== "") {
        refreshTable()
    }
    let filterNum = getEffectiveFilterNum()
    if (filterNum === 0) {
        filterBadge.addClass("d-none")
    } else {
        filterBadge.removeClass("d-none")
        filterBadge.html(filterNum)
    }
})

filterList.on("click", ".remove-filter", function () {
    let filterItem = $(this).parent().parent()
    filterItem.remove()
    queryParams.filter.splice(filterItem.index(), 1)
    if (queryParams.filter.length === 0) {
        addFilterBtn.children("span").html("添加筛选器")
        filterList.html("<span class='no-filter-text mt-2'>未启用筛选</span>")
    }
    if (getEffectiveFilterNum() === 0) {
        filterBadge.addClass("d-none")
    }
    if (filterItem.find(".value-input").value !== "") {
        refreshTable()
    }
})

$("#order-select").change(function () {
    queryParams.changeOrderKey($(this)[0].value)
})

orderChangeBtn.click(function () {
    queryParams.changeOrderPref()
})