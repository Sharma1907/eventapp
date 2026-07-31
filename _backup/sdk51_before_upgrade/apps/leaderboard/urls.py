from django.urls import path
from . import views

urlpatterns = [
    path('my/', views.my_points, name='my_points'),
    path('top/', views.leaderboard, name='leaderboard'),
]
