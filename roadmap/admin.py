from django.contrib import admin

from .models import Artifact, CommunityCourse, Roadmap


@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ("topic", "level", "user", "xp_total", "streak", "created_at")
    list_filter = ("level",)
    search_fields = ("topic", "goal")


@admin.register(Artifact)
class ArtifactAdmin(admin.ModelAdmin):
    list_display = ("kind", "topic", "user", "created_at")
    list_filter = ("kind",)
    search_fields = ("topic",)


@admin.register(CommunityCourse)
class CommunityCourseAdmin(admin.ModelAdmin):
    list_display = ("title", "level", "learners", "rating_sum", "rating_count")
