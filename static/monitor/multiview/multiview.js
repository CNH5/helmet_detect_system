// 监控筛选
let monitorNameInput = $("input[name=monitor-name]")
let monitorSourceInput = $("input[name=monitor-source]")
let monitorIdStartInput = $("input[name=id-range-start]")
let monitorIdEndInput = $("input[name=id-range-end]")
let monitorDateStartInput = $("input[name=create-date-start]")
let monitorDateEndInput = $("input[name=create-date-end]")
let monitorOrderSelect = $("select[name=order-select]")

// 其它
let reviewContainer = $(".review-grid")
let monitorSelectModal = $("#monitor-select-modal")
let monitorListArea = $(".monitor-list-area")
let confirmMonitorBtn = $("#confirm-monitor-btn")
let selectedMonitorInfo = $(".selected-monitor-info")

let layoutExchangeModal = $("#layout-exchange-modal")

let layoutTableBody = $("tbody.layout")

const monitorQueryDataDict = [{
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
let monitorCurrentPage = 1
let monitorPageSize = 6
let monitorList = []

let selectedMonitor
let changeIndex

let layoutCurrentPage = 1
let layoutPageSize = 6
let layoutList = []
let deleteLayouts
let selectedLayout


function playerWindowHTML() {
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

function noneWindowHTML() {
    return '<a href="javascript:" class="add-source d-flex w-100 h-100 text-white text-center" ' +
        'data-bs-toggle="modal" data-bs-target="#monitor-select-modal">' +
        '<div class="m-auto">' +
        '<h3 class="ti-plus"></h3>' +
        '<h5>添加监控</h5>' +
        '</div>' +
        '</a>'
}

function hasMonitorFilter() {
    for (let i = 0; i < monitorQueryDataDict.length; i++) {
        if (monitorQueryDataDict[i]["input"].val() !== "") {
            return true
        }
    }
    return false
}

function getQueryMonitorParams() {
    let filters = []
    for (let i = 0; i < monitorQueryDataDict.length; i++) {
        let q = monitorQueryDataDict[i]
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
        "currentPage": monitorCurrentPage,
        "pageSize": monitorPageSize,
        "ascendingOrder": monitorOrderSelect.val(),
        "filter": JSON.stringify(filters)
    }
}

function setMonitorTableHTML() {
    monitorListArea.html("")
    if (monitorList.length === 0) {
        $(".pagination-area").addClass("visually-hidden")
        if (hasMonitorFilter()) {
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
                '<tr class="text-center align-middle table-data">' +
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
    }
}

function queryMonitor() {
    monitorListArea.addClass("visible-hidden")
    $.ajax({
        method: "GET",
        traditional: true,
        url: monitorQueryURL,
        data: getQueryMonitorParams(),
        success: function (data) {
            monitorList = data["monitorList"]
            monitorCurrentPage = data["currentPage"]
            setMonitorTableHTML()
            // 设置分页栏
            $("#monitor-pagination").pagination({
                currentPage: monitorCurrentPage,
                pageNums: data["pageNums"],
                pageSize: monitorPageSize,
                onPageChange: function (cp, ps) {
                    monitorCurrentPage = cp
                    monitorPageSize = ps
                    queryMonitor()
                }
            })
        },
        error: function (e) {
            console.log(e)
            monitorListArea.removeClass("visible-hidden")
        }
    })
}

function updateLayoutItem(index, value) {
    $.ajax({
        method: "POST",
        url: layoutItemUpdateURL,
        data: {
            index: index,
            item: value,
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            if (data["code"] === 403) {
                customAlert("warning", "修改失败!", data["msg"])
            } else if (data["code"] === 200) {
                customAlert("success", "设置成功!", data["msg"])
            }
        },
        error: function (e) {
            console.log(e)
            customAlert("danger", "请求失败！", "服务器异常")
        }
    })
}

function queryLayout() {
    $.ajax({
        method: "GET",
        url: layoutQueryURL,
        data: {
            currentPage: layoutCurrentPage,
            pageSize: layoutPageSize,
            name: layoutExchangeModal.find("input[name=layout-name]").val(),
            cols: layoutExchangeModal.find("input[name=layout-cols]").val(),
            rows: layoutExchangeModal.find("input[name=layout-rows]").val()
        },
        success: function (data) {
            layoutList = data["layoutList"]
            layoutTableBody.html("")
            for (let i = 0; i < layoutList.length; i++) {
                let layoutData = layoutList[i]
                layoutTableBody.append(
                    '<tr class="text-center align-middle table-data">' +
                    '    <td>' +
                    '        <label class="mb-0 d-flex">' +
                    '            <input type="checkbox" name="chk" class="my-auto">' +
                    '            <span class="ms-1">' + layoutData["id"] + '</span>' +
                    '        </label>' +
                    '    </td>' +
                    '    <td class="layout-select">' + layoutData["name"] + '</td>' +
                    '    <td class="layout-select">' + layoutData["rows"] + '</td>' +
                    '    <td class="layout-select">' + layoutData["cols"] + '</td>' +
                    '    <td>' +
                    '        <i class="ti-trash text-danger" data-bs-toggle="modal"' +
                    '           data-bs-target="#layout-delete-confirm-modal"></i>' +
                    '    </td>' +
                    '</tr>'
                )
            }

            $("input[name=layout-all-check]").prop("checked", false)
            $(".layout-checked-delete").prop("disabled", true)

            if (layoutList.length === 0) {
                layoutExchangeModal.find(".filter-none-tips").removeClass("visually-hidden")
            } else {
                layoutExchangeModal.find(".filter-none-tips").addClass("visually-hidden")
            }

            $(".layout-pagination").pagination({
                currentPage: monitorCurrentPage,
                pageNums: data["pageNums"],
                pageSize: monitorPageSize,
                showRange: 5,
                onPageChange: function (cp, ps) {
                    layoutCurrentPage = cp
                    layoutPageSize = ps
                    queryLayout()
                }
            })
        },
        error: function (e) {
            console.log(e)
            customAlert("danger", "请求失败!", "服务器异常")
        }
    })
}

function checkedLayoutsId() {
    let res = []
    layoutTableBody.find("input[name=chk]").each(function () {
        if ($(this).prop("checked")) {
            res.push(layoutList[$(this).parent().parent().parent().index()].id)
        }
    })
    return res
}

$(() => {
    reviewContainer.css("grid-template-columns", "repeat(" + layout.cols + ", 1fr)")
    reviewContainer.css("grid-template-rows", "repeat(" + layout.rows + ", 1fr)")
})

reviewContainer.on("click", ".player-btn.info", function () {
    let sourceImg = $(this).parent().parent().parent().children("img.source-img")
    monitorId = sourceImg.attr("src").replace(/\D/g, "")
    window.location = monitorInfoURL.replace("0", monitorId)

}).on("click", ".player-btn.refresh", function () {
    let sourceImg = $(this).parent().parent().parent().children("img.source-img")
    sourceImg.prop("src", sourceImg.attr("src") + "?" + Math.random())

}).on("click", ".player-btn.alt", function () {
    handleFullScreen($(this).parent().parent().parent()[0])

    $(this).removeClass("alt")
    $(this).addClass("exit-alt")
    $(this).prop("title", "退出全屏")

}).on("click", ".player-btn.exit-alt", function () {
    exitFullScreen()

    $(this).removeClass("exit-alt")
    $(this).addClass("alt")
    $(this).prop("title", "全屏")

}).on("click", ".player-btn.change", function () {
    changeIndex = $(this).parent().parent().parent().index()

}).on("click", ".player-btn.remove", function () {
    // 移除预览
    let index = $(this).parent().parent().parent().parent().index()
    updateLayoutItem(index, 0)
    reviewContainer.children().eq(index).html(noneWindowHTML())

}).on("mouseover", ".source-img, .player-bar", function () {
    let playerBar = $(this).parent().children(".player-bar")
    playerBar.css("transform", "translateY(0)")
    playerBar.css("visibility", "visible")

}).on("mouseover", ".source-player, .player-bar", function () {
    let playerBar = $(this).children(".player-bar")
    playerBar.css("transform", "translateY(0)")
    playerBar.css("visibility", "visible")

}).on("mouseout", ".source-img, .player-bar", function () {
    let infoBar = $(this).parent().children(".player-bar.info")
    infoBar.css("transform", "translateY(-100%)")
    infoBar.css("visibility", "hidden")
    let controlBar = $(this).parent().children(".player-bar.control")
    controlBar.css("transform", "translateY(100%)")
    controlBar.css("visibility", "hidden")

}).on("mouseout", ".source-player, .player-bar", function () {
    let infoBar = $(this).children(".player-bar.info")
    infoBar.css("transform", "translateY(-100%)")
    infoBar.css("visibility", "hidden")
    let controlBar = $(this).children(".player-bar.control")
    controlBar.css("transform", "translateY(100%)")
    controlBar.css("visibility", "hidden")

}).on("click", ".add-source", function () {
    changeIndex = $(this).parent().index()
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

monitorOrderSelect.change(function () {
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
    // 清空选中的监控设备
    selectedMonitor = null
    selectedMonitorInfo.html("无")
})

confirmMonitorBtn.click(function () {
    // 确认选择监控按钮
    if (!$(this).is("disabled")) {
        updateLayoutItem(changeIndex, selectedMonitor.id)
        reviewContainer.children().eq(changeIndex).html(playerWindowHTML())
        $(this).prev("button").click()
    }
})

monitorListArea.on("click", ".table-data", function () {
    if (!selectedMonitor) {
        confirmMonitorBtn.prop("disabled", false)
    }
    selectedMonitor = monitorList[$(this).index()]
    selectedMonitorInfo.html(
        selectedMonitor["name"] + " (ID：" + selectedMonitor["id"] + "，源：'" + selectedMonitor["source"] + "')"
    )
})

$("redirect-monitor-insert-btn").click(function () {
    window.open(monitorCreateURL)
})

$("#layout-update-modal").bind("show.bs.modal", function () {
    let layoutForm = $("form.layout-info")
    layoutForm.removeClass("was-validated")
    layoutForm.find("input[name=name]").prop("value", layout.name)
    layoutForm.find("input[name=rows]").prop("value", layout.rows)
    layoutForm.find("input[name=cols]").prop("value", layout.cols)

}).on("click", ".save-layout", function () {
    $("form.layout-info").submit()
})

$("form.layout-info").submit(function (event) {
    event.preventDefault()
    let that = $(this)
    if (!this.checkValidity()) {
        event.stopPropagation()
        that.addClass("was-validated")
    } else {
        $.post({
            url: layoutInfoUpdateURL,
            data: {
                id: layout.id,
                name: that.find("input[name=name]").val(),
                rows: that.find("input[name=rows]").val(),
                cols: that.find("input[name=cols]").val(),
                csrfmiddlewaretoken: that.find("input[name=csrfmiddlewaretoken]").val()
            },
            success: function (data) {
                if (data["code"] === 200) {
                    customAlert("success", "布局修改成功！", "")
                    setTimeout(function () {
                        location.reload()
                    }, 1500)
                } else if (data["code"] === 403) {
                    customAlert("warning", "修改失败", data["msg"])
                }
            },
            error: function (e) {
                console.log(e)
                customAlert("danger", "请求失败!", "服务器异常")
            }
        })
    }
})

$("input[name=cols] input[name=rows]").keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

layoutExchangeModal.bind("show.bs.modal", function () {
    queryLayout()

}).bind("hide.bs.modal", function () {
    selectedLayout = null
    $(this).find(".selected-layout-info").html("无")
    $(this).find(".confirm-layout").prop("disabled", true)

}).on("click", ".layout-clean-filter", function () {
    layoutExchangeModal.find("input[name=layout-name]").prop("value", "")
    layoutExchangeModal.find("input[name=layout-rows]").prop("value", "")
    layoutExchangeModal.find("input[name=layout-cols]").prop("value", "")
    queryLayout()

})

$("input[name=layout-name]").change(function () {
    queryLayout()
})

$("input[name=layout-rows]").change(function () {
    queryLayout()
}).keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

$("input[name=layout-cols]").change(function () {
    queryLayout()
}).keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

layoutTableBody.on("click", ".layout-select", function () {
    let index = $(this).parent().index()
    selectedLayout = layoutList[index]
    let modal = $("#layout-exchange-modal")
    modal.find(".confirm-layout").prop("disabled", false)
    modal.find(".selected-layout-info").html(
        selectedLayout.name + "（ID: " + selectedLayout.id + "，行数: " + selectedLayout.rows + "，列数: " + selectedLayout.rows + "）"
    )

}).on("click", ".ti-trash", function () {
    let l = layoutList[$(this).parent().parent().index()]
    deleteLayouts = [l.id]
    $("#layout-delete-confirm-modal").find(".modal-body").html("确定要删除布局 \"" + l.name + "\" 吗？")

}).on("change", "input[name=chk]", function () {
    let checkedNums = checkedLayoutsId().length

    $("input[name=layout-all-check]").prop("checked", checkedNums === layoutList.length)
    $(".layout-checked-delete").prop("disabled", checkedNums === 0)
})

$(".layout-checked-delete").click(function () {
    if (!$(this).is("disabled")) {
        deleteLayouts = checkedLayoutsId()
        $("#layout-delete-confirm-modal").find(".modal-body").html("确定要删除选中的 " + deleteLayouts.length + " 个布局吗？")
    }
})

$("input[name=layout-all-check]").change(function () {
    let checked = $(this).prop("checked")
    layoutTableBody.find("input[name=chk]").each(function () {
        $(this).prop("checked", checked)
    })
    $(".layout-checked-delete").prop("disabled", !checked)
})

$(".confirm-layout").click(function () {
    if (!$(this).is("disabled")) {
        customAlert("success", "布局切换成功！", "界面即将刷新。")
        $.cookie("layout", selectedLayout.id, {
            path: "/"
        })
        setTimeout(function () {
            location.reload()
        }, 1500)
    }
    $("#layout-exchange-modal").modal("hide")
})

$("#layout-delete-confirm-modal").bind("hide.bs.modal", function () {
    $("#layout-exchange-modal").modal("show")

}).on("click", ".confirm-delete", function () {
    $.ajax({
        method: "POST",
        url: layoutDeleteURL,
        traditional: true,
        data: {
            layouts: deleteLayouts,
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            switch (data["code"]) {
                case 200:
                    customAlert("success", "布局删除成功！", data["msg"])
                    if (deleteLayouts.indexOf(parseInt($.cookie("layout"))) >= 0) {
                        setTimeout(function () {
                            location.reload()
                        }, 1500)
                    }
                    break
                case 403:
                    customAlert("warning", "布局删除失败！", data["msg"])
                    break
                default:
            }
        },
        error: function (e) {
            console.log(e)
            customAlert("danger", "请求失败!", "服务器异常")
        }
    })
    queryLayout()
})

$("form.layout-create").submit(function (event) {
    event.preventDefault()
    let that = $(this)
    if (!this.checkValidity()) {
        event.stopPropagation()
        that.addClass("was-validated")
    } else {
        $.post({
            url: layoutCreateURL,
            data: {
                id: layout.id,
                name: that.find("input[name=name]").val(),
                rows: that.find("input[name=rows]").val(),
                cols: that.find("input[name=cols]").val(),
                csrfmiddlewaretoken: that.find("input[name=csrfmiddlewaretoken]").val()
            },
            success: function (data) {
                if (data["code"] === 200) {
                    customAlert("success", "布局创建成功！", "")
                    $.cookie("layout", data["layout"], {
                        path: "/"
                    })
                    setTimeout(function () {
                        location.reload()
                    }, 1500)
                } else if (data["code"] === 403) {
                    customAlert("warning", "布局创建失败！", data["msg"])
                }
            },
            error: function (e) {
                console.log(e)
                customAlert("danger", "请求失败!", "服务器异常")
            }
        })
    }
})

$("#layout-create-modal").on("click", ".save-layout", function () {
    $("form.layout-create").submit()
})