from django.http import JsonResponse

def index(request):
    return JsonResponse({"message": "Dashboard API is working"})
