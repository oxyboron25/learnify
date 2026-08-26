from django.urls import include, path
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import ai, community, views


@api_view(["GET"])
def roadmap_list(request):
    rows = views.Roadmap.objects.all().order_by("-created_at")
    q = request.GET.get("q", "").strip()
    if q:
        rows = rows.filter(topic__icontains=q)
    return Response({
        "items": [
            {"id": r.id, "topic": r.topic, "level": r.level, "xp_total": r.xp_total,
             "modules": len(r.modules), "created_at": r.created_at.isoformat()}
            for r in rows[:50]
        ]
    })


urlpatterns = [
    path("generate/", views.generate),
    path("ask/", views.ask_doubt),
    path("list/", roadmap_list),
    path("<int:pk>/", views.detail),
    path("<int:pk>/complete/", views.complete),
    path("ai/plan/", ai.gen_plan),
    path("ai/course/", ai.gen_course),
    path("ai/guide/", ai.gen_guide),
    path("ai/quiz/", ai.gen_quiz),
    path("library/", ai.library),
    path("library/<int:pk>/", ai.library_detail),
    path("community/courses/", community.community_courses),
    path("community/courses/<int:pk>/rate/", community.rate_course),
]
