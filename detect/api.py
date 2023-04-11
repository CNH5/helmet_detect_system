from django.http import JsonResponse


def get_warning(request):
    return JsonResponse({
        "warning": False
    })
