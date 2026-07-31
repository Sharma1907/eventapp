from django.urls import path
from . import admin_views

urlpatterns = [
    path('notifications/',                  admin_views.notifications_page,    name='panel_notifications'),
    path('notifications/send/',             admin_views.send_notification,     name='panel_send_notification'),
    path('notifications/<uuid:pk>/edit/',   admin_views.notification_edit,     name='notification_edit'),
    path('notifications/<uuid:pk>/delete/', admin_views.notification_delete,   name='notification_delete'),
]
