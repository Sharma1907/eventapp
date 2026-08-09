#!/bin/bash
set -e

echo "=== ETD 2026 Auto-Start ==="

# 1. Docker services
echo "[1/2] Starting Docker services..."
cd /workspaces/eventapp
docker compose up -d
echo "      Docker: OK"

# 2. Django (background)
echo "[2/2] Starting Django..."
cd /workspaces/eventapp/backend
nohup python manage.py runserver 0.0.0.0:8000 > /tmp/django.log 2>&1 &
echo $! > /tmp/django.pid
echo "      Django: OK (pid $(cat /tmp/django.pid))"

echo ""
echo "=== Ready ==="
echo "  API:    http://localhost:8000"
echo "  Panel:  http://localhost:8000/panel/"
echo ""
echo "  Still needed manually:"
echo "  → cd /workspaces/eventapp/mobile && npx expo start --tunnel --port 8081 --clear"
echo "  → (optional) ngrok http 8000"
