from django.shortcuts import render
from .models import MonitorInfo
from django.core.paginator import Paginator


# Create your views here.

def manage(request):
    """
    监控设备管理界面
    """
    paginator = Paginator(MonitorInfo.objects.all().order_by("pk"), 10)
    content = {
        "monitor_list": paginator.page(1),
        "page_nums": paginator.num_pages,
    }
    return render(request, "monitor/manage.html", content)


def info(request, monitor_id: int):
    """
    监控信息界面
    """
    return render(request, "monitor/info.html", {"monitor": MonitorInfo.objects.get(pk=monitor_id)})


def multiview(request):
    if id_list := request.COOKIES.get("multiviewMonitors"):
        id_list = id_list.split("%")
    else:
        id_list = [0] * 9
    monitors = []
    for i in id_list:
        m = MonitorInfo.objects.filter(id=i)
        monitors.append(m[0].to_json() if m.count() > 0 else '')
    return render(request, "monitor/multiview.html", {
        "reviewMonitor": monitors
    })


def create(request):
    return render(request, "monitor/create.html")
