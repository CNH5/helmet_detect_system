let resultsList = $(".results-list")

let resultsListData = []
let deleteId

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

function getResultsData(successCallback, errorCallback) {
    $.ajax({
        method: "GET",
        url: resultsQueryURL,
        data: {
            col: $("select[name=col]").val(),
            st: $("input[name=start-time]").val(),
            et: $("input[name=end-time]").val(),
            asc: $("select[name=asc]").val(),
            currentPage: currentPage,
            pageSize: pageSize,
        },
        success: function (data) {
            currentPage = data["currentPage"]
            pageNums = data["pageNums"]
            resultsListData = data["resultsList"]
            showResultsData()
            setPaginationHTML(resultsListData.length === 0)
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

$(() => {
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

$("input[name=all-check]").click(function () {
    let checked = this.checked
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

pagePreviousBtn.click(function () {
    if ($(this).attr("class").split(" ").indexOf("disabled") < 0) {
        getResultsData()
    }
})

pageNumArea.on("click", ".page-num", function () {
    getResultsData()
})

pageNextBtn.click(function () {
    if ($(this).attr("class").split(" ").indexOf("disabled") < 0) {
        getResultsData()
    }
})

pageSizeInput.keydown(function (e) {
    if (e.keyCode === 13) {
        // 输入回车
        getResultsData()
    }
})

pageNumTipArea.on("keydown", "input[name=page-num]", function (e) {
    if (e.keyCode === 13) {
        // 输入回车
        getResultsData()
    }
})
