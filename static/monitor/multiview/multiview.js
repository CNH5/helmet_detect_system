// 布局修改
let rowInput = $("input[name=row]")
let colInput = $("input[name=col]")
let editRowColBtn = $(".edit-btn")
let editSaveBtn = $(".edit-save-btn")
let editCancelBtn = $(".edit-cancel-btn")

// 分页
let pageSizeInput = $("input[name=page-size]")
let pagePreviousBtn = $(".page-previous")
let pageNumArea = $(".page-num-area")
let pageNextBtn = $(".page-next")
let pageNumTipArea = $(".page-num-tip-area")

// 监控筛选
let monitorNameInput = $("input[name=monitor-name]")
let monitorSourceInput = $("input[name=monitor-source]")
let monitorIdStartInput = $("input[name=id-range-start]")
let monitorIdEndInput = $("input[name=id-range-end]")
let monitorDateStartInput = $("input[name=create-date-start]")
let monitorDateEndInput = $("input[name=create-date-end]")
let orderSelect = $("select[name=order-select]")

// 其它
let reviewContainer = $(".review-grid")
let monitorSelectModal = $("#monitor-select-modal")
let monitorListArea = $(".monitor-list-area")
let confirmMonitorBtn = $("#confirm-monitor-btn")
let selectedMonitorInfo = $(".selected-monitor-info")

const queryDataDict = [{
    "input": monitorNameInput,
    "col": "name",
    "operation": "regex",
}, {
    "input": monitorSourceInput,
    "col": "source",
    "operation": "regex",
}, {
    "input": monitorIdStartInput,
    "col": "id",
    "operation": "gte",
}, {
    "input": monitorIdEndInput,
    "col": "id",
    "operation": "lte",
}, {
    "input": monitorDateStartInput,
    "col": "create_date",
    "operation": "gte",
}, {
    "input": monitorDateEndInput,
    "col": "create_date",
    "operation": "lte",
}]

// monitor query param
let currentPage = 1
let pageNums = 5

let monitorList = []

let selectedMonitor = null
let changeIndex


function setPlayerHTML() {
    return '<div class="source-player w-100 h-100 align-middle d-flex">' +
        '<img class="source-img m-auto" src="' + monitorReviewURl.replace("0", selectedMonitor["id"]) + '" alt="#">' +
        '<div class="player-bar info">' +
        '<div class="source-name ms-3 my-auto">' +
        '<i class="fa fa-video-camera"></i>' +
        '<span>' + selectedMonitor["name"] + '</span>' +
        '</div>' +
        '<div class="ms-auto my-auto me-3">' +
        '<a href="javascript:" class="player-btn info text-white" title="详情">' +
        '<i class="fa fa-info-circle"></i>' +
        '</a>' +
        '</div>' +
        '</div>' +
        '<div class="player-bar control">' +
        '<div class="ms-3 my-auto">' +
        '<a href="javascript:" class="player-btn refresh text-white" title="刷新">' +
        '<i class="fa fa-refresh"></i>' +
        '</a>' +
        '<a href="javascript:" class="player-btn change text-white ms-3" title="切换" ' +
        'data-bs-toggle="modal" data-bs-target="#monitor-select-modal">' +
        '<i class="fa fa-exchange"></i>' +
        '</a>' +
        '<a href="javascript:" class="player-btn remove text-white ms-3" title="移除预览">' +
        '<i class="fa fa-minus-circle"></i>' +
        '</a>' +
        '</div>' +
        '<div class="ms-auto my-auto me-3">' +
        '<a href="javascript:" class="player-btn alt text-white" title="全屏">' +
        '<i class="fa fa-arrows-alt"></i>' +
        '</a>' +
        '</div>' +
        '</div>' +
        '</div>'
}

function setSourceHTML() {
    return '<a href="javascript:" class="add-source d-flex w-100 h-100 text-white" ' +
        'data-bs-toggle="modal" data-bs-target="#monitor-select-modal">' +
        '<div class="m-auto">' +
        '<h3 class="ti-plus"></h3>' +
        '<h5>添加监控</h5>' +
        '</div>' +
        '</a>'
}

