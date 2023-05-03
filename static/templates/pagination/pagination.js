let pageSizeInput = $("input[name=page-size]")
let pagePreviousBtn = $(".page-previous")
let pageNumArea = $(".page-num-area")
let pageNextBtn = $(".page-next")
let pageNumTipArea = $(".page-num-tip-area")

let currentPage = 1
let pageNums = 0
let pageSize = 10

// 绘制分页栏
function setPaginationHTML(noneData) {
    let s, e
    if (pageNums <= 7 || currentPage <= 4) {
        s = 1
        e = Math.min(pageNums, 7)
    } else if (currentPage + 3 >= pageNums) {
        s = pageNums - 6
        e = pageNums
    } else {
        s = currentPage - 3
        e = currentPage + 3
    }
    // 绘制分页栏
    if (noneData) {
        $("#pagination").addClass("visually-hidden")
    } else {
        $("#pagination").removeClass("visually-hidden")
        if (pageNums === 1) {
            $(".multi-page").addClass("visually-hidden")
            pageNumTipArea.addClass("ms-auto")
            pageNumTipArea.html('共 1 页')
        } else {
            $(".multi-page").removeClass("visually-hidden")
            pageNumArea.html("")
            for (let i = s; i <= e; i++) {
                pageNumArea.append(
                    "<button type='button' class='page-num btn btn-xs " +
                    "btn" + (i === currentPage ? "" : "-outline") + "-primary ms-1 border'>" +
                    i +
                    "</button>"
                )
            }
            pageNumArea.removeClass("visually-hidden")
            pageNumTipArea.html(
                '共 ' + pageNums + ' 页，跳至' +
                '<label class="mx-1 mb-0">' +
                "<input class='pagination-input rounded form-control form-control-sm' type='text' name='page-num'>" +
                '</label>' +
                '页'
            )
            if (currentPage === 1) {
                pagePreviousBtn.addClass("disabled")
            } else {
                pagePreviousBtn.removeClass("disabled")
            }

            if (currentPage === pageNums) {
                pageNextBtn.addClass("disabled")
            } else {
                pageNextBtn.removeClass("disabled")
            }
        }
    }
}

pageSizeInput.keyup(function () {
    this.value = this.value.replace(/\D/, "")
})

pageNumTipArea.on("keyup", "input[name=page-num]", function () {
    this.value = this.value.replace(/\D/, "")
})

pagePreviousBtn.click(function () {
    if ($(this).attr("class").split(" ").indexOf("disabled") < 0) {
        currentPage--
        pageSizeInput.prop("value", pageSize)
    }
})

pageNumArea.on("click", ".page-num", function () {
    currentPage = $(this).html()
    pageSizeInput.prop("value", pageSize)
})

pageNextBtn.click(function () {
    if ($(this).attr("class").split(" ").indexOf("disabled") < 0) {
        currentPage++
        pageSizeInput.prop("value", pageSize)
    }
})

pageSizeInput.keydown(function (e) {
    if (e.keyCode === 13) {
        // 输入回车
        pageSize = this.value
    }
})

pageNumTipArea.on("keydown", "input[name=page-num]", function (e) {
    if (e.keyCode === 13) {
        // 输入回车
        currentPage = this.value
        pageSizeInput.prop("value", pageSize)
    }
})

