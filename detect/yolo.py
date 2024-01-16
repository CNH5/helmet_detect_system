import abc
from ultralytics import YOLO

from helmet_detect_system import settings

PERSON = 0
HEAD_WITHOUT_HELMET = 1
HEAD_WITH_HELMET = 2
LABEL_NAMES = {
    PERSON: "人",
    HEAD_WITHOUT_HELMET: "未戴安全帽",
    HEAD_WITH_HELMET: "佩戴安全帽",
}


class ModelYOLO(abc.ABC):
    @abc.abstractmethod
    def generate_result(self, source: str, conf: float = 0.6):
        """
        生成result
        """
        raise NotImplementedError('generate_frame function needs to be implemented')

    @abc.abstractmethod
    def add_callback(self, event: str, func):
        """
        添加回调
        """
        raise NotImplementedError('add_callback function needs to be implemented')


class ModelYOLOv8(ModelYOLO):
    def __init__(self):
        self._model = YOLO(settings.MODEL_YOLOv8_PATH)

    def generate_result(self, source, conf: float = 0.6):
        for result in self._model.predict(source, conf=conf, stream=True):
            yield result

    def add_callback(self, event: str, func):
        self._model.add_callback(event, func)