function hasFilter() {
    for (let i = 0; i < queryDataDict.length; i++) {
        if (queryDataDict[i]["input"].val() !== "") {
            return true
        }
    }
    return false
}

function getQueryParams() {
    let filters = []
    for (let i = 0; i < queryDataDict.length; i++) {
        let q = queryDataDict[i]
        let value = q["input"].val()
        if (value !== "") {
            filters.push({
                "operator": "and",
                "col": q["col"],
                "not": false,
                "operation": q["operation"],
                "value": value,
            })
        }
    }
    return {
        "currentPage": pageSizeInput.val(),
        "ascendingOrder": orderSelect.val() === "true",
        "filter": JSON.stringify(filters)
    }
}

function setMonitorTableHTML() {
    monitorListArea.html("")
    if (monitorList.length === 0) {
        $(".pagination-area").addClass("visually-hidden")
        if (hasFilter()) {
            $(".filter-none-tips").removeClass("visually-hidden")
            $(".data-none-tips").addClass("visually-hidden")
        } else {
            $(".data-none-tips").removeClass("visually-hidden")
            $(".filter-none-tips").addClass("visually-hidden")
        }
    } else {
        $(".data-none-tips").addClass("visually-hidden")
        $(".filter-none-tips").addClass("visually-hidden")
        $(".pagination-area").removeClass("visually-hidden")
        // 显示表中数据
        for (let i = 0; i < monitorList.length; i++) {
            let monitor = monitorList[i]
            monitorListArea.append(
                '<tr class="text-center align-middle monitor-data">' +
                '<td>' + monitor["id"] + '</td>' +
                '<td>' + monitor["name"] + '</td>' +
                '<td>' + monitor["create_date"] + '</td>' +
                '<td>' + monitor["source"] + '</td>' +
                '<td>' +
                '<label class="form-check-label form-switch">' +
                '<input class="form-check-input" type="checkbox" role="switch" ' +
                (monitor["helmet_detect"] ? "checked" : "") + ' disabled>' +
                '</label>' +
                '</td>' +
                '</tr>'
            )
        }
        // 绘制分页
        if (pageNums === 1) {
            $(".multi-page").addClass("visually-hidden")
            pageNumTipArea.addClass("ms-auto")
            pageNumTipArea.html('共 1 页')
        } else {
            $(".multi-page").removeClass("visually-hidde")
            pageNumTipArea.removeClass("ms-auto")
            pageNumTipArea.html(
                '共 ' + pageNums + ' 页，跳至' +
                '<label class="mx-1 mb-0">' +
                "<input class='pagination-input rounded form-control form-control-sm' type='text' name='num'>" +
                '</label>' +
                '页'
            )
            let s, e
            if (pageNums <= 7 || currentPage <= 4) {
                s = 1
                e = pageNums
            } else if (currentPage + 3 >= pageNums) {
                s = pageNums - 6
                e = pageNums
            } else {
                s = currentPage - 3
                e = currentPage + 3
            }
            pageNumArea.html("")
            for (let i = s; i < e; i++) {
                pageNumArea.append(
                    "<button class='page-num btn btn-xs btn" + (i === currentPage ? "" : "-outline") + "-primary ms-1 border'>" +
                    i +
                    "</button>"
                )
            }

            if (currentPage === 1) {
                pagePreviousBtn.addClass("disabled")
            } else {
                pagePreviousBtn.removeClass("disabled")
            }

            if (currentPage === pageNums) {
                pageNextBtn.addClass("disabled")
            } else {
                pageNextBtn.removeClass("disabled")
            }
        }
    }
}

function queryMonitor() {
    monitorListArea.addClass("visible-hidden")
    $.ajax({
        method: "GET",
        traditional: true,
        url: monitorQueryURL,
        data: getQueryParams(),
        success: function (data) {
            currentPage = data["currentPage"]
            pageNums = data["pageNums"]
            monitorList = data["monitorList"]
            setMonitorTableHTML()
        },
        error: function (e) {
            console.log(e)
            monitorListArea.removeClass("visible-hidden")
        }
    })
}

