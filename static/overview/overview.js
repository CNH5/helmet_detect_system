let rangeSelect = $("select[name=range]")

let currentPage = 1
let pageSize = 5
let types = ["head_with_helmet", "head_without_helmet", "person"]

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
    window.location = resultsPageURL + "?type=" + types[params.seriesIndex] + "&day=" + params.name + "T00:00:00"
})

detectStatisticsPie.on("click", function (params) {
    window.location = resultsPageURL + "?type=" + types[params.dataIndex] + "&range=" + rangeSelect.val()
})

monitorDataPie.on("click", function (params) {
    window.location = monitorListURL + "?detect=" + (params.dataIndex === 0)
})