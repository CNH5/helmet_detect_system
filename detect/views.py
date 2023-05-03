from django.shortcuts import render
from monitor.models import MonitorInfo
from . import detect_pool

# 开启监控设备的安全帽检测
for m in MonitorInfo.objects.all().filter(helmet_detect=True):
    detect_pool.add_thread(m)


# Create your views here.
def results(request):
    return render(request, "detect/results.html")
