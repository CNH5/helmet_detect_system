from django.http import StreamingHttpResponse
from .thread import detect_thread_pool


# Create your views here.
def stream_detected(request, key=1):
    return StreamingHttpResponse(detect_thread_pool.get(key).display_frame(),
                                 content_type='multipart/x-mixed-replace; boundary=frame')
