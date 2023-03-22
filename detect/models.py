from django.db import models

from monitor.models import Monitor


# Create your models here.
class Result(models.Model):
    monitor = models.ForeignKey(Monitor, on_delete=models.CASCADE)
    detect_time = models.DateTimeField(auto_now_add=True)
    person = models.IntegerField(default=0)
    head_without_helmet = models.IntegerField(default=0)
    head_with_helmet = models.IntegerField(default=0)
    img = models.ImageField(null=False)
