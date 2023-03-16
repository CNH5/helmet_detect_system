from ultralytics import YOLO
from django.http import StreamingHttpResponse
from helmet_check_system.utils.result import generator_display


def on_predict_batch_end(predictor):
    for i in range(len(predictor.results)):
        predictor.results[i].orig_img = predictor.results[i].plot(line_width=2, pil=True, example="测试")


model = YOLO("../yolo_models/helmet_yolov8n.pt")
model.names = {
    0: "人",
    1: "未戴安全帽",
    2: "佩戴安全帽"
}
model.add_callback("on_predict_batch_end", on_predict_batch_end)
# monitor_results1 = model.predict(source="rtsp://admin:sheng%40123@192.168.163.56:554", conf=0.5, stream=True)
monitor_results2 = model.predict(source="0", conf=0.5, stream=True)


def test_rtsp(request):
    return StreamingHttpResponse(generator_display(monitor_results2),
                                 content_type='multipart/x-mixed-replace; boundary=frame')
