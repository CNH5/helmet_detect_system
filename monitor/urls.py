from django.urls import path

from . import views, api

app_name = "monitor"

urlpatterns = [
    path("manage/", views.manage, name="manage"),
    path("<int:monitor_id>/info/", views.info, name="info"),
    path("insert", api.insert, name="insert"),
    path("delete", api.delete, name="delete"),
    path("info/update", api.update_info, name="update"),
    path("detect/update", api.update_detect, name="update_detect"),
    path("query", api.query, name="query"),
    path("source/exists/test", api.test_exists_source, name="exists_source_test"),
    path("source/new/test", api.test_new_source, name="new_source_test"),
    path("new/review", api.new_source_review, name="review"),
]
