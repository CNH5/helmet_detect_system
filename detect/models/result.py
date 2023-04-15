from django.db import models


# Create your models here.
class Result(models.Model):
    monitor = models.ForeignKey("monitor.Info", on_delete=models.CASCADE)
    detect_time = models.DateTimeField(auto_now_add=True)
    person = models.IntegerField(default=0)
    head_without_helmet = models.IntegerField(default=0)
    head_with_helmet = models.IntegerField(default=0)
    img = models.ImageField(null=True, upload_to="images/detected/%Y/%m/%d/")

    def to_json(self):
        return {
            "id": self.id,
            "person": self.person,
            "detect_time": self.detect_time.strftime("%Y年%m月%d日 %H:%M:%S"),
            "head_without_helmet": self.head_without_helmet,
            "head_with_helmet": self.head_with_helmet,
            "img": self.img.name,
        }
