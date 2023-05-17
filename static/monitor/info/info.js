// elements
let infoForm = $(".update-form")
let operationArea = $(".operation-area")
let formTitle = $(".form-title")
let resultList = $("#result-list")
let detectTypeSelect = $("#detect-type-select")
let startTimeInput = $("#start-time")
let endTimeInput = $("#end-time")
let allCheckBox = $("input[name=all-check-box]")
let deleteCheckedBtn = $(".delete-checked")
let orderSelect = $("#order-select")

// params
let currentPage = 1
let pageSize = 10
let resultDataList = []


function getCheckedResultsId() {
    let checkedResults = []
    resultList.find("tr").each(function () {
        let checkbox = $(this).find("input[name=chk]")[0]
        if (checkbox.checked) {
            checkedResults.push(resultDataList[$(this).index()]["id"])
        }
    })
    return checkedResults
}

function resetEdit() {
    infoForm.find("input[name=name]").value = originMonitorName
    infoForm.find("input[name=source]").value = originMonitorSource
}

function queryData() {
    let data = {
        currentPage: currentPage,
        pageSize: pageSize,
        asc: orderSelect.val(),
        col: detectTypeSelect.val()
    }
    if (startTimeInput[0].value !== "") {
        data["st"] = startTimeInput[0].value
    }
    if (endTimeInput[0].value !== "") {
        data["et"] = endTimeInput[0].value
    }
    return data
}

function hasFilter() {
    return startTimeInput[0].value !== "" || endTimeInput[0].value !== "" || detectTypeSelect.val() !== ""
}

function getResultsData(successCallback, errorCallback) {
    $.ajax({
        method: "GET",
        url: resultsQueryURL,
        data: queryData(),
        success: function (data) {
            currentPage = data["currentPage"]
            resultDataList = data["resultList"]

            resultList.html("")
            let resultTip = $(".result-tip-area")
            resultTip.html("")

            if (resultDataList.length === 0) {
                resultTip.removeClass("d-none")
                allCheckBox.addClass("disabled")
                resultTip.html('<h4>' + (hasFilter() ? "筛选结果为空，请重新设置筛选条件" : "无检测记录") + '</h4>')
            } else {
                resultTip.addClass("d-none")
                allCheckBox.removeClass("disabled")

                for (let i = 0; i < resultDataList.length; i++) {
                    let result = resultDataList[i]
                    resultList.append(
                        '<tr role="row">' +
                        "<td class='custom-control custom-checkbox'>" +
                        "<label class='row-checkbox mt-2'>" +
                        "<input type='checkbox' name='chk'><span> " + result["id"] + "</span>" +
                        '</label>' +
                        '</td>' +
                        '<td class="text-center">' + result["detect_time"] + '</td>' +
                        '<td class="text-center">' + result["head_without_helmet"] + '</td>' +
                        '<td class="text-center">' + result["head_with_helmet"] + '</td>' +
                        '<td class="text-center">' + result["person"] + '</td>' +
                        '<td class="text-center">' +
                        '<a data-fancybox="gallery" href="' + mediaBaseURL + result["img"] + '">' +
                        '<img class="img-responsive result-img" alt="#" src="' + mediaBaseURL + result["img"] + '">' +
                        "</a>" +
                        "</td>" +
                        '<td class="text-center">' +
                        "<i class='table-row-clickable fa fa-edit text-secondary me-2'></i>" +
                        "<i class='ti-trash text-danger' data-bs-toggle='modal' data-bs-target='#delete-confirm-modal'></i>" +
                        "</td>" +
                        "</tr>"
                    )
                }
            }

            allCheckBox.prop("checked", false)
            deleteCheckedBtn.prop("disabled", true)

            // 设置分页栏
            $("#pagination").pagination({
                currentPage: currentPage,
                pageNums: data["pageNums"],
                pageSize: pageSize,
                onPageChange: function (cp, ps) {
                    currentPage = cp
                    pageSize = ps
                    getResultsData()
                }
            })

            if (successCallback) {
                successCallback()
            }
        },
        error: function (e) {
            alert(e)
            if (errorCallback) {
                errorCallback()
            }
        }
    })
}

function requestDeleteResult(idList) {
    $.ajax({
        method: "POST",
        traditional: true,
        url: deleteResultsURL,
        data: {
            idList: idList,
            csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val(),
        },
        success: function (data) {
            customAlert("success", "操作成功!", data["msg"])
            getResultsData()
        },
        error: function (e) {
            console.log(e)
            customAlert("danger", "操作失败!", e)
        }
    })
}

$(() => {
    // load data from url
    let defaultType = window.location.href.split("#")[1]
    detectTypeSelect.children("option[value=" + defaultType + "]").attr("selected", "selected")

    getResultsData()
})

