from django.urls import path
from . import views

urlpatterns = [
    path('',                     views.list_sponsors,   name='sponsors_list'),
    path('<int:sponsor_id>/',    views.sponsor_detail,  name='sponsor_detail'),
]
