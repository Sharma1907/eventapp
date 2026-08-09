from django.urls import path
from . import admin_views

urlpatterns = [
    path('photos/', admin_views.photos_panel, name='photos_panel'),
]
