from django.shortcuts import render
from .models import Monitor
from django.core.paginator import Paginator


# Create your views here.

def manage(request):
    """
    监控设备管理界面
    """
    paginator = Paginator(Monitor.objects.all().order_by("pk"), 10)
    content = {
        "monitor_list": paginator.page(1),
        "page_nums": paginator.num_pages,
    }
    return render(request, "monitor/manage.html", content)


def info(request, monitor_id: int):
    """
    监控信息界面
    """
    content = {
        "monitor": Monitor.objects.get(pk=monitor_id),
        "record": None,
    }
    return render(request, "monitor/info.html", content)
