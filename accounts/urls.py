from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.register),
    path("login/", views.login),
    path("google/", views.google_login),
    path("me/", views.me),
    path("byok/", views.save_byok),
    path("premium/", views.set_premium),
    path("logout/", views.logout),
]
