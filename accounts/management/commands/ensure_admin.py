"""Idempotently create the Django admin superuser from .env vars."""
import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create admin superuser from ADMIN_USERNAME/ADMIN_PASSWORD/ADMIN_EMAIL env vars"

    def handle(self, *args, **options):
        username = os.getenv("ADMIN_USERNAME", "")
        email = os.getenv("ADMIN_EMAIL", "")
        password = os.getenv("ADMIN_PASSWORD", "")

        if not username:
            self.stdout.write("ADMIN_USERNAME not set - skipping superuser creation")
            return
        if not password:
            self.stdout.write(
                "ADMIN_PASSWORD not set - skipping superuser creation. "
                "Set it in .env then re-run migrate/ensure_admin."
            )
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created"))
        elif not user.is_superuser:
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' promoted"))
        else:
            self.stdout.write(f"Superuser '{username}' already exists")
