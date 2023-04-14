import threading
import time

import cv2
import numpy as np
import zmq
from django.core.files.base import ContentFile

from helmet_detect_system import settings
from monitor.models import Monitor
from .models import Result
from .yolo import ModelYOLOv8, PERSON, HEAD_WITH_HELMET, HEAD_WITHOUT_HELMET
from .message import PULL_PORT

_data = {}
_running = True
_values = threading.local()


def _generate_detected_frame(monitor: Monitor):
    data = _data[monitor.pk]
    model = ModelYOLOv8()

    warning_push = zmq.Context().socket(zmq.PUSH)
    warning_push.connect(f"tcp://localhost:{PULL_PORT}")
    _values.now_person = 0
    _values.now_head_with_helmet = 0
    _values.now_head_without_helmet = 0
    _values.need_warning = False
    _values.need_save = False
    _values.next_warning_time = time.time()

    def update_now_data(cls):
        n_p = 0
        n_h_w = 0
        n_h_o = 0
        has_change = False

        for c in cls:
            if c == PERSON:
                n_p += 1
            elif c == HEAD_WITH_HELMET:
                n_h_w += 1
            elif c == HEAD_WITHOUT_HELMET:
                n_h_o += 1

        if has_change := (has_change or _values.now_person != n_p):
            _values.now_person = n_p
        if has_change := (has_change or _values.now_head_with_helmet != n_h_w):
            _values.now_head_with_helmet = n_h_w
        if has_change := (has_change or _values.now_head_without_helmet != n_h_o):
            _values.now_head_without_helmet = n_h_o
        return has_change

    def set_events(res):
        cls = res.boxes.cls
        detect_has_change = update_now_data(cls)
        has_detected = len(cls) > 0
        now = time.time()

        if (detect_has_change or now > _values.next_warning_time) and has_detected:
            _values.need_warning = _values.now_head_without_helmet > 0
            if _values.need_warning:
                _values.next_warning_time = now + settings.CONTINUOUS_MONITORING_INTERVAL
            _values.need_save = True
        else:
            _values.need_warning = _values.need_save = False

    for result in model.generate_result(monitor.source):
        if data["event"].is_set():
            break

        data["frame"] = result.plot(line_width=2, pil=True, example="测试")
        set_events(result)

        if _values.need_save:
            _, frame = cv2.imencode(settings.DETECT_IMAGE_TYPE, data["frame"])
            r = Result.objects.create(
                monitor=monitor,
                person=_values.now_person,
                head_with_helmet=_values.now_head_with_helmet,
                head_without_helmet=_values.now_head_without_helmet,
            )
            r.img.save(
                f"monitor-{monitor.pk}-{time.time()}{settings.DETECT_IMAGE_TYPE}",
                ContentFile(frame),
                save=True
            )
        if _values.need_warning:
            warning_push.send_json({"id": monitor.pk})


def start():
    """
    开始所有线程
    """
    global _running
    if not _running:
        for data in _data.values():
            data["thread"].start()
        _running = True


def remove_thread(key: int):
    """
    移除单个线程
    @param key 视频流id
    """
    if data := _data.get(key):
        if _running:
            data["event"].set()
        del data[key]


def terminate():
    """
    终止所有进程
    """
    if _running:
        for data in _data.values():
            data["event"].set()


def add_thread(monitor):
    """
    添加安全帽检测线程
    """
    if not _data.get(monitor.pk):
        thread = threading.Thread(
            name=f"M-{monitor.pk} frame generate thread",
            target=_generate_detected_frame,
            args=(monitor,),
            daemon=True
        )
        _data[monitor.pk] = {
            "frame": np.zeros([1, 1]),
            "thread": thread,
            "event": threading.Event(),
        }
        if _running:
            thread.start()


def yield_detected_frame(key):
    if data := _data.get(key):
        while data["thread"].is_alive():
            yield data["frame"]
    else:
        return []


# for m in Monitor.objects.filter(helmet_detect=True):
#     add_thread(m)
