import zmq
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db import transaction
from django.db.models import Sum, Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST

from monitor.models import Info as MonitorInfo
from .message import SUB_POOL
from .models import Result
from . import detect_pool


@require_GET
def warning_listen(request):
    warning_monitor = []
    sub = SUB_POOL.get(request.session.session_key, None)
    if sub:
        sub = sub["sub"]
        while True:
            try:
                data = sub.recv_json(zmq.NOBLOCK)
                warning_monitor.append(data["id"])
            except zmq.ZMQError:
                # 收不到警报了
                break
    return JsonResponse(
        [{"id": m.pk, "name": m.name} for m in MonitorInfo.objects.filter(pk__in=warning_monitor)],
        safe=False
    )


@require_GET
def unhandled_warning_num(_):
    return JsonResponse(MonitorInfo.objects.filter(message_count__gte=0).aggregate(count=Sum('message_count')))


@require_GET
def query_detect_record(request):
    q = None
    if monitor_id := request.GET.get("monitor"):
        q = Q(monitor_id=monitor_id)
    if st := request.GET.get("st"):
        q1 = Q(detect_time__gte=st)
        q = (q & q1) if q else q1
    if et := request.GET.get("et"):
        q1 = Q(detect_time__lte=et)
        q = (q & q1) if q else q1
    if (col := request.GET.get("col")) in ["person", "head_without_helmet", "head_with_helmet"]:
        q1 = Q(**{col + "__gt": 0})
        q = (q & q1) if q else q1

    if request.GET.get("ascendingOrder") in ["True", "true", 1, "1", True]:
        order = "-detect_time"
    else:
        order = "detect_time"

    if q:
        # 很奇怪，all()和filter()不能拆开用...
        result_list = Result.objects.all().filter(q).order_by(order)
    else:
        result_list = Result.objects.all().order_by(order)

    current_page = request.GET.get("currentPage", 1)
    paginator = Paginator(result_list, request.GET.get("pageSize", 10))
    try:
        result_list = paginator.page(current_page)
    except PageNotAnInteger:
        current_page = 1
        result_list = paginator.page(current_page)
    except EmptyPage:
        current_page = paginator.num_pages
        result_list = paginator.page(current_page)

    return JsonResponse({
        "resultList": [result.to_json() for result in result_list],
        "currentPage": int(current_page),
        "pageNums": paginator.num_pages,
    })


@require_POST
def delete_results(request):
    id_list = request.POST.getlist("idList", [])
    results = Result.objects.filter(id__in=id_list)
    for result in results:
        result.img.delete(save=False)
    n, _ = results.delete()
    return JsonResponse({"msg": f"删除了 {n} 条数据"})


@require_POST
@transaction.atomic
def detection_switch_modification(request):
    id_list = request.POST.getlist("idList", [])
    detect = request.POST.get("detect") in ["true", "True", True, 1]
    modified_monitor = MonitorInfo.objects.all().filter(id__in=id_list)
    if (n := modified_monitor.update(helmet_detect=detect)) > 0:
        for m in modified_monitor:
            if detect:
                detect_pool.add_thread(m)
            else:
                detect_pool.remove_thread(m.pk)
    return JsonResponse({"msg": f"修改了 {n} 条数据"})
