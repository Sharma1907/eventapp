from django.urls import path
from . import admin_views

urlpatterns = [
    path('notifications/',      admin_views.notifications_page, name='panel_notifications'),
    path('notifications/send/', admin_views.send_notification,  name='panel_send_notification'),
]
