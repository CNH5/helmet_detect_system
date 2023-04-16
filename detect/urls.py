from django.urls import path

from . import views, api

app_name = "detect"

urlpatterns = [
    path('api/warning/listen', api.warning_listen, name="warning-listen"),
    path('api/warning/unhandled', api.unhandled_warning_num, name="unhandled-warning"),
    path('api/detect/result/query', api.query_detect_record, name="results-query"),
    path('api/detect/result/delete', api.delete_results, name="results-delete"),
    path('api/detect/switch/modification', api.detection_switch_modification, name="switch-modification"),
]
