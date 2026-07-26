from django.urls import path
from apps.conferences.views import events_api, events_today_api

urlpatterns = [
    path('list/',  events_api,       name='events_list_api'),
    path('today/', events_today_api, name='events_today_api'),
]
