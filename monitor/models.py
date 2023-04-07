from django.db import models


# Create your models here.
class Monitor(models.Model):
    create_date = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=20, null=False)
    source = models.TextField(null=False, default="")
    helmet_detect = models.BooleanField(default=True)

    def to_json(self):
        return {
            "pk": self.pk,
            "create_date": self.create_date.strftime("%Y年%m月%d日 %H:%M:%S"),
            "name": self.name,
            "source": self.source,
            "helmet_detect": self.helmet_detect,
        }
