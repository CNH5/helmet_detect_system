from django.urls import path, include

from . import views, api

app_name = "monitor"

_view_urlpatterns = [
    path("manage/", views.manage, name="manage"),
    path("<int:monitor_id>/info/", views.info, name="info"),
    path("multiview/", views.multiview, name="multiview"),
    path("create/", views.create, name="create"),
]

urlpatterns = [
    path("api/monitor/insert", api.insert_monitor, name="insert"),
    path("api/monitor/delete", api.delete_monitor, name="delete"),
    path("api/monitor/<int:monitor_id>/update", api.update_info, name="update"),
    path("api/monitor/detect/update", api.update_detect, name="update-detect"),
    path("api/monitor/query", api.query, name="query"),
    path("api/monitor/<int:monitor_id>/source/test", api.test_source, name="source-test"),
    path("api/monitor/<int:monitor_id>/source/review", api.review_source, name="source-review"),
    path("api/monitor/new/source/test", api.test_new_source, name="new-source-test"),
    path("api/monitor/new/review", api.new_source_review, name="new-source-review"),
    path("api/multiview/layout/item/update", api.update_layout_item, name="update-layout-item"),
    path("api/multiview/layout/info/update", api.update_layout_info, name="update-layout-info"),
    path("api/multiview/layout/info/query", api.query_layout, name="query-layout"),
    path("api/multiview/layout/delete", api.delete_layout, name="delete-layout"),
    path("api/multiview/layout/create", api.create_layout, name="create-layout"),
    path('monitor/', include(_view_urlpatterns)),
]
