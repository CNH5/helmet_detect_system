import abc

from ultralytics import YOLO
from .message import pub


class ModelYOLO(abc.ABC):
    @abc.abstractmethod
    def frame_generate(self, source: str, conf: float = 0.6):
        """
        检测结果生成器
        """
        pass

    def result_save(self, predictor):
        """
        TODO:保存检测结果
        """
        pub.send_string("test")


class ModelYOLOFactory(abc.ABC):
    @classmethod
    @abc.abstractmethod
    def get(cls) -> ModelYOLO:
        pass


class ModelYOLOv8(ModelYOLO):
    def __init__(self):
        self._model = YOLO("../yolo_models/helmet_yolov8n.pt")
        self._model.names = {
            0: "人",
            1: "未戴安全帽",
            2: "佩戴安全帽"
        }
        self._model.add_callback("on_predict_batch_end", self.result_save)

    def frame_generate(self, source: str, conf: float = 0.6):
        for predictor in self._model.predict(source, conf=conf, stream=True):
            # 绘制方框
            yield predictor.plot(line_width=2, pil=True, example="测试")


class YOLOv8Factory(ModelYOLOFactory):
    @classmethod
    def get(cls):
        return ModelYOLOv8()
