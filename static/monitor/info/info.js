
$(".update-form").submit(function (event) {
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
            alert(data["msg"])
            if (data["code"] === 403) {
                // 提示修改失败
            } else if (data["code"] === 200) {
                // 提示修改成功,切换预览源
            }
        },
        error: function (e) {
            console.log(e)
        }
    })
})