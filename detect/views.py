from django.http import StreamingHttpResponse
from .yolo import ModelYOLO
from .thread import DetectThreadPool

# Create your views here.

pool = DetectThreadPool()
# pool.add(1, ModelYOLO().frame_generate("0"))
pool.start()


def stream_detected(request, key=1):
    return StreamingHttpResponse(pool.get(key).display_frame(),
                                 content_type='multipart/x-mixed-replace; boundary=frame')
