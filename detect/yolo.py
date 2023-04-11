import abc
import time

import cv2
import zmq
from ultralytics import YOLO
from django.core.files.base import ContentFile

from monitor.models import Monitor
from .models import Result

person = 0
head_without_helmet = 1
head_with_helmet = 2
label_names = {
    person: "人",
    head_without_helmet: "未戴安全帽",
    head_with_helmet: "佩戴安全帽"
}


class ModelYOLO(abc.ABC):
    def __init__(self, monitor, port: str = "5556"):
        self._monitor = monitor
        self._warning_push = zmq.Context().socket(zmq.PUSH)
        self._warning_push.connect(f"tcp://localhost:{port}")

    @abc.abstractmethod
    def generate_frame(self, conf: float = 0.6):
        """
        生成检测之后的帧
        """
        pass

    @abc.abstractmethod
    def save_result(self, predictor):
        """
        保存检测结果
        """
        pass

    @abc.abstractmethod
    def send_warning(self, predictor):
        """
        发送警告消息
        """
        pass


class ModelYOLOv8(ModelYOLO):
    def __init__(self, monitor, port: str = "5556"):
        super().__init__(monitor, port)
        self._model = YOLO("../yolo_models/helmet_yolov8n.pt")
        self._model.names = label_names
        self._previous_result = Result(monitor=monitor)
        self._need_warning = False
        self._warning_time = time.time()

    def _set_warning_timeout(self):
        # 设置超时时间
        self._warning_time = time.time() + 15

    def generate_frame(self, conf: float = 0.6):
        monitor = Monitor.objects.get(pk=self._monitor.pk)
        # 很奇怪，移到这里就正常了
        self._model.add_callback("on_predict_batch_end", self.save_result)
        self._model.add_callback("on_predict_batch_end", self.send_warning)
        for result in self._model.predict(monitor.source, conf=conf, stream=True):
            yield result.plot(line_width=2, pil=True, example="测试")

    def save_result(self, predictor):
        result = predictor.results[0]
        cls = result.boxes.cls
        p = self._previous_result
        if len(cls) == 0:
            self._need_warning = False
            p.person = 0
            p.head_with_helmet = 0
            p.head_without_helmet = 0
            return
        p_num, h_o_num, h_w_num = 0, 0, 0
        for c in cls:
            if c == person:
                p_num = p_num + 1
            elif c == head_without_helmet:
                h_o_num = h_o_num + 1
            elif c == head_with_helmet:
                h_w_num = h_w_num + 1
        if p_num != p.person or h_w_num != p.head_with_helmet or h_o_num != p.head_without_helmet:
            if h_o_num > 0:
                self._need_warning = True
                self._set_warning_timeout()
            # 有不同检测结果的时候才保存
            frame_jpg = cv2.imencode('.jpg', result.plot(line_width=2, pil=True, example="测试"))[1]
            self._previous_result = Result.objects.create(
                monitor=self._monitor,
                person=p_num,
                head_with_helmet=h_w_num,
                head_without_helmet=h_o_num,
            )
            self._previous_result.img.save(
                f"detect-results/{self._monitor.pk}-{time.time()}.jpg",
                ContentFile(frame_jpg),
                save=True
            )
        elif time.time() > self._warning_time and h_o_num > 0:
            # 持续检测到未佩戴安全帽
            self._need_warning = True
            self._set_warning_timeout()
        else:
            self._need_warning = False

    def send_warning(self, predictor):
        if self._need_warning:
            self._warning_push.send_json({"id": self._monitor.pk})
