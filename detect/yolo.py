from ultralytics import YOLO


class ModelYOLO:
    def __init__(self):
        self.__model = YOLO("../yolo_models/helmet_yolov8n.pt")
        self.__model.names = {
            0: "人",
            1: "未戴安全帽",
            2: "佩戴安全帽"
        }

    def frame_generate(self, source: str, conf=0.6):
        """
        获取帧生成器
        """
        for predictor in self.__model.predict(source, conf=conf, stream=True):
            # 绘制方框
            yield predictor.plot(line_width=2, pil=True, example="测试")
