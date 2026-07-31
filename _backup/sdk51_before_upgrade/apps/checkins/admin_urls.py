from django.urls import path
from . import admin_views

urlpatterns = [
    path('checkins/scanner/', admin_views.scanner_view,      name='checkin_scanner'),
    path('checkins/list/',    admin_views.checkin_list_view,  name='checkin_list'),
]
