from django.urls import path

from . import views

app_name = "detect"

urlpatterns = [
    path('api/stream/<int:key>', views.stream_detected, name="stream"),
]
