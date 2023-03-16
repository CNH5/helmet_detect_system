from django.db import models
from models.models.monitor import Monitor


class DetectResult(models.Model):
    monitor_id = models.ForeignKey(Monitor, on_delete=models.CASCADE)
    detect_time = models.DateTimeField(auto_now_add=True)
    person = models.IntegerField(default=0)
    head_without_helmet = models.IntegerField(default=0)
    head_with_helmet = models.IntegerField(default=0)
    img = models.ImageField(null=False)
