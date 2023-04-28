let monitorsList = $("#monitor-list")
let allCheckBox = $("input[name=all-check-box]")
let orderCol = $("select[name=orderCol]")
let filterList = $(".filter-list")
let filterNumsBadge = $(".badge.filter-nums")

// query param
let ascendingOrder = true

// other
let monitorListData = []
let deleteMonitors = []


function getCheckedMonitorID() {
    let result = []
    monitorsList.find("input[name=chk]").each(function (i, item) {
        if (item.checked) {
            result.push(monitorListData[i]["id"])
        }
    })
    return result
}

// 重新获取表格数据
function refreshTable(successCallback, errorCallback) {
    $.ajax({
        method: "GET",
        url: monitorQueryURL,
        traditional: true,
        data: {
            currentPage: currentPage,
            pageSize: pageSize,
            orderCol: orderCol.val(),
            ascendingOrder: ascendingOrder,
            filter: JSON.stringify(getFilterData()),
        },
        success: function (data) {
            currentPage = data["currentPage"]
            monitorListData = data["monitorList"]
            pageNums = data["pageNums"]
            setTableBodyHTML()
            setPaginationHTML()
            if (successCallback) {
                successCallback(data)
            }
        },
        error: function (e) {
            console.log(e)
            if (errorCallback) {
                errorCallback(e)
            }
        }
    })
}

// 绘制表格
function setTableBodyHTML() {
    monitorsList.html("")
    for (let i = 0; i < monitorListData.length; i++) {
        let monitor = monitorListData[i]
        monitorsList.append(
            "<tr class='align-middle'>" +
            "<td class='custom-control custom-checkbox text-start'>" +
            "<label class='monitor-checkbox my-auto'>" +
            "<input type='checkbox' name='chk'> " + "<span>" + monitor["id"] + "</span>" +
            "</label>" +
            "</td>" +
            "<td class='clickable table-row-clickable'>" + monitor["name"] + "</td>" +
            "<td class='clickable table-row-clickable'>" + monitor["create_date"] + "</td>" +
            "<td class='clickable table-row-clickable'>" + monitor["source"] + "</td>" +
            "<td class='text-center'>" +
            "<label class='form-check-label form-switch helmet-detect-switch'>" +
            "<input class='form-check-input' type='checkbox' name='det' role='switch' " +
            (monitor["helmet_detect"] ? "checked" : "") + ">" +
            "</label>" +
            "</td>" +
            "<td>" +
            "<ul class='d-flex justify-content-center'>" +
            "<li class='me-3'><i class='clickable table-row-clickable fa fa-edit text-secondary'></i></li>" +
            "<li>" +
            "<i class='ti-trash text-danger' data-bs-toggle='modal' data-bs-target='#delete-confirm-modal'></i>" +
            "</li>" +
            "</ul>" +
            "</td>" +
            " </tr>"
        )
    }
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
                customAlert("warning", "", data["msg"])
            } else if (data["code"] === 200) {
                monitorsList.find("tr").each(function () {
                    if ($(this).find("input[name=chk]")[0].checked) {
                        $(this).find("input[name=det]").prop("checked", detect)
                    }
                })
                customAlert("success", "", data["msg"])
            }
        },
        error: function (e) {
            console.log(e)
            customAlert("error", "请求失败！")
        }
    })
}

function getFilterData() {
    let filters = []
    filterList.find(".filter-item").each(function () {
        let val = $(this).find("input[name=value]").val()
        if (val !== "") {
            let filter = {
                "operator": $(this).find("select[name=operator]").val(),
                "col": $(this).find("select[name=col]").val(),
                "value": val,
            }
            switch ($(this).find("select[name=operation]").val()) {
                case "=":
                    filter["operation"] = "exact"
                    filter["not"] = false
                    break
                case "≠":
                    filter["operation"] = "exact"
                    filter["not"] = true
                    break
                case ">":
                    filter["operation"] = "gt"
                    filter["not"] = false
                    break
                case "<":
                    filter["operation"] = "lt"
                    filter["not"] = false
                    break
                case "≥":
                    filter["operation"] = "gte"
                    filter["not"] = false
                    break
                case "≤":
                    filter["operation"] = "lte"
                    filter["not"] = false
                    break
                case "contain":
                    filter["operation"] = "contain"
                    filter["not"] = false
                    break
                case "not_contain":
                    filter["operation"] = "contain"
                    filter["not"] = true
                    break
                case "pattern":
                    filter["operation"] = "regex"
                    filter["not"] = false
                    break
                default:
                    filter["operation"] = ""
                    filter["not"] = false
            }
            filters.push(filter)
        }
    })
    return filters
}

