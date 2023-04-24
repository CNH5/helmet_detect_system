from django.urls import path

from . import views, api

app_name = "detect"

urlpatterns = [
    path('api/warning/listen', api.warning_listen, name="warning-listen"),
    path('api/warning/unhandled', api.unhandled_warning_num, name="unhandled-warning"),
    path('api/detect/<int:monitor_id>/results/query', api.query_monitor_results, name="monitor-results"),
    path('api/detect/results/query', api.query_results, name="results-query"),
    path('api/detect/results/delete', api.delete_results, name="results-delete"),
    path('api/detect/switch/modification', api.detection_switch_modification, name="switch-modification"),
    path('api/detect/statistics', api.statistics, name="statistics"),

    path("detect/results", views.results, name="results")
]
