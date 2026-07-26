# Starting ConfHub After Codespace Restart

## The Reality of Codespaces
```
Every time Codespace restarts:
  - Docker containers stopped ✓ (auto-restart possible)
  - Django stopped ✓ (must restart)
  - Expo stopped ✓ (must restart)  
  - ngrok stopped ✓ (NEW URL every time on free plan)
  - Database data ✓ (SQLite file preserved — data safe)
  - Code changes ✓ (all saved — nothing lost)
```

---

## The Complete Startup Sequence

### Terminal 1 — Docker Services
```bash
cd /workspaces/eventapp
docker compose up -d

# Verify all 3 are running:
docker compose ps
# Should show: postgres, redis, minio all "Up"
```

### Terminal 2 — Django API
```bash
cd /workspaces/eventapp/backend
python manage.py runserver 0.0.0.0:8000
```

### Terminal 3 — ngrok Tunnel
```bash
ngrok http 8000

# Copy the new https URL shown:
# Forwarding: https://XXXX-XXX-XX-XX-XX.ngrok-free.app -> http://localhost:8000
```

### Terminal 4 — Expo Mobile
```bash
cd /workspaces/eventapp/mobile
npx expo start --tunnel --port 8081 --clear
```

---

## After Starting — Update the API URL

Since ngrok gives a **new URL every restart**, you have two options:

### Option A — Use Debug Screen (No code change)
```
1. Open Expo Go on phone
2. Scan the QR code from Terminal 4
3. App opens on Debug Screen
4. Enter your new ngrok URL:
   https://XXXX-XXX-XX-XX-XX.ngrok-free.app
5. Tap Test Connection → green ✅
6. Proceed to login
```

### Option B — Update App.js (Permanent for session)
```javascript
// Find this line in App.js and update:
const API = 'https://NEW-NGROK-URL.ngrok-free.app/api/v1';
```

---

## Make It Easier — Startup Script

Create this once, use it every time:

```bash
# Create the script
cat > /workspaces/eventapp/start.sh << 'EOF'
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
EOF

# Make it executable
chmod +x /workspaces/eventapp/start.sh
```

**Run it every time:**
```bash
cd /workspaces/eventapp
./start.sh

# Then in a new terminal:
cd /workspaces/eventapp/mobile
npx expo start --tunnel --port 8081 --clear
```

The script **automatically prints your ngrok URL** so you don't have to dig for it.

---

## Cheat Sheet (Save This)

```
┌─────────────────────────────────────────────┐
│         CONFHUB STARTUP CHECKLIST           │
├─────────────────────────────────────────────┤
│ □ 1. Open Codespace                         │
│ □ 2. Run: ./start.sh                        │
│ □ 3. Copy ngrok URL from output             │
│ □ 4. New terminal:                          │
│      cd mobile                              │
│      npx expo start --tunnel --clear        │
│ □ 5. Scan QR with Expo Go                   │
│ □ 6. Enter ngrok URL in Debug Screen        │
│ □ 7. Login with test credentials            │
└─────────────────────────────────────────────┘

Test Credentials:
  participant@test.com / Test@1234
  speaker@test.com     / Test@1234
  Admin panel: /panel/login/
  admin@confhub.com    / Admin@1234
```

---

## Optional — Skip ngrok URL Entry Every Time

If you want the app to **auto-detect** the ngrok URL, I can add a feature where:
- App fetches current ngrok URL from `localhost:4040/api/tunnels` 
- Auto-sets the API base URL on startup
- No manual entry needed

Just say **"add auto ngrok detection"** and I'll update App.js for it.

---

**Want me to also set up Django to auto-restart on Codespace wake using `.devcontainer` config?** That way Docker + Django start automatically when the Codespace opens — you'd only need to run ngrok and Expo manually.