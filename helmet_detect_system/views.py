from django.shortcuts import render
from detect import statistics as detect_statistics
from monitor.models import Info as MonitorInfo


def overview(request):
    monitors = MonitorInfo.objects.all()
    return render(request, "overview.html", {
        "detect_data_week": detect_statistics.week(),
        "monitor_data": {
            "count": monitors.count(),
            "open_detect": monitors.filter(helmet_detect=True).count(),
        },
    })
