from django.urls import path
from apps.accounts import admin_views

urlpatterns = [
    # Auth
    path('',        admin_views.admin_dashboard, name='admin_dashboard'),
    path('login/',  admin_views.admin_login,     name='admin_login'),
    path('logout/', admin_views.admin_logout,    name='admin_logout'),

    # Participant import flow
    path('participants/',                   admin_views.participants_list,       name='participants_list'),
    path('participants/upload/',            admin_views.participants_upload,     name='participants_upload'),
    path('participants/preview/',           admin_views.participants_preview,    name='participants_preview'),
    path('participants/confirm/',           admin_views.participants_confirm,    name='participants_confirm'),
    path('participants/delete/<int:pk>/',   admin_views.participants_delete_row, name='participants_delete_row'),
    path('participants/edit/<uuid:pk>/',    admin_views.participant_edit,         name='participant_edit'),
    path('participants/remove/<uuid:pk>/',  admin_views.participant_delete,       name='participant_delete'),
    path('participants/template/',          admin_views.participants_template,   name='participants_template'),

    # Forgot password (public — no login_required)
    path('password-reset/',                              admin_views.password_reset_request, name='password_reset_request'),
    path('password-reset-confirm/<uidb64>/<token>/',     admin_views.password_reset_confirm, name='password_reset_confirm'),
]