function setFilterNumBadge() {
    let filterNums = 0
    filterList.find(".filter-item").each(function () {
        if ($(this).find("input[name=value]").val() !== "") {
            filterNums++
        }
    })

    if (filterNums > 0) {
        filterNumsBadge.html(filterNums)
        filterNumsBadge.removeClass("d-none")
    } else {
        filterNumsBadge.addClass("d-none")
    }
}

// 初始
$(() => {
    refreshTable();
})

// 监听
monitorsList.on("click", ".table-row-clickable", function () {
    let index = $(this).parent().index()
    window.location.href = monitorInfoURL.replace("0", monitorListData[index]["id"])
})

monitorsList.on("click", ".monitor-checkbox", function () {
    // 每行的checkbox
    let n = getCheckedMonitorID().length
    allCheckBox.prop("checked", n === monitorListData.length)
    if (n === 0) {
        $("button.option").addClass("disabled")
    } else {
        $("button.option").removeClass("disabled")
    }
})

monitorsList.on("click", ".ti-trash", function () {
    let index = $(this).parent().parent().parent().parent().index()
    let m = monitorListData[index]
    deleteMonitors = [m["id"]]
    $("#delete-confirm-modal").find(".modal-body").html(
        "确定要将监控 '" + m["name"] + "' 删除吗? (ID:" + m["id"] + "，源: '" + m["source"] + "')"
    )
})

monitorsList.on("click", ".helmet-detect-switch", function () {
    // 安全帽检测开关
    let id = monitorListData[$(this).parent().parent().index()]["id"]
    let detect = $(this).children("input").is(":checked")
    changeDetect([id], detect)
})

pageSizeInput.keydown(function (e) {
    if (e.keyCode === 13) {
        // 输入回车
        refreshTable()
    }
})

pageNumTipArea.on("keydown", "input[name=page-num]", function (e) {
    if (e.keyCode === 13) {
        // 输入回车
        currentPage = this.value
        refreshTable()
    }
})

allCheckBox.bind("click", function () {
    let checked = this.checked
    monitorsList.find("input[name=chk]").each(function () {
        $(this).prop("checked", checked)
    })
    if (checked) {
        $("button.option").removeClass("disabled")
    } else {
        $("button.option").addClass("disabled")
    }
})

$("#open-checked-detect").click(function () {
    if (!isDisabled($(this))) {
        changeDetect(getCheckedMonitorID(), true)
    }
})

$("#close-checked-detect").click(function () {
    if (!isDisabled($(this))) {
        changeDetect(getCheckedMonitorID(), false)
    }
})

$("#delete-checked").click(function () {
    deleteMonitors = getCheckedMonitorID()
    $("#delete-confirm-modal").find(".modal-body").html(
        "确定要将选中的 " + deleteMonitors.length + " 个监控删除吗？"
    )
})

$("#btn-refresh").click(function () {
    refreshTable(function (_) {
        customAlert("success", "刷新成功！", "")
    }, function (_) {
        customAlert("error", "刷新失败！", "")
    })
})

$(".filter-content").click(function (e) {
    e.stopPropagation();
})

