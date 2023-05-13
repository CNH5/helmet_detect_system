import json
import time

import cv2
import jwt
from django.conf import settings
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_POST, require_GET
from jwt import InvalidSignatureError

from detect import detect_pool
from . import utils
from .forms import *

from .models import MonitorInfo, MultiViewLayout
from .validators import INTEGER_PATTERN


def token_invalid(data, request):
    # 判断token是否无效
    return data["exp"] < time.time() or data["session"] != request.session.session_key


@require_POST
@transaction.atomic
def insert_monitor(request):
    """
    添加监控设备
    """
    form = MonitorInsertForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"code": 403, "msg": form.errors})
    data = form.cleaned_data
    monitor = MonitorInfo.objects.create(
        name=data.get("name"),
        source=data.get("source"),
        helmet_detect=data.get("detect")
    )
    if data.get("detect"):
        detect_pool.add_thread(monitor)
    return JsonResponse({"code": 200, "msg": "监控设备添加成功!"})


@require_POST
def delete_monitor(request):
    """
    删除监控设备
    """
    form = DeleteForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"code": 403, "msg": form.errors})
    data = form.cleaned_data
    monitors = MonitorInfo.objects.filter(pk__in=data.get("pk_list"))
    n, _ = monitors.delete()
    if n > 0:
        for monitor in monitors:
            detect_pool.remove_thread(monitor.pk)
    return JsonResponse({"msg": f"删除了 {n} 条数据"})


@require_POST
def update_info(request, monitor_id: int):
    """
    修改监控设备信息
    """
    form = InfoUpdateForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"code": 403, "msg": form.errors})

    data = form.cleaned_data
    monitor = MonitorInfo.objects.get(pk=monitor_id)
    monitor.name = data.get("name")
    monitor.source = data.get("source")
    monitor.save()
    return JsonResponse({"code": 200, "msg": "监控信息修改成功!"})


@require_POST
@transaction.atomic
def update_detect(request):
    """
    修改监控检测状态
    """
    form = DetectUpdateForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"code": 403, "msg": form.errors})
    data = form.cleaned_data
    pk_list = data.get("pk_list")
    detect = data.get("detect")

    monitors = []
    for monitor in MonitorInfo.objects.all().filter(pk__in=pk_list, helmet_detect=not detect):
        monitors.append(monitor)
        monitor.helmet_detect = detect
        if detect:
            detect_pool.add_thread(monitor)
        else:
            detect_pool.remove_thread(monitor.pk)

    n = MonitorInfo.objects.bulk_update(monitors, ["helmet_detect"])

    return JsonResponse({"code": 200, "msg": f"修改了 {n} 条数据"})


def load_filter(request) -> Q:
    q = None
    for f in json.loads(request.GET.get("filter", "[]")):
        if f.get("col") and f.get("operation") and f.get("value"):
            if f["col"] in ["name", "source"]:
                if f["operation"] not in ["contains", "regex", "exact"]:
                    f["operation"] = "contains"
            elif f["col"] in ["create_date", "pk", "id"]:
                if f["operation"] not in ["exact", "gt", "lt", "gte", "lte", ""]:
                    f["operation"] = "exact"
            elif f["col"] == "detect":
                f["operation"] = ""
            else:
                continue
            key = f["col"] + (("__" + f["operation"]) if f["operation"] != "" else "")
            qi = Q(**{key: f["value"]})
            if f.get("not"):
                qi = ~qi
            q = (q & qi if f["operator"] == "and" else q | qi) if q else qi
    return q


@require_GET
def query(request):
    """
    查询监控设备
    """
    current_page = request.GET.get("currentPage", 1)
    order = request.GET.get("orderCol", "create_date")
    if request.GET.get("ascendingOrder") in ["True", "true", 1, "1", True]:
        order = "-" + order
    query_filter = load_filter(request)
    if query_filter:
        monitor_list = MonitorInfo.objects.filter(query_filter).order_by(order)
    else:
        monitor_list = MonitorInfo.objects.order_by(order)

    # 分页
    paginator = Paginator(monitor_list, request.GET.get("pageSize", 10))
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
def test_source(_, monitor_id):
    monitor = MonitorInfo.objects.get(pk=monitor_id)
    source = int(monitor.source) if INTEGER_PATTERN.match(monitor.source) else monitor.source
    return JsonResponse({"connected": cv2.VideoCapture(source, cv2.CAP_DSHOW).isOpened()})


