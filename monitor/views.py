from django.shortcuts import render
from .models import MonitorInfo, MultiViewLayout
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
    if MultiViewLayout.objects.exists():
        layout = MultiViewLayout.objects.filter(id=request.COOKIES.get("layout"))
        layout = MultiViewLayout.objects.all()[0] if layout.count() == 0 else layout[0]
    else:
        layout = MultiViewLayout.objects.create(name="默认布局", cols=3, rows=3, items=str([0] * 9))

    monitors = []
    for i in eval(layout.items):
        m = MonitorInfo.objects.filter(id=i)
        monitors.append(m[0].to_json() if m.count() > 0 else '')

    response = render(request, "monitor/multiview.html", {
        "monitors": monitors,
        "layout": layout.to_json()
    })
    response.set_cookie("layout", layout.id, max_age=31536000)  # 很奇怪，设置expires没有效果
    return response


def create(request):
    return render(request, "monitor/create.html")
