let infoForm = $(".update-form")
let operationArea = $(".operation-area")
let formTitle = $(".form-title")

function resetEdit() {
    infoForm.find("input[name=name]").value = originMonitorName
    infoForm.find("input[name=source]").value = originMonitorSource
}

infoForm.submit(function (event) {
    event.preventDefault()
    let that = $(this)
    let newName = that.find("input[name=name]").val()
    let newSource = that.find("textarea[name=source]").val()
    if (newName === originMonitorName && newSource === originMonitorSource) {
        return
    }
    $.ajax({
        method: "POST",
        url: infoUpdateURL,
        data: {
            name: newName,
            source: newSource,
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            if (data["code"] === 403) {
                customAlert("danger", "操作失败！", data["msg"])
            } else if (data["code"] === 200) {
                resetEdit()
                customAlert("success", "操作成功！", data["msg"])
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