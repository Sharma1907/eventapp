#!/bin/bash

echo "Starting ConfHub Backend..."

# Set port public automatically
gh codespace ports visibility 8000:public -c $CODESPACE_NAME 2>/dev/null || true

cd /workspaces/eventapp/backend
python manage.py runserver 0.0.0.0:8000
