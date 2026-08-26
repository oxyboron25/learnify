from django.contrib.auth.models import User
from django.db import models
from datetime import date


class Profile(models.Model):
    PROVIDERS = ["email", "google"]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    provider = models.CharField(max_length=20, default="email")
    avatar_url = models.URLField(blank=True)
    is_premium = models.BooleanField(default=False)
    gemini_api_key = models.CharField(max_length=200, blank=True)
    usage_date = models.DateField(null=True, blank=True)
    usage_count = models.IntegerField(default=0)

    FREE_DAILY_LIMIT = 10

    def serialize(self):
        return {
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "provider": self.provider,
            "avatar_url": self.avatar_url,
            "is_premium": self.is_premium,
            "has_byok": bool(self.gemini_api_key),
            "usage_today": self.usage_count if self.usage_date == date.today() else 0,
            "free_limit": self.FREE_DAILY_LIMIT,
        }

    def __str__(self):
        return f"Profile({self.user.username})"
