from django.db import models
from django.core.validators import MinValueValidator


# Create your models here.
class Layout(models.Model):
    name = models.CharField(
        verbose_name="布局名称",
        max_length=20,
        null=False
    )
    rows = models.PositiveIntegerField(
        verbose_name="行数",
        default=3,
        validators=[
            MinValueValidator(1),
        ]
    )
    cols = models.PositiveIntegerField(
        verbose_name="列数",
        default=3,
        validators=[
            MinValueValidator(1),
        ]
    )
    items = models.TextField(
        verbose_name="布局内容",
        null=False,
    )

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "cols": self.cols,
            "rows": self.rows
        }
