from django.urls import path

from . import views, api

app_name = "detect"

urlpatterns = [
    path('api/stream/<int:key>', views.stream_detected, name="stream"),
    path('api/warning/listen', api.get_warning, name="warning-listen"),
]
