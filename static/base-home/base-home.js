let toastContainer = $(".toast-container")
let pageIsHidden = false
let needGetWarning = true

function getWarning() {
    $.ajax({
        method: "GET",
        url: warningListenURL,
        success: function (data) {
            console.log(data)
            if (data["warning"]) {
                toastContainer.append(
                    "<div class='toast show' role='alert' aria-atomic='true'>" +
                    "<div class='toast-header'>" +
                    "<div class='rounded me-2 bg-danger'><i class='ti-alert text-white ps-1 pe-1'></i></div>" +
                    "<strong class='me-auto'>Bootstrap</strong>" +
                    "<small class='text-muted'>just now</small>" +
                    "<button type='button' class='btn-close close-toast' data-bs-dismiss='toast' aria-label='Close'></button>" +
                    "</div>" +
                    "<div class='toast-body'>" + "test" + "</div>" +
                    "</div>"
                )
            }
        },
        error: function (e) {
            console.log(e)
        }
    })
}

$(() => {
    // 页面计数
    let pageNums = $.cookie("pageNums")
    if (pageNums === null) {
        $.cookie("pageNums", 1)
    } else {
        $.cookie("pageNums", pageNums + 1)
    }
    // 每秒获取一次警报信息
    setInterval(function () {
        pageNums = $.cookie("pageNums")
        let pageIsVisible = document.visibilityState === "visible"
        if (pageIsHidden && pageIsVisible) {
            // 不可见->可见
            $.cookie("pageNums", ++pageNums)
            needGetWarning = true
        } else if (!pageIsHidden && !pageIsVisible) {
            // 可见->不可见
            $.cookie("pageNums", --pageNums)
            // 全部界面都不可见时，仍旧查询警报
            needGetWarning = pageNums === 0
        } else if (pageIsHidden && pageIsVisible) {
            // 不可见->不可见
            // 有其它界面活动,不需要获取警报
            needGetWarning = pageNums === 0
        } else {
            // 可见->可见
            // 不需要执行其他操作
        }
        if (needGetWarning) {
            getWarning()
        }
    }, 1000)
})

toastContainer.on("click", "button.close-toast", function () {
    $(this).parent().parent().remove()
})