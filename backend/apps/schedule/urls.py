from django.urls import path
from . import views

urlpatterns = [
    # Public / user
    path('sessions/',                                    views.session_list,            name='schedule_session_list'),
    path('sessions/<uuid:pk>/',                          views.session_detail,           name='schedule_session_detail'),
    path('sessions/<uuid:pk>/bookmark/',                 views.toggle_bookmark,          name='schedule_toggle_bookmark'),
    path('sessions/<uuid:pk>/reminder/',                 views.update_reminder,          name='schedule_update_reminder'),
    path('sessions/<uuid:pk>/feedback/',                 views.feedback_form,            name='schedule_feedback_form'),
    path('sessions/<uuid:pk>/feedback/submit/',          views.submit_feedback,          name='schedule_submit_feedback'),
    path('bookmarks/',                                   views.my_bookmarks,             name='schedule_my_bookmarks'),

    # Admin API
    path('admin/sessions/',                              views.admin_session_list,       name='schedule_admin_list'),
    path('admin/sessions/create/',                       views.admin_session_create,     name='schedule_admin_create'),
    path('admin/sessions/<uuid:pk>/update/',             views.admin_session_update,     name='schedule_admin_update'),
    path('admin/sessions/<uuid:pk>/delete/',             views.admin_session_delete,     name='schedule_admin_delete'),
    path('admin/sessions/<uuid:pk>/feedback-toggle/',    views.admin_toggle_feedback,    name='schedule_admin_feedback_toggle'),
    path('admin/sessions/<uuid:pk>/feedback-analytics/', views.admin_feedback_analytics, name='schedule_admin_feedback_analytics'),
]
