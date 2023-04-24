let rangeSelect = $("select[name=range]")

let currentPage = 1
let pageSize = 5

function getStatisticsData() {
    $.ajax({
        method: "GET",
        url: getDetectStatisticsURL,
        data: {
            "range": rangeSelect.val()
        },
        success: function (data) {
            let option = detectStatisticsPie.getOption()
            option.series[0].data = [
                {name: "佩戴安全帽", value: data["head_with_helmets"]},
                {name: "未戴安全帽", value: data["head_without_helmets"]},
                {name: "人", value: data["persons"]}
            ]
            detectStatisticsPie.setOption(option)
        }
    })
}

function getNewWarningData() {
    $.ajax({
        method: "GET",
        url: "",
        data: {
            currentPage: currentPage,
            pageSize: pageSize,
            col: "head_without_helmet",
        },
        success: function (data) {
            console.log(data)
        },
        error: function (e) {
            console.log(e)
        }
    })
}

$(() => {
    getStatisticsData()
})

rangeSelect.change(function () {
    getStatisticsData()
})

weekStatisticsBar.on("click", function (params) {
    console.log(params)
})

detectStatisticsPie.on("click", function (params) {

})