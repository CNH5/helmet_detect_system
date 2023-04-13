import cv2
import zmq
from django.db.models import Sum
from django.http import JsonResponse, StreamingHttpResponse

from monitor.models import Monitor
from .message import SUB_POOL
from . import result_pool


def review_detect(_, monitor_id):
    def display_frame(frames):
        for frame in frames:
            ret, img = cv2.imencode('.jpeg', frame)
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + img.tobytes() + b'\r\n')

    detected_frames = result_pool.yield_detected_frame(monitor_id)
    return StreamingHttpResponse(display_frame(detected_frames),
                                 content_type='multipart/x-mixed-replace; boundary=frame')


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
        [{"id": m.pk, "name": m.name} for m in Monitor.objects.filter(pk__in=warning_monitor)],
        safe=False
    )


def unhandled_warning_num(_):
    return JsonResponse(Monitor.objects.filter(message_count__gte=0).aggregate(count=Sum('message_count')))
