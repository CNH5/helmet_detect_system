import threading

import cv2
import numpy as np

from monitor.models import Monitor
from .yolo import ModelYOLOv8
from .message import PORT


class DetectThread(threading.Thread):
    """
    安全帽检测线程
    """

    def __init__(self, frame_generate):
        super().__init__()
        self._frame_generate = frame_generate  # 帧生成器
        self._working = True  # 终止标志
        self._frame = np.zeros([1, 1])  # 当前帧

    def display_frame(self):
        while self._working:
            ret, img = cv2.imencode('.jpeg', self._frame)
            if ret:
                # 转换为byte类型的，存储在迭代器中
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + img.tobytes() + b'\r\n')

    def run(self) -> None:
        for frame in self._frame_generate:
            if self._working:
                self._frame = frame

    def terminate(self):
        """
        终止线程
        """
        self._working = False


class DetectThreadPool:
    """
    安全帽检测线程池
    """

    def __init__(self):
        self._pool: dict[int:DetectThread] = {}
        self._running = False

    def start(self):
        """
        开始所有线程
        """
        if not self._running:
            for thread in self._pool.values():
                thread.setDaemon(True)
                thread.start()
        self._running = True

    def remove_thread(self, key: int):
        """
        移除单个进程
        @param key 视频流id
        """
        thread = self._pool.get(key, None)
        if thread is not None:
            self._pool.pop(key)
        if self._running:
            thread.terminate()

    def terminate(self):
        """
        终止所有进程
        """
        if self._running:
            for key in self._pool.keys():
                self._pool[key].terminate()

    def add_thread(self, monitor):
        """
        添加安全帽检测线程
        """
        if not self._pool.get(monitor.pk, None):
            self._pool[monitor.pk] = DetectThread(ModelYOLOv8(monitor, PORT).generate_frame())
            if self._running:
                self._pool[monitor.pk].start()

    def get(self, key):
        """
        获取线程
        @param key 视频流id
        """
        return self._pool.get(key, None)


detect_thread_pool = DetectThreadPool()
# for m in Monitor.objects.filter(helmet_detect=True):
#     detect_thread_pool.add_thread(m)
detect_thread_pool.start()