@require_GET
def test_new_source(request):
    source = request.GET.get("source", "")
    if INTEGER_PATTERN.match(source):
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


@require_GET
def review_source(_, monitor_id):
    def display_frame():
        cap = None
        while True:
            if (frame := detect_pool.get_detected_frame(monitor_id)) is None:
                if cap is None:
                    m = MonitorInfo.objects.filter(id=monitor_id)
                    if m.exists():
                        m = m[0]
                        source = int(m.source) if INTEGER_PATTERN.match(m.source) else m.source
                        cap = cv2.VideoCapture(source)
                    else:
                        return redirect("/static/img/404.jpeg")
                ret, frame = cap.read()
                if not ret:
                    break
            ret, img = cv2.imencode('.jpeg', frame)
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + img.tobytes() + b'\r\n')

    return StreamingHttpResponse(display_frame(), content_type='multipart/x-mixed-replace; boundary=frame')


@require_POST
def update_layout_item(request):
    layout = MultiViewLayout.objects.filter(id=request.COOKIES.get("layout"))
    if layout.count() == 0:
        return JsonResponse({
            "code": 403,
            "msg": "布局id有误，请尝试清除cookie",
        })
    else:
        layout = layout[0]
    items = eval(layout.items)
    items[int(request.POST.get("index"))] = int(request.POST.get("item"))
    layout.items = str(items)
    layout.save()
    return JsonResponse({"code": 200, "msg": "布局内容设置成功", })


@require_POST
def update_layout_info(request):
    form = LayoutInfoForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"code": 403, "msg": form.errors})
    data = form.cleaned_data

    layout = MultiViewLayout.objects.get(id=data.get("id"))

    rows = data.get("rows")
    cols = data.get("cols")
    items = eval(layout.items)

    n = rows * cols
    if n > len(items):
        items += [0] * (n - len(items))
    elif n < len(items):
        items = list(filter(lambda x: x > 0, items))
        if len(items) < n:
            items += [0] * (n - len(items))
        elif len(items) > n:
            items = items[:n]

    layout.name = data.get("name")
    layout.rows = rows
    layout.cols = cols
    layout.items = str(items)
    n = layout.save()
    return JsonResponse({"code": 200, "msg": f"修改了{n}条数据"})


@require_POST
def create_layout(request):
    form = LayoutInfoForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"code": 403, "msg": form.errors})
    data = form.cleaned_data
    layout = MultiViewLayout.objects.create(
        name=data.get("name"),
        rows=data.get("rows"),
        cols=data.get("cols"),
        items=str([0] * data.get("rows") * data.get("cols"))
    )
    return JsonResponse({"code": 200, "layout": layout.id, "msg": "添加布局成功"})


@require_GET
def query_layout(request):
    current_page = request.GET.get("currentPage", 1)
    layouts = MultiViewLayout.objects.values("id", "name", "cols", "rows")

    if (name := request.GET.get("name")) != "":
        layouts = layouts.filter(name__regex=name)
    if (rows := request.GET.get("rows")) != "":
        layouts = layouts.filter(rows=rows)
    if (cols := request.GET.get("cols")) != "":
        layouts = layouts.filter(cols=cols)

    paginator = Paginator(layouts, request.GET.get("pageSize", 10))
    try:
        layouts = paginator.page(current_page)
    except PageNotAnInteger:
        current_page = 1
        layouts = paginator.page(current_page)
    except EmptyPage:
        current_page = paginator.num_pages
        layouts = paginator.page(current_page)

    return JsonResponse({
        "layoutList": [layout for layout in layouts],
        "currentPage": int(current_page),
        "pageNums": paginator.num_pages,
    })


@require_POST
def delete_layout(request):
    layouts_id = request.POST.getlist("layouts", [])
    n = MultiViewLayout.objects.filter(id__in=layouts_id).delete()
    return JsonResponse({"code": 200, "msg": f"删除了 {n} 条数据"})
