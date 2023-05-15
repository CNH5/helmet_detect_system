let toastContainer = $(".toast-container")
let alertContainer = $(".alert-dismiss")
let warningNotify = $("li.dropdown")

let needGetWarning = true  // 标记当前界面是否需要获取警报

function listenWarning() {
    $.ajax({
        method: "GET",
        url: warningListenURL,
        success: function (data) {
            if (data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    let wm = data[i]
                    // TODO: 容器过长时移除较早的toast
                    toastContainer.append(
                        "<div class='toast show' role='alert' aria-atomic='true'>" +
                        "<div class='toast-header'>" +
                        "<div class='rounded me-2 bg-danger'><i class='ti-alert text-white ps-1 pe-1'></i></div>" +
                        "<strong class='me-auto'>检测到人员未佩戴安全帽!</strong>" +
                        "<small class='text-muted mt-1'>刚刚</small>" +
                        "<button type='button' class='btn-close close-toast' data-bs-dismiss='toast' aria-label='Close'></button>" +
                        "</div>" +
                        "<div class='toast-body row'>" +
                        "<div class='col-md flex-grow-1 d-flex align-items-end'>" +
                        "监控名：'" + wm["name"] + "'，监控ID：" + wm["id"] +
                        "</div>" +
                        "<button class='btn btn-outline-primary ms-auto btn-xs col-md-auto me-2 btn-see-warning'>" +
                        "点此查看" +
                        "</button>" +
                        "</div>" +
                        "<div class='d-none recv-time'>" + new Date() + "</div>" +
                        "<div class='d-none m-id'>" + wm["id"] + "</div>" +
                        "</div>"
                    )
                }
            }
        },
        error: function (e) {
            console.log(e)
        }
    })
}

function getWarningNum() {
    $.ajax({
        method: "GET",
        url: warningNumURL,
        success: function (data) {
            if (data["count"] > 0) {
                warningNotify.children("i.ti-bell").html("<span>" + data["count"] + "</span>")
                warningNotify.children(".dropdown-menu").children(".notify-title").html(
                    "有 " + data["count"] + " 条新的警报" + "<a href='" + viewWarningURL + "'>查看全部</a>"
                )
            }
        },
        error: function (e) {
            console.log(e)
        }
    })
}

function getWarningList() {

}

function handleFullScreen(ele) {
    if (ele.requestFullscreen) {
        ele.requestFullscreen()
    } else if (ele.msRequestFullscreen) {
        ele.msRequestFullscreen()
    } else if (ele.mozRequestFullscreen) {
        ele.mozRequestFullscreen()
    } else if (ele.webkitRequestFullscreen) {
        ele.webkitRequestFullscreen()
    }
}

function exitFullScreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen()
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
    } else if (document.mozCancelFullscreen) {
        document.mozCancelFullscreen()
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
    }
}

function customAlert(type, title, info, timeout) {
    let alt = $(
        '<div class="alert alert-' + type + ' alert-dismissible show d-inline-flex ms-auto me-auto" role="alert">' +
        '<div class="alert-text-wrap">' +
        '<strong class="alert-title">' + title + '</strong>' +
        '<span class="alert-text ms-1">' + info + '</span>' +
        '</div>' +
        '<span class="fa fa-times ms-auto mt-1" data-bs-dismiss="alert" aria-label="Close"></span>' +
        '</div>'
    )
    alertContainer.append(alt)
    setTimeout(() => {
        alt.remove()
    }, timeout ? timeout : 3000)
}

$(() => {
    let pageNums = $.cookie("visiblePages") // 活跃页面计数
    $.cookie("visiblePages", (pageNums ? parseInt(pageNums) : 0) + 1)
    // 每1.5秒获取一次警报信息
    setInterval(function () {
        pageNums = parseInt($.cookie("visiblePages"))
        let pageIsVisible = document.visibilityState === "visible"
        if (!needGetWarning && pageIsVisible) {
            // 不可见->可见
            $.cookie("visiblePages", ++pageNums)
            needGetWarning = true
        } else if (needGetWarning && !pageIsVisible) {
            if (pageNums === 1) {
                // 可见->不可见，且所有界面都不可见时，仍旧查询警报
                $.cookie("visiblePages", --pageNums)
            } else if (pageNums > 0) {
                // 不可见->不可见, 有其它界面可见,不需要获取警报
                needGetWarning = false
            }
        }
        if (needGetWarning) {
            listenWarning()
        }
    }, 1500)  // 1.5秒监听似乎刚好合适

    // 动态修改警报时间
    setInterval(function () {
        toastContainer.find(".toast").each(function () {
            let timeNode = $(this).find("small.text-muted")
            let t = new Date() - new Date($(this).find(".recv-time")[0].innerHTML)
            if (t > 10000 && t < 60000) {
                timeNode.html(Math.floor(t / 1000) + "秒前")
            } else if (t >= 60000 && t < 3600000) {
                timeNode.html(Math.floor(t / 60000) + "分钟前")
            } else if (t > 3600000) {
                timeNode.html(Math.floor(t / 3600000) + "小时前")
            }
        })
    }, 20000)

    getWarningNum()
})

window.onbeforeunload = function () {
    let pageNums = parseInt($.cookie("visiblePages"))
    $.cookie("visiblePages", --pageNums)
}

toastContainer.on("click", "button.close-toast", function () {
    let toast = $(this).parent().parent()

    toast.remove()
})

toastContainer.on("click", "button.btn-see-warning", function () {
    let toast = $(this).parent().parent()
    let monitor_id = toast.children(".m-id").html()
    toast.remove()
    window.open(monitorInfoURL.replace("0", monitor_id) + "#head_without_helmet")
})