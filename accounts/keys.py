"""Gemini API key resolution + free-tier usage metering.

Priority: user's own key (BYOK) > platform key (premium unlimited,
free users capped at FREE_DAILY_LIMIT calls/day).
"""
from datetime import date
import os

from .models import Profile


class UsageLimitExceeded(Exception):
    pass


def resolve_gemini_key(user):
    """Return an API key for this request's user (may be None for anonymous).

    Raises UsageLimitExceeded when a free user burns their daily quota.
    """
    byok = None
    profile = None
    if user is not None and getattr(user, "is_authenticated", False):
        profile, _ = Profile.objects.get_or_create(user=user)
        byok = (profile.gemini_api_key or "").strip()

    if byok:
        return byok

    platform_key = os.getenv("GEMINI_API_KEY")
    if not platform_key:
        return None

    if profile and not profile.is_premium:
        today = date.today()
        if profile.usage_date != today:
            profile.usage_date = today
            profile.usage_count = 0
        if profile.usage_count >= Profile.FREE_DAILY_LIMIT:
            raise UsageLimitExceeded()
        profile.usage_count += 1
        profile.save(update_fields=["usage_date", "usage_count"])

    return platform_key
