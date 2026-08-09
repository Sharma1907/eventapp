#!/bin/bash
pkill -f "manage.py runserver" 2>/dev/null
sleep 1
cd /workspaces/eventapp/backend
python manage.py runserver 0.0.0.0:8000
