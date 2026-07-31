from django.urls import path
from . import admin_views

urlpatterns = [
    path('sponsors/',                          admin_views.sponsors_panel, name='sponsors_panel'),
    path('sponsors/new/',                      admin_views.sponsor_create, name='sponsor_create'),
    path('sponsors/<int:sponsor_id>/edit/',    admin_views.sponsor_edit,   name='sponsor_edit'),
    path('sponsors/<int:sponsor_id>/delete/',  admin_views.sponsor_delete, name='sponsor_delete'),
]
