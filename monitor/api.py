import json
import time

import cv2
import jwt
from django.conf import settings
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.db.models import Q
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_POST, require_GET
from jwt import InvalidSignatureError

from detect.thread import detect_thread_pool
from . import utils
from .forms import *

from .models import Monitor
from .validators import integer_pattern


def token_invalid(data, request):
    # 判断token是否无效
    return data["exp"] < time.time() or data["session"] != request.session.session_key


@require_POST
def insert(request):
    """
    添加监控设备
    """
    form = InfoForm(request.POST)
    if not form.is_valid():
        return JsonResponse({
            "code": 403,
            "msg": form.errors
        })
    data = form.cleaned_data
    monitor = Monitor(
        name=data.get("name"),
        source=data.get("source"),
        helmet_detect=data.get("detect")
    )
    monitor.save()
    return JsonResponse({
        "code": 200,
        "msg": "监控设备添加成功!"
    })


@require_POST
def delete(request):
    """
    删除监控设备
    """
    form = DeleteForm(request.POST)
    if not form.is_valid():
        return JsonResponse({
            "code": 403,
            "msg": form.errors
        })
    data = form.cleaned_data
    monitors = Monitor.objects.filter(pk__in=data.get("pk_list"))
    if (n := monitors.delete()) > 0:
        for monitor in monitors:
            detect_thread_pool.remove_thread(monitor.pk)
    return JsonResponse({"msg": f"删除了 {n} 条数据"})


@require_POST
def update_info(request, monitor_id: int):
    """
    修改监控设备信息
    """
    form = InfoForm(request.POST)
    if not form.is_valid():
        return JsonResponse({
            "code": 403,
            "msg": form.errors
        })

    data = form.cleaned_data
    monitor = Monitor.objects.get(pk=monitor_id)
    monitor.name = data.get("name")
    monitor.source = data.get("source")
    monitor.helmet_detect = data.get("detect")
    monitor.save()
    return JsonResponse({
        "code": 200,
        "msg": "监控信息修改成功!"
    })


@require_POST
def update_detect(request):
    """
    修改监控检测状态
    """
    form = DetectUpdateForm(request.POST)
    if not form.is_valid():
        return JsonResponse({
            "code": 403,
            "msg": form.errors
        })
    data = form.cleaned_data
    pk_list = data.get("pk_list")
    detect = data.get("detect")

    monitors = Monitor.objects.filter(
        pk__in=pk_list,
        helmet_detect=not detect
    )

    # 开启或停止检测
    if (n := monitors.update(helmet_detect=detect)) > 0:
        for monitor in monitors:
            if detect:
                detect_thread_pool.add_thread(monitor.pk, monitor.source)
            else:
                detect_thread_pool.remove_thread(monitor.pk)
    return JsonResponse({
        "code": 200,
        "msg": f"修改了 {n} 条数据"
    })


def load_filter(query_filter: list[dict]) -> Q:
    q = Q(pk__gt=0)
    for f in query_filter:
        op = f.get("operator", None)
        col = f.get("col", None)
        fp = f.get("filter", None)
        val = f.get("value", None)
        if op and col and fp and val:
            operator = (lambda x, y: x & y) if op == "and" else (lambda x, y: x | y)
            if col == "name" or col == "source":
                if fp == "not_contain":
                    q = operator(q, ~Q(**{col + "__contains": val}))
                elif fp == "pattern":
                    q = operator(q, Q(**{col + "__regex": val}))
                elif fp == "equal":
                    q = operator(q, Q(**{col + "__exact": val}))
                elif fp == "not_equal":
                    q = operator(q, ~Q(**{col + "__exact": val}))
                else:
                    q = operator(q, Q(**{col + "__contains": val}))
            if col == "create_date" or col == "pk":
                if fp == "≠":
                    q = operator(q, ~Q(**{col + "__exact": val}))
                elif fp == ">":
                    q = operator(q, Q(**{col + "__gt": val}))
                elif fp == "<":
                    q = operator(q, Q(**{col + "__lt": val}))
                elif fp == "≥":
                    q = operator(q, Q(**{col + "__gte": val}))
                elif fp == "≤":
                    q = operator(q, Q(**{col + "__lte": val}))
                else:
                    q = operator(q, Q(**{col + "__exact": val}))
            elif col == "detect":
                q = operator(q, Q(helmet_detect=val))
    return q


@require_GET
def query(request):
    """
    查询监控设备
    """
    current_page = request.GET.get("currentPage", 1)
    page_size = request.GET.get("pageSize", 10)
    order = request.GET.get("order", "-pk")
    query_filter = json.loads(request.GET.get("filter", "[]"))
    query_filter = load_filter(query_filter)

    monitor_list = Monitor.objects.filter(query_filter).order_by(order)
    paginator = Paginator(monitor_list, page_size)
    try:
        monitor_list = paginator.page(current_page)
    except PageNotAnInteger:
        current_page = 1
        monitor_list = paginator.page(current_page)
    except EmptyPage:
        current_page = paginator.num_pages
        monitor_list = paginator.page(current_page)

    content = {
        "monitorList": [monitor.to_json() for monitor in monitor_list],
        "currentPage": int(current_page),
        "pageNums": paginator.num_pages,
    }
    return JsonResponse(content)


@require_GET
def test_exists_source(request):
    monitor = Monitor.objects.get(pk=int(request.GET.get("pk", 0)))
    source = int(monitor.source) if integer_pattern.match(monitor.source) else monitor.source
    return JsonResponse({"connected": cv2.VideoCapture(source, cv2.CAP_DSHOW).isOpened()})


@require_GET
def test_new_source(request):
    source = request.GET.get("source", "")
    if integer_pattern.match(source):
        source = int(source)
    if cv2.VideoCapture(source, cv2.CAP_DSHOW).isOpened():
        response = {
            "connected": True,
            "token": jwt.encode({
                "source": source,
                "session": request.session.session_key,
                "exp": time.time() + 1200  # 20分钟过期
            }, key=settings.SECRET_KEY, algorithm="HS256"
            ),
        }
    else:
        response = {"connected": False}
    return JsonResponse(response)


@require_GET
def new_source_review(request):
    token = request.GET.get("token")
    try:
        data = jwt.decode(token, key=settings.SECRET_KEY, algorithms="HS256")
        if token_invalid(data, request):
            return redirect("/static/img/403.png")

        source = cv2.VideoCapture(data["source"], cv2.CAP_DSHOW)
        if source.isOpened():
            return StreamingHttpResponse(
                utils.display_frame(source),
                content_type='multipart/x-mixed-replace; boundary=frame'
            )
        else:
            return redirect("/static/img/404.jpeg")
    except InvalidSignatureError:
        return redirect("/static/img/403.png")
