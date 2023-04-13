let infoForm = $(".update-form")
let editInfoBtn = $("a.btn-edit-info")
let onEdit = false

infoForm.submit(function (event) {
    event.preventDefault()
    let that = $(this)
    $.ajax({
        method: "POST",
        url: infoUpdateURL,
        data: {
            name: that.find("input[name=name]").val(),
            source: that.find("textarea[name=source]").val(),
            detect: that.find("input[name=detect]")[0].checked,
            csrfmiddlewaretoken: csrfToken,
        },
        success: function (data) {
            if (data["code"] === 403) {
                customAlert("danger", "操作失败！", data["msg"])
            } else if (data["code"] === 200) {
                editInfoBtn.html("编辑")
                editInfoBtn.attr("title", "编辑监控信息")
                customAlert("success", "操作成功！", data["msg"])
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

editInfoBtn.bind("click", function () {
    $("#monitor-name-input").attr("disabled", onEdit)
    $("#monitor-source-input").attr("disabled", onEdit)
    onEdit = !onEdit
    if (onEdit) {
        $(this).html("保存")
        $(this).attr("title", "保存监控信息")
    } else {
        infoForm.submit()
    }
})