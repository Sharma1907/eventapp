from django.urls import path
from . import admin_views

urlpatterns = [
    path('checkins/scanner/',            admin_views.scanner_view,             name='checkin_scanner'),
    path('checkins/list/',               admin_views.checkin_list_view,        name='checkin_list'),

    # AJAX endpoints used by scanner.html
    path('checkins/scan/',               admin_views.panel_scan,               name='checkin_panel_scan'),
    path('checkins/goodies/',            admin_views.panel_goodies,            name='checkin_panel_goodies'),
    path('checkins/stats/',              admin_views.panel_stats,              name='checkin_panel_stats'),
    path('checkins/meal-window-status/', admin_views.panel_meal_window_status, name='checkin_meal_window_status'),
    path('checkins/meal/window/',        admin_views.panel_meal_window_toggle, name='checkin_meal_window_toggle'),
    path('checkins/meal/scan/',          admin_views.panel_meal_scan,          name='checkin_meal_scan'),
]
