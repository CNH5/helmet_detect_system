from django.urls import path

from . import views, api

app_name = "detect"

urlpatterns = [
    path('api/warning/listen', api.warning_listen, name="warning-listen"),
    path('api/detect/<int:monitor_id>/review', api.review_detect, name="review"),
    path('api/warning/unhandled', api.unhandled_warning_num, name="unhandled-warning"),
]
