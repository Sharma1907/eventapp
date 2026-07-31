from django.urls import path
from . import views

urlpatterns = [
    path('settings/', views.conference_settings, name='conference_settings_api'),
]
