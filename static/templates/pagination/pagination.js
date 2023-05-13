$.fn.pagination = function (options) {
    let settings = $.extend({
        currentPage: 1, //当前页码
        pageNums: 0, //总页数
        pageSize: 10, // 每页显示的数据条数
        showRange: 9, // 最大显示页码数
        onPageChange: function (currentPage, pageSize) {
        }, //页码改变时的回调
    }, options || {})

    function pageNumsHTML() {
        let s, e
        let m = Math.floor(settings.showRange / 2)
        if (settings.pageNums <= settings.showRange || settings.currentPage <= m + 1) {
            s = 1
            e = Math.min(settings.pageNums, settings.showRange)
        } else if (settings.currentPage + m >= settings.pageNums) {
            s = settings.pageNums - settings.currentPage + 1
            e = settings.pageNums
        } else {
            s = settings.currentPage - m
            e = settings.currentPage + m
        }

        let html =
            '<div class="my-auto">' +
            '    <a href="javascript:" class="page-previous btn btn-xs btn-outline-primary border ' + (settings.currentPage === 1 ? "disabled" : "") + '">' +
            '        上一页' +
            '    </a>' +
            '</div>'
        for (let i = s; i <= e; i++) {
            html +=
                "<button type='button' class='page-num btn btn-xs btn" + (i === settings.currentPage ? "" : "-outline") + "-primary ms-1 border'>" +
                i +
                "</button>"
        }
        html +=
            '<div class="my-auto me-auto ms-1">' +
            '    <a href="javascript:" class="page-next btn btn-xs btn-outline-primary ' + (settings.currentPage === settings.pageNums ? "disabled" : "") + ' border">' +
            '        下一页' +
            '    </a>' +
            '</div>'
        return html
    }

    $(this)
        .addClass("d-flex")
        .html(
            '<div class="my-auto pull-left">' +
            '    每页' +
            '    <label class="mx-1 mb-0">' +
            '        <input class="pagination-input form-control form-control-sm" type="text" name="page-size" value="' + settings.pageSize + '">' +
            '    </label>' +
            '    条数据' +
            '</div>' +
            '<div class="d-flex mx-auto">' + (settings.pageNums > 1 ? pageNumsHTML() : "") + '</div>' +
            '<div class="my-auto pull-right ' + (settings.pageNums <= 1 ? "ms-auto" : "") + ' page-num-tip-area">' +
            (
                settings.pageNums > 1 ?
                    '共 ' + settings.pageNums + ' 页，跳至' +
                    '<label class="mx-1 mb-0">' +
                    "<input class='pagination-input rounded form-control form-control-sm' type='text' name='page-num'>" +
                    '</label>' +
                    '页'
                    :
                    '共 ' + settings.pageNums + ' 页'
            ) +
            '</div>'
        )
        .on("keydown", "input[name=page-num]", function (e) {
            if (e.keyCode === 13) {
                // 输入回车
                settings.onPageChange($(this).val(), settings.pageSize)
            }
        })
        .on("keydown", "input[name=page-size]", function (e) {
            if (e.keyCode === 13) {
                settings.onPageChange(settings.currentPage, $(this).val())
            }
        })
        .on("click", ".page-num", function () {
            settings.onPageChange($(this).html(), settings.pageSize)
        })
        .on("click", ".page-next", function () {
            if ($(this).attr("class").split(" ").indexOf("disabled") < 0) {
                settings.onPageChange(settings.currentPage + 1, settings.pageSize)
            }
        })
        .on("click", ".page-previous", function () {
            if ($(this).attr("class").split(" ").indexOf("disabled") < 0) {
                settings.onPageChange(settings.currentPage - 1, settings.pageSize)
            }
        })
        .on("keyup", "input[name=page-num] input[name=page-size]", function () {
            this.value = this.value.replace(/\D/, "")
        })

    return this
}
