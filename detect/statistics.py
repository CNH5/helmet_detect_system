import datetime

from django.db.models import Sum

from .models import Result


def week():
    dd = datetime.timedelta(days=1)
    ds = datetime.date.today()
    de = ds + dd
    data = {
        "dates": [],
        "persons": [],
        "head_with_helmets": [],
        "head_without_helmets": [],
    }

    for _ in range(7):
        ss = ds.strftime("%Y-%m-%d")
        se = de.strftime("%Y-%m-%d")
        qs = Result.objects.filter(detect_time__gt=ss, detect_time__lt=se)
        data["dates"].append(ss)
        data["persons"].append(qs.aggregate(ps=Sum("person"))["ps"] or 0)
        data["head_without_helmets"].append(qs.aggregate(hwo=Sum('head_without_helmet'))["hwo"] or 0)
        data["head_with_helmets"].append(qs.aggregate(hw=Sum("head_with_helmet"))["hw"] or 0)
        ds, de = ds - dd, ds

    data["dates"] = list(reversed(data["dates"]))
    data["persons"] = list(reversed(data["persons"]))
    data["head_with_helmets"] = list(reversed(data["head_with_helmets"]))
    data["head_without_helmets"] = list(reversed(data["head_without_helmets"]))
    return data
