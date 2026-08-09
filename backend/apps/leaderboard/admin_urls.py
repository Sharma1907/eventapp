from django.urls import path
from . import admin_views

urlpatterns = [
    path('leaderboard/', admin_views.leaderboard_panel, name='leaderboard_panel'),
]