$(".btn.filter-add").click(function () {
    let filterItem = $('<div class="row filter-item"></div>')
    filterItem.append(
        '<label class="col-2 p-1 d-flex mb-0">' +
        '<select class="form-select form-select-sm" name="operator">' +
        '<option value="and" selected>且 (and)</option>' +
        '<option value="or">或 (or)</option>' +
        '</select>' +
        '</label>'
    )

    let colSelect = $(
        '<label class="col-3 p-1 mb-0">' +
        '<select class="form-select form-select-sm" name="col">' +
        '<option value="id" selected>ID</option>' +
        '<option value="name">监控名</option>' +
        '<option value="create_date">创建日期</option>' +
        '<option value="source">监控源</option>' +
        '<option value="detect">安全帽检测</option>' +
        '</select>'
    )
    colSelect.data('pre', $(this).val());
    filterItem.append(colSelect)

    filterItem.append(
        '</label>' +
        '<label class="col-2 p-1 mb-0">' +
        '<select class="form-select form-select-sm fs-14" name="operation">' +
        '<option value="" selected>=</option>' +
        '<option value="≠">≠</option>' +
        '<option value=">">></option>' +
        '<option value="<"><</option>' +
        '<option value="≥">≥</option>' +
        '<option value="≤">≤</option>' +
        '</select>'
    )
    filterItem.append(
        '</label>' +
        '<label class="col-4 p-1 mb-0">' +
        '<input type="number" name="value" min="1" class="form-control form-control-sm fs-14">' +
        '</label>'
    )
    filterItem.append(
        '<div class="col-1 p-1">' +
        '<button type="button" class="remove btn btn-outline-primary btn-xs d-flex h-100">' +
        '<span class="ti-trash my-auto"></span>' +
        '</button>' +
        '</div>'
    )
    filterList.append(filterItem)
})

filterList.on("change", "select[name=col]", function () {
    let filterItem = $(this).parent().parent()
    let operationNode = filterItem.find("select[name=operation]")
    let valueNode = filterItem.find("input[name=value]")
    let val = $(this).val()
    let pre = $(this).data('pre')
    valueNode.val("")
    if (val === "name" || val === "source") {
        if (pre !== "name" && pre !== "source") {
            operationNode.html(
                "<option value='contain' selected>包含</option>" +
                "<option value='not_contain'>不包含</option>" +
                "<option value='pattern'>正则</option>" +
                "<option value='='>等于</option>" +
                "<option value='≠'>不等于</option>"
            )
        }
        operationNode.prop("disabled", false)
        valueNode.prop("type", "text")
    } else if (val === "id" || val === "create_date") {
        if (pre !== "id" && pre !== "create_date") {
            operationNode.html(
                "<option value='' selected>=</option>" +
                "<option value='≠'>≠</option>" +
                "<option value='>'>></option>" +
                "<option value='<'><</option>" +
                "<option value='≥'>≥</option>" +
                "<option value='≤'>≤</option>"
            )
        }
        operationNode.prop("disabled", false)
        valueNode.prop("type", val === "id" ? "number" : "datetime-local")
    } else if (val === "detect") {
        operationNode.html("<option value='' selected>=</option>")
        operationNode.prop("disabled", true)
        // TODO: 需要将valueNode改为select
    }
    $(this).data('pre', val);
})

filterList.on("click", ".btn.remove", function () {
    if (!isDisabled($(this))) {
        $(this).parent().parent().remove()
    }
})

orderCol.change(function () {
    refreshTable()
})

$(".btn.clean-filters").click(function () {
    filterList.find(".filter-item").each(function (i, item) {
        if (i === 0) {
            $(item).find("input[name=value]").val("")
        } else {
            $(item).remove()
        }
    })
})

$("#filter-set-modal").bind("hide.bs.modal", function () {
    setFilterNumBadge()
    refreshTable()
})

$("#order-change").click(function () {
    ascendingOrder = !ascendingOrder
    let icon = $(this).children("i")
    if (ascendingOrder) {
        icon.addClass("fa-sort-amount-desc")
        icon.removeClass("fa-sort-amount-asc")
    } else {
        icon.addClass("fa-sort-amount-asc")
        icon.removeClass("fa-sort-amount-desc")
    }
    currentPage = 1
    refreshTable()
})

$("button.delete-confirm").click(function () {
    $.ajax({
        method: "POST",
        traditional: true,
        url: monitorDeleteURL,
        data: {
            pk_list: JSON.stringify(deleteMonitors),
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            customAlert("success", "删除成功！", data["msg"])
            refreshTable()
        },
        error: function (e) {
            console.log(e)
            customAlert("danger", "请求失败！")
        }
    })
})

pagePreviousBtn.click(function () {
    if ($(this).attr("class").split(" ").indexOf("disabled") < 0) {
        refreshTable()
    }
})

pageNumArea.on("click", ".page-num", function () {
    refreshTable()
})

pageNextBtn.click(function () {
    if ($(this).attr("class").split(" ").indexOf("disabled") < 0) {
        refreshTable()
    }
})

