let resultsList = $(".results-list")
let allCheckBox = $("input[name=all-check]")
let ascSelect = $("select[name=asc]")

let resultsListData = []
let deleteId

let currentPage = 1
let pageSize = 10

function showResultsData() {
    resultsList.html("")
    for (let i = 0; i < resultsListData.length; i++) {
        let results = resultsListData[i]
        resultsList.append(
            '<tr class="align-middle">' +
            '<td class="text-start">' +
            '<label>' +
            '<input type="checkbox" name="chk">' +
            '<span> ' + results["id"] + '</span>' +
            '</label>' +
            '</td>' +
            '<td>' + results["monitor_id"] + '</td>' +
            '<td>' + results["monitor_name"] + '</td>' +
            '<td>' + results["detect_time"] + '</td>' +
            '<td>' + results["head_without_helmet"] + '</td>' +
            '<td>' + results["person"] + '</td>' +
            '<td>' + results["head_with_helmet"] + '</td>' +
            '<td>' +
            '<a data-fancybox="gallery" href="' + mediaBaseURL + results["img"] + '">' +
            '<img src="' + mediaBaseURL + results["img"] + '" class="result-img" alt="#">' +
            '</a>' +
            '</td>' +
            '<td>' +
            '<a href="javascript:" class="me-2">' +
            '<i class="clickable fa fa-edit text-secondary"></i>' +
            '</a>' +
            '<i class="ti-trash text-danger" data-bs-toggle="modal" ' +
            'data-bs-target="#delete-confirm-modal"></i>' +
            '</td>' +
            "</tr>"
        )
    }

}

function getCheckedResultsId() {
    let idList = []
    resultsList.find("input[name=chk]").each(function (i, item) {
        if (item.checked) {
            idList.push(resultsListData[i]["id"])
        }
    })
    return idList
}

function hasFilter() {
    return $("select[name=col]").val() !== "" || $("input[name=start-time]").val() !== "" || $("input[name=end-time]").val() !== ""
}

function getResultsData(successCallback, errorCallback) {
    $.ajax({
        method: "GET",
        url: resultsQueryURL,
        data: {
            col: $("select[name=col]").val(),
            st: $("input[name=start-time]").val(),
            et: $("input[name=end-time]").val(),
            asc: ascSelect.val(),
            currentPage: currentPage,
            pageSize: pageSize,
        },
        success: function (data) {
            currentPage = data["currentPage"]
            pageSize = data["pageSize"]
            resultsListData = data["resultsList"]

            showResultsData()

            if (resultsListData.length === 0) {
                // 设置空数据提示
                if (hasFilter()) {
                    $(".tips.filter-none").removeClass("visually-hidden")
                } else {
                    $(".tips.none-results").removeClass("visually-hidden")
                }
            } else {
                $(".tips.filter-none").addClass("visually-hidden")
                $(".tips.none-results").addClass("visually-hidden")
            }

            // 清除选中状态
            allCheckBox.prop("checked", false)
            $("button.delete-selected").prop("disabled", true)
            if (resultsListData.length === 0) {
                allCheckBox.addClass("disabled")
            } else {
                allCheckBox.removeClass("disabled")
            }

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
            console.log(e)
            if (errorCallback) {
                errorCallback()
            }
        }
    })
}

function zeroPadded(val) {
    return (val >= 10 ? "" : "0") + val
}

function formatDate(date) {
    return date.getFullYear() + "-" + zeroPadded(date.getMonth() + 1) + "-" + zeroPadded(date.getDate()) + " " +
        zeroPadded(date.getHours()) + ":" + zeroPadded(date.getMinutes()) + ":" + zeroPadded(date.getSeconds())
}

function loadUrlData() {
    let params = {}
    let p = window.location.href.split("?")
    if (p.length > 1) {
        p = p[1].split("&")
        for (let i = 0; i < p.length; i++) {
            let pi = p[i].split("=")
            if (pi.length === 2) {
                params[pi[0]] = pi[1]
            }
        }
        if (params.day) {
            let d = new Date(params.day.replace("T", " "))
            $("input[name=start-time]").prop("value", formatDate(d))
            d.setDate(d.getDate() + 1)
            $("input[name=end-time]").prop("value", formatDate(d))
        } else if (params.range) {
            let d = new Date()
            let startDayInput = $("input[name=start-time]")
            switch (params.range) {
                case "24h":
                    d.setDate(d.getDate() - 1)
                    startDayInput.prop("value", formatDate(d))
                    break
                case "week":
                    d.setDate(d.getDate() - 7)
                    startDayInput.prop("value", formatDate(d))
                    break
                case "month":
                    d.setMonth(d.getMonth() - 1)
                    startDayInput.prop("value", formatDate(d))
                    break
                default:
            }
        }
        if (params.type) {
            $("select[name=col]").prop("value", params.type)
        }
    }
}

$(() => {
    loadUrlData()
    getResultsData()
})

$("select[name=col], input[name=start-time], input[name=end-time], select[name=sac]").change(function () {
    getResultsData()
})

$(".btn.clean-filter").click(function () {
    $("select[name=col]").val("")
    $("input[name=start-time]").val("")
    $("input[name=end-time]").val("")
    getResultsData()
})

$(".btn.refresh").click(function () {
    getResultsData(function () {
        customAlert("success", "刷新成功！")
    })
})

resultsList.on("click", "input[name=chk]", function () {
    let checkedNums = getCheckedResultsId().length
    $("input[name=all-check]").prop("checked", checkedNums === resultsListData.length)
    $(".btn.delete-selected").prop("disabled", checkedNums === 0)
})

allCheckBox.click(function () {
    let checked = this.checked
    $(".btn.delete-selected").prop("disabled", !checked)
    resultsList.find("input[name=chk]").each(function () {
        $(this).prop("checked", checked)
    })
})

$(".btn.delete-selected").click(function () {
    if (!this.disabled) {
        deleteId = getCheckedResultsId()
        $("#delete-confirm-modal").find(".modal-body").html(
            "确定要删除选中的 " + deleteId.length + " 条检测结果吗？"
        )
    }
})

$(".btn.delete-confirm").click(function () {
    $.ajax({
        method: "POST",
        traditional: true,
        url: deleteResultsURL,
        data: {
            idList: deleteId,
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            customAlert("success", "操作成功!", data["msg"])
            getResultsData()
        },
        error: function (e) {
            console.log(e)
            customAlert("danger", "操作失败!", "服务器异常")
        }
    })
})

resultsList.on("click", "i.ti-trash", function () {
    let index = $(this).parent().parent().index()
    deleteId = [resultsListData[index]["id"]]
    $("#delete-confirm-modal").find(".modal-body").html(
        "确定要删除检测结果 " + deleteId[0] + " 吗？"
    )
})

ascSelect.change(function () {
    currentPage = 1
    getResultsData()
})

