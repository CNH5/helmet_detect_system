from django.shortcuts import render


# Create your views here.
def results(request):
    return render(request, "detect/results.html")