function clearCheckedMonitor() {
    selectedMonitor = null
    selectedMonitorInfo.html("无")
}

function getReviewMonitorIdData() {
    let idList = []
    let row = parseInt($.cookie("multiviewRows"))
    let col = parseInt($.cookie("multiviewCols"))
    let n = row * col
    for (let i = 0; i < n; i++) {
        if (i < reviewMonitor.length) {
            let m = reviewMonitor[i]
            idList.push(m ? m["id"] : 0)
        } else {
            idList.push(0)
        }
    }
    return idList.join("%")
}

function resetCookie() {
    $.cookie("multiviewRows", 3, {expires: 10000})
    $.cookie("multiviewCols", 3, {expires: 10000})
    $.cookie("multiviewMonitors", getReviewMonitorIdData(), {expires: 10000})
}

$(() => {
    let rowNums = $.cookie("multiviewRows")
    let colNums = $.cookie("multiviewCols")
    if (!rowNums || !colNums) {
        resetCookie()
        rowNums = $.cookie("multiviewRows")
        colNums = $.cookie("multiviewCols")
    }
    rowInput.prop("value", rowNums)
    colInput.prop("value", colNums)
    reviewContainer.css("grid-template-columns", "repeat(" + colNums + ", 1fr)")
    reviewContainer.css("grid-template-rows", "repeat(" + rowNums + ", 1fr)")
})

rowInput.keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

colInput.keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

editRowColBtn.click(function () {
    editRowColBtn.addClass("d-none")
    rowInput.prop("disabled", false)
    colInput.prop("disabled", false)
    editSaveBtn.removeClass("d-none")
    editCancelBtn.removeClass("d-none")
})

editSaveBtn.click(function () {
    editSaveBtn.addClass("d-none")
    editCancelBtn.addClass("d-none")
    editRowColBtn.removeClass("d-none")
    rowInput.prop("disabled", true)
    colInput.prop("disabled", true)
    if ($.cookie("multiviewRows") !== rowInput[0].value || $.cookie("multiviewCols") !== colInput[0].value) {
        $.cookie("multiviewRows", rowInput.val(), 10000)
        $.cookie("multiviewCols", colInput.val(), 10000)
        $.cookie("multiviewMonitors", getReviewMonitorIdData(), {expires: 10000})
        customAlert("success", "布局修改成功！", "即将刷新窗口。")
        setTimeout(function () {
            location.reload()
        }, 1500)
    }
})

editCancelBtn.click(function () {
    editSaveBtn.addClass("d-none")
    editCancelBtn.addClass("d-none")
    rowInput.prop("disabled", true)
    colInput.prop("disabled", true)
    editRowColBtn.removeClass("d-none")

    rowInput.prop("value", $.cookie("multiviewRows"))
    colInput.prop("value", $.cookie("multiviewCols"))
})

reviewContainer.on("click", ".player-btn.info", function () {
    let sourceImg = $(this).parent().parent().parent().children("img.source-img")
    monitorId = sourceImg.attr("src").replace(/\D/g, "")
    window.location = monitorInfoURL.replace("0", monitorId)
})

reviewContainer.on("click", ".player-btn.refresh", function () {
    let sourceImg = $(this).parent().parent().parent().children("img.source-img")
    sourceImg.prop("src", sourceImg.attr("src") + "?" + Math.random())
})

reviewContainer.on("click", ".player-btn.alt", function () {
    // 全屏按钮
})

reviewContainer.on("click", ".player-btn.change", function () {
    changeIndex = $(this).parent().parent().parent().index()
})

reviewContainer.on("click", ".player-btn.remove", function () {
    // 移除预览
    $(this).parent().parent().parent().parent().html(setSourceHTML())
})

