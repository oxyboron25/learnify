from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    fields = ("provider", "avatar_url", "is_premium", "gemini_api_key",
              "usage_date", "usage_count")


class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline,)
    list_display = ("username", "email", "first_name", "is_staff")
    list_filter = ("is_staff", "is_active")


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "provider", "is_premium", "has_byok", "usage_count", "usage_date")
    list_filter = ("provider", "is_premium")
    search_fields = ("user__username", "user__email")

    @admin.display(boolean=True)
    def has_byok(self, obj):
        return bool(obj.gemini_api_key)
