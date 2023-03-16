from django.db import models


class Monitor(models.Model):
    create_date = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=20, null=False)
    source = models.TextField(null=False, default="")
    helmet_detect = models.BooleanField(default=True)