reviewContainer.on("mouseover", ".source-img, .player-bar", function () {
    let playerBar = $(this).parent().children(".player-bar")
    playerBar.css("transform", "translateY(0)")
    playerBar.css("visibility", "visible")
})

reviewContainer.on("mouseover", ".source-player, .player-bar", function () {
    let playerBar = $(this).children(".player-bar")
    playerBar.css("transform", "translateY(0)")
    playerBar.css("visibility", "visible")
})

reviewContainer.on("mouseout", ".source-img, .player-bar", function () {
    let infoBar = $(this).parent().children(".player-bar.info")
    infoBar.css("transform", "translateY(-100%)")
    infoBar.css("visibility", "hidden")
    let controlBar = $(this).parent().children(".player-bar.control")
    controlBar.css("transform", "translateY(100%)")
    controlBar.css("visibility", "hidden")
})

reviewContainer.on("mouseout", ".source-player, .player-bar", function () {
    let infoBar = $(this).children(".player-bar.info")
    infoBar.css("transform", "translateY(-100%)")
    infoBar.css("visibility", "hidden")
    let controlBar = $(this).children(".player-bar.control")
    controlBar.css("transform", "translateY(100%)")
    controlBar.css("visibility", "hidden")
})

monitorIdStartInput.keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

monitorIdEndInput.keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

$("#clean-filter-btn").click(function () {
    monitorNameInput.prop("value", "")
    monitorSourceInput.prop("value", "")
    monitorIdStartInput.prop("value", "")
    monitorIdEndInput.prop("value", "")
    monitorDateStartInput.prop("value", "")
    monitorDateEndInput.prop("value", "")
    queryMonitor()
})

monitorNameInput.change(function () {
    queryMonitor()
})

monitorSourceInput.change(function () {
    queryMonitor()
})

monitorIdStartInput.change(function () {
    queryMonitor()
})

monitorIdEndInput.change(function () {
    queryMonitor()
})

monitorDateStartInput.change(function () {
    queryMonitor()
})

monitorDateEndInput.change(function () {
    queryMonitor()
})

orderSelect.change(function () {
    ascendingOrder = !ascendingOrder
    queryMonitor()
})

$("#table-refresh-btn").click(function () {
    queryMonitor()
})

monitorSelectModal.bind("show.bs.modal", function () {
    if (monitorList.length === 0) {
        queryMonitor()
    }
})

monitorSelectModal.bind("hide.bs.modal", function () {
    clearCheckedMonitor()
})

confirmMonitorBtn.click(function () {
    // 确认选择监控按钮
    if (!$(this).is("disabled")) {
        reviewMonitor[changeIndex] = selectedMonitor
        $.cookie("multiviewMonitors", getReviewMonitorIdData(), {expires: 10000})
        reviewContainer.children().eq(changeIndex).html(setPlayerHTML())
        $(this).prev("button").click()
    }
})

monitorListArea.on("click", ".monitor-data", function () {
    if (!selectedMonitor) {
        confirmMonitorBtn.prop("disabled", false)
    }
    selectedMonitor = monitorList[$(this).index()]
    selectedMonitorInfo.html(
        selectedMonitor["name"] + " (ID：" + selectedMonitor["id"] + "，源：'" + selectedMonitor["source"] + "')"
    )
})

$("redirect-monitor-insert-btn").click(function () {
    window.open(monitorManageURL + "#insert-monitor")
})

pageNumTipArea.on("keyup", "input[name=num]", function () {
    this.value = this.value.replace(/\D/, "")
})

pageNumTipArea.on("keydown", "input[name=num]", function () {
    if (e.keyCode === 13) {
        // 输入回车
        currentPage = this.value
        queryMonitor()
    }
})

pageNumArea.on("click", ".page-num", function () {
    console.log($(this).html())
})

pageSizeInput.keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

pageSizeInput.keydown(function () {
    if (e.keyCode === 13) {
        // 输入回车
        queryMonitor()
    }
})

$(".add-source").click(function () {
    changeIndex = $(this).parent().index()
})