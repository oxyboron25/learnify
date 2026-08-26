from django.urls import include, path

urlpatterns = [
    path("api/roadmap/", include("roadmap.urls")),
]
