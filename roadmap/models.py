from django.conf import settings
from django.db import models


class Roadmap(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name="roadmaps",
    )
    topic = models.CharField(max_length=200)
    level = models.CharField(max_length=20)
    goal = models.TextField(blank=True)
    modules = models.JSONField(default=list)
    resources = models.JSONField(default=list)
    final_challenge = models.JSONField(default=dict)
    completed = models.JSONField(default=list)
    xp_total = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    last_checkin = models.DateField(null=True, blank=True)
    checkins = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "topic": self.topic,
            "level": self.level,
            "goal": self.goal,
            "modules": self.modules,
            "resources": self.resources,
            "final_challenge": self.final_challenge,
            "completed": self.completed,
            "xp_total": self.xp_total,
            "streak": self.streak,
            "checkins": self.checkins,
        }


class Artifact(models.Model):
    """Generic container for AI-generated plans, courses, guides and quizzes."""
    KINDS = ["plan", "course", "guide", "quiz"]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name="artifacts",
    )
    kind = models.CharField(max_length=20)
    topic = models.CharField(max_length=200)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "topic": self.topic,
            "data": self.data,
            "created_at": self.created_at.isoformat(),
        }


class CommunityCourse(models.Model):
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    level = models.CharField(max_length=20, default="beginner")
    modules_count = models.IntegerField(default=6)
    lessons_count = models.IntegerField(default=24)
    rating_sum = models.IntegerField(default=0)
    rating_count = models.IntegerField(default=0)
    learners = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        avg = round(self.rating_sum / self.rating_count, 1) if self.rating_count else 0
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "level": self.level,
            "modules": self.modules_count,
            "lessons": self.lessons_count,
            "rating": avg,
            "rating_count": self.rating_count,
            "learners": self.learners,
        }