infoForm.submit(function (event) {
    event.preventDefault()
    let newName = $(this).find("input[name=name]").val()
    let newSource = $(this).find("textarea[name=source]").val()
    if (newName !== originMonitorName || newSource !== originMonitorSource) {
        $.ajax({
            method: "POST",
            url: infoUpdateURL,
            data: {
                name: newName,
                source: newSource,
                csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val(),
            },
            success: function (data) {
                if (data["code"] === 403) {
                    customAlert("danger", "操作失败！", data["msg"])
                } else if (data["code"] === 200) {
                    customAlert("success", "操作成功！", data["msg"])
                    resetEdit()
                    $(".monitor-name").html(newName)
                    setTimeout(() => {
                        location.reload()
                    }, 2000)
                }
            },
            error: function (_) {
                customAlert("danger", "操作失败！", "服务器已关闭")
            }
        })
    }
})

formTitle.on("click", "a.btn-edit-info", function () {
    operationArea.html(
        '<a href="javascript:" class="btn-save-info text-white me-2" title="保存监控信息">保存</a>' +
        '<a href="javascript:" class="btn-cancel-edit text-white" title="取消修改信息">取消</a>'
    )
    $("#monitor-name-input").attr("disabled", false)
    $("#monitor-source-input").attr("disabled", false)
})

formTitle.on("click", ".btn-save-info", function () {
    infoForm.submit()
})

formTitle.on("click", ".btn-cancel-edit", function () {
    resetEdit()
    operationArea.html(
        '<a href="javascript:" class="btn-edit-info text-white" title="编辑监控信息">编辑</a>'
    )
    $("#monitor-name-input").attr("disabled", true)
    $("#monitor-source-input").attr("disabled", true)
})

detectTypeSelect.change(function () {
    currentPage = 1
    getResultsData()
})

orderSelect.change(function () {
    currentPage = 1
    getResultsData()
})

startTimeInput.change(function () {
    currentPage = 1
    getResultsData()
})

endTimeInput.change(function () {
    currentPage = 1
    getResultsData()
})

$(".refresh-btn").click(function () {
    getResultsData(
        function () {
            customAlert("success", "刷新成功！", "")
        },
        function () {
            customAlert("danger", "刷新失败!！", "服务器异常！")
        }
    )
})

resultList.on("click", ".row-checkbox", function () {
    let checkedResultNum = getCheckedResultsId().length
    allCheckBox.prop("checked", checkedResultNum === resultDataList.length)
    deleteCheckedBtn.prop("disabled", checkedResultNum === 0)
})

resultList.on("click", "i.ti-trash", function () {
    let modal = $("#delete-confirm-modal")
    let result = resultDataList[$(this).parent().parent().index()]
    modal.find(".result-id").html(result["id"])
    modal.find(".modal-body").html("确定要删除检测结果 " + result["id"] + " 吗？")
})

deleteCheckedBtn.click(function () {
    $("#delete-checked-confirm-modal").find(".modal-body").html(
        "确定要删除选中的" + getCheckedResultsId().length + "条检测结果吗？"
    )
})

$(".delete-confirm-btn").click(function () {
    let id = $("#delete-confirm-modal").find(".result-id").html()
    requestDeleteResult([id])
})

$(".delete-checked-confirm-btn").click(function () {
    requestDeleteResult(getCheckedResultsId())
})

allCheckBox.click(function () {
    let that = this
    deleteCheckedBtn.prop("disabled", !that.checked)
    resultList.find("input[name=chk]").each(function () {
        $(this).prop("checked", that.checked)
    })
})

$("input[name=detect]").click(function () {
    let that = this
    $.ajax({
        method: "POST",
        traditional: true,
        url: switchModificationURL,
        data: {
            idList: [monitorId],
            detect: that.checked,
            csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val(),
        },
        success: function (data) {
            customAlert(
                "success",
                (that.checked ? "开启" : "关闭") + "安全帽检测成功！",
                data["msg"]
            )
        },
        error: function (e) {
            $(that).prop("checked", !that.checked)
            customAlert(
                "danger",
                (that.checked ? "开启" : "关闭") + "安全帽检测失败！",
                e
            )
        }
    })
})

$(".source-video").on("click", ".player-btn.alt", function () {
    handleFullScreen($(this).parent().parent().parent()[0])

    $(this).removeClass("alt")
    $(this).addClass("exit-alt")
    $(this).prop("title", "退出全屏")

}).on("click", ".player-btn.exit-alt", function () {
    exitFullScreen()

    $(this).removeClass("exit-alt")
    $(this).addClass("alt")
    $(this).prop("title", "全屏")
})

$(".player-btn.refresh").click(function () {
    let img = $(".source-img")
    img.prop("src", img.prop("src") + "?" + Math.random())
})