#!/bin/bash

echo "🚀 Starting ConfHub..."

# Step 1: Docker
echo "📦 Starting Docker services..."
cd /workspaces/eventapp
docker compose up -d
sleep 3
docker compose ps

# Step 2: Django in background
echo "🐍 Starting Django..."
cd /workspaces/eventapp/backend
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!
echo "Django PID: $DJANGO_PID"
sleep 2

# Step 3: ngrok in background
echo "🌐 Starting ngrok..."
ngrok http 8000 --log=stdout &
NGROK_PID=$!
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['tunnels'][0]['public_url'])
")

echo ""
echo "✅ ConfHub is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 ngrok URL: $NGROK_URL"
echo "🔧 Django:    http://localhost:8000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Enter this in your app Debug Screen:"
echo "$NGROK_URL"
echo ""
echo "Now start Expo in a new terminal:"
echo "cd /workspaces/eventapp/mobile && npx expo start --tunnel --port 8081 --clear"
