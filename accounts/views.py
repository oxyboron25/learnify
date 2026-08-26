import os

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Profile

try:
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
    HAS_GOOGLE_AUTH = True
except ImportError:
    HAS_GOOGLE_AUTH = False


def _token_response(user):
    token, _ = Token.objects.get_or_create(user=user)
    profile, _ = Profile.objects.get_or_create(user=user)
    return {"token": token.key, "user": profile.serialize()}


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = str(request.data.get("username", "")).strip()
    email = str(request.data.get("email", "")).strip()
    password = str(request.data.get("password", ""))

    if not username or not password:
        return Response({"error": "username and password are required"}, status=400)
    if len(password) < 6:
        return Response({"error": "password must be at least 6 characters"}, status=400)
    if User.objects.filter(username__iexact=username).exists():
        return Response({"error": "username already taken"}, status=400)
    if email and User.objects.filter(email__iexact=email).exists():
        return Response({"error": "email already registered"}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=str(request.data.get("first_name", "")).strip() or username,
    )
    Profile.objects.create(user=user, provider="email")
    return Response(_token_response(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = str(request.data.get("username", "")).strip()
    password = str(request.data.get("password", ""))
    if not username or not password:
        return Response({"error": "username and password are required"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        # Allow logging in with email too.
        try:
            candidate = User.objects.get(email__iexact=username)
            user = authenticate(request, username=candidate.username, password=password)
        except User.DoesNotExist:
            user = None
    if user is None:
        return Response({"error": "invalid credentials"}, status=401)
    return Response(_token_response(user))


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    """Exchange a Google ID token (from Google Identity Services) for an app token."""
    credential = str(request.data.get("credential", ""))
    if not credential:
        return Response({"error": "credential is required"}, status=400)
    if not HAS_GOOGLE_AUTH:
        return Response({"error": "google-auth library not installed on server"}, status=503)

    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    try:
        info = google_id_token.verify_oauth2_token(credential, google_requests.Request())
        if client_id and info.get("aud") != client_id:
            return Response({"error": "invalid token audience"}, status=401)
    except ValueError:
        return Response({"error": "invalid Google token"}, status=401)

    sub = info.get("sub")
    email = info.get("email", "")
    user = None
    if email:
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            pass
    if user is None and sub:
        user, created = User.objects.get_or_create(
            username=f"google_{sub}",
            defaults={
                "email": email,
                "first_name": info.get("given_name", "") or info.get("name", ""),
            },
        )
    else:
        created = False
    if user is None:
        return Response({"error": "could not resolve Google account"}, status=400)

    profile, _ = Profile.objects.get_or_create(user=user)
    if created:
        profile.provider = "google"
    profile.avatar_url = info.get("picture", profile.avatar_url)
    profile.save()

    return Response(_token_response(user))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    return Response(profile.serialize())


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_byok(request):
    """Store / clear the user's own Gemini API key (BYOK)."""
    profile, _ = Profile.objects.get_or_create(user=request.user)
    key = str(request.data.get("gemini_api_key", "")).strip()
    if key and not key.startswith("AI"):
        # Gemini keys start with "AI"; accept anything non-empty anyway but flag junk.
        if len(key) < 20:
            return Response({"error": "that does not look like a valid API key"}, status=400)
    profile.gemini_api_key = key[:200]
    profile.save(update_fields=["gemini_api_key"])
    return Response(profile.serialize())


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_premium(request):
    """Demo upgrade endpoint - in production this would follow payment webhook."""
    profile, _ = Profile.objects.get_or_create(user=request.user)
    want = bool(request.data.get("is_premium", True))
    profile.is_premium = want
    profile.save(update_fields=["is_premium"])
    return Response(profile.serialize())


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"ok": True})
