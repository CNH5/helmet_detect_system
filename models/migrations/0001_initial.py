# Generated by Django 4.1 on 2023-03-11 06:29

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Monitor",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("create_date", models.DateTimeField(auto_now_add=True)),
                ("name", models.CharField(max_length=20)),
                ("rtsp", models.TextField()),
                ("helmet_detect", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="DetectResult",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("detect_time", models.DateTimeField(auto_now_add=True)),
                ("person", models.IntegerField(default=0)),
                ("head_without_helmet", models.IntegerField(default=0)),
                ("head_with_helmet", models.IntegerField(default=0)),
                ("img", models.ImageField(upload_to="")),
                (
                    "monitor_id",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="models.monitor"
                    ),
                ),
            ],
        ),
    ]