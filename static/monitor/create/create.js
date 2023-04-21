let monitorCreateForm = $(".form-create-monitor")
let sourceImgWrap = $("#source-img-wrap")

let onReview = false

function getSourceImgBtnHTML() {
    return '<a href="javascript:" class="get-new-source-btn w-100 h-100 d-flex">' +
        '<div class="m-auto">' +
        '<span class="h5 text-secondary">获取监控图像</span>' +
        '</div>' +
        '</a>'
}

function imgLoadingHtml() {
    return '<div role="status" class="spinner-grow text-primary m-auto">' +
        '<span class="visually-hidden">Loading...</span>' +
        '</div>'
}

function sourceImgHtml(src) {
    return '<div class="w-100 h-100 d-flex bg-black d-flex">' +
        "<img class='review-img m-auto mh-100 mw-100' src='" + src + "' alt=''/>" +
        '</div>'
}

$(() => {
    sourceImgWrap.html(getSourceImgBtnHTML())
})

monitorCreateForm.submit(function (event) {
    event.preventDefault()
    if (!this.checkValidity()) {
        event.stopPropagation()
        $(this).addClass("was-validated")
    } else {
        let that = this
        $.ajax({
            method: "POST",
            url: monitorInsertURL,
            data: {
                name: $("input[name=name]").val(),
                source: $("textarea[name=source]").val(),
                detect: $("select[name=helmet-detect]").val(),
                csrfmiddlewaretoken: csrfToken,
            }, success: function (data) {
                console.log(data)
                switch (data["code"]) {
                    case 403: {
                        customAlert("warning", "监控添加失败！", data["msg"]["source"].join("，"))
                        break
                    }
                    case 200: {
                        customAlert("success", "监控添加成功！", data["msg"])
                        that.reset()
                        break
                    }
                    default: {

                    }
                }
            }, error: function (e) {
                console.log(e)
                customAlert("error", "请求出错！", "服务器已关闭。")
            }
        })
    }
})

monitorCreateForm.on("reset", function () {
    $(this).removeClass("was-validated")
})

$("textarea[name=source]").keydown(function () {
    if (onReview) {
        onReview = false
        window.stop ? window.stop() : document.execCommand("Stop");
        sourceImgWrap.html(getSourceImgBtnHTML())
    }
})

sourceImgWrap.bind("click", ".get-new-source-btn", function () {
    let source = $("textarea[name=source]").val()
    if (source === "") {
        customAlert("info", "", "请先填写监控源!")
    } else {
        sourceImgWrap.html(imgLoadingHtml())
        $.ajax({
            method: "GET",
            url: newSourceTestURL,
            data: {
                source: source
            },
            success: function (data) {
                let src
                if (data["connected"]) {
                    src = reviewSourceURL + "?token=" + data["token"]
                } else {
                    src = "/static/img/404.jpeg"
                }
                onReview = true
                sourceImgWrap.html(sourceImgHtml(src))
            },
            error: function (e) {
                console.log(e)
                sourceImgWrap.html(getSourceImgBtnHTML())
            }
        })
    }
})