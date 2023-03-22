import threading

import cv2
import numpy as np


class DetectThread(threading.Thread):
    """
    安全帽检测检测线程
    """

    def __init__(self, frame_generate):
        super().__init__()
        self.__frame_generate = frame_generate  # 帧生成器
        self.__lock = threading.Lock()  # 读写锁
        self.__working = True  # 终止标志
        self.__frame = np.zeros([1, 1])  # 当前帧

    def display_frame(self):
        while self.__working:
            self.__lock.acquire()
            frame = self.__frame
            self.__lock.release()
            ret, img = cv2.imencode('.jpeg', frame)
            if ret:
                # 转换为byte类型的，存储在迭代器中
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + img.tobytes() + b'\r\n')

    def run(self) -> None:
        for frame in self.__frame_generate:
            if self.__working:
                self.__lock.acquire()
                self.__frame = frame
                self.__lock.release()

    def terminate(self):
        """
        终止线程
        """
        self.__working = False


class DetectThreadPool:
    """
    安全帽检测线程池
    """

    def __init__(self):
        self.__pool: dict[int:DetectThread] = {}

    def start(self):
        """
        开始所有线程
        """
        for thread in self.__pool.values():
            thread.setDaemon(True)
            thread.start()

    def stop(self, key: int):
        """
        停止单个进程
        """
        thread = self.__pool.get(key, None)
        if thread is not None:
            self.__pool.pop(key)
            thread.terminate()

    def terminate(self):
        """
        终止所有进程
        """
        for key in self.__pool.keys():
            self.__pool[key].terminate()

    def add(self, key, generate):
        """
        添加线程
        """
        if self.__pool.get(key, None) is None:
            self.__pool[key] = DetectThread(generate)

    def get(self, key):
        """
        获取线程
        """
        return self.__pool.get(key, None)
