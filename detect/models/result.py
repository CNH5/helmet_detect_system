from django.db import models


# Create your models here.
class Result(models.Model):
    monitor = models.ForeignKey("monitor.Info", on_delete=models.CASCADE)
    detect_time = models.DateTimeField(auto_now_add=True)
    person = models.IntegerField(default=0)
    head_without_helmet = models.IntegerField(default=0)
    head_with_helmet = models.IntegerField(default=0)
    img = models.ImageField(null=True, upload_to="images/detected/%Y/%m/%d/")
