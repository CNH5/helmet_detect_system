import datetime

import zmq
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db import transaction
from django.db.models import Sum, Q, F
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST

from monitor.models import MonitorInfo
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
                warning_monitor.append(data["monitor_id"])
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
def query_monitor_results(request, monitor_id: int):
    dq = Q(monitor_id=monitor_id)
    if st := request.GET.get("st"):
        dq &= Q(detect_time__gte=st)
    if et := request.GET.get("et"):
        dq &= Q(detect_time__lte=et)
    if (col := request.GET.get("col")) in ["person", "head_without_helmet", "head_with_helmet"]:
        dq &= Q(**{col + "__gt": 0})
    order = ("-" if request.GET.get("asc") in ["True", "true", 1, "1", True] else "") + "id"

    result_list = (
        Result.objects.all().filter(dq)
        .extra(
            select={'detect_time': "strftime('%%Y年%%m月%%d日 %%H:%%M:%%S', detect_time)"}
        )
        .values(
            "id",
            "person",
            "head_with_helmet",
            "head_without_helmet",
            "detect_time",
            "img"
        )
        .order_by(order)
    )

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
        "resultList": list(result_list),
        "currentPage": int(current_page),
        "pageNums": paginator.num_pages,
    })


def query_results(request):
    dq = Q(id__gt=0)
    if st := request.GET.get("st"):
        dq &= Q(detect_time__gte=st)
    if et := request.GET.get("et"):
        dq &= Q(detect_time__lte=et)
    if (col := request.GET.get("col")) in ["person", "head_without_helmet", "head_with_helmet"]:
        dq &= Q(**{col + "__gt": 0})
    order = ("-" if request.GET.get("asc") in ["True", "true", 1, "1", True] else "") + "id"

    result_list = (
        Result.objects.all().filter(dq)
        .extra(
            select={'detect_time': "strftime('%%Y年%%m月%%d日 %%H:%%M:%%S', detect_time)"}
        )
        .values(
            "id",
            "monitor_id",
            "person",
            "head_with_helmet",
            "head_without_helmet",
            "detect_time",
            "img"
        )
        .annotate(monitor_name=F("monitor__name"))
        .order_by(order)
    )
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
        "resultsList": list(result_list),
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


@require_GET
def statistics(request):
    r = request.GET.get("range")
    if r == "24h":
        day = datetime.date.today() - datetime.timedelta(days=1)
        qs = Result.objects.all().filter(detect_time__gt=day)
    elif r == "month":
        day = datetime.date.today() - datetime.timedelta(days=30)
        qs = Result.objects.all().filter(detect_time__gt=day)
    elif r == "all":
        qs = Result.objects.all()
    else:
        # 默认一周
        day = datetime.date.today() - datetime.timedelta(days=7)
        qs = Result.objects.all().filter(detect_time__gt=day)
    return JsonResponse({
        "persons": qs.aggregate(ps=Sum("person"))["ps"] or 0,
        "head_with_helmets": qs.aggregate(hwo=Sum('head_with_helmet'))["hwo"] or 0,
        "head_without_helmets": qs.aggregate(hw=Sum('head_without_helmet'))["hw"] or 0,
    })
