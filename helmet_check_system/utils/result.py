# 处理模型的输出
import threading

import cv2


class ThreadsafeIter:
    """
    Takes an iterator/generator and makes it thread-safe by
    serializing call to the `next` method of given iterator/generator.
    """

    def __init__(self, it):
        self.it = it
        self.lock = threading.Lock()

    def __iter__(self):
        return self

    def __next__(self):
        with self.lock:
            return self.it.__next__()


def generator_display(results):
    """
    视频流生成
    """
    for result in results:
        # 将图片进行解码
        ret, img = cv2.imencode('.jpeg', result.orig_img)
        if ret:
            # 转换为byte类型的，存储在迭代器中
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + img.tobytes() + b'\r\n')
