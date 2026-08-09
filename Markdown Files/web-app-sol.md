# ETD 2026 — Web "Connection Failed" — Complete Root Cause & Solution

---

## What the problem actually is

The app runs in two places:
- **Phone** → uses Expo tunnel (`exp.direct`) → hits ngrok → Django
- **Browser** → uses Expo tunnel (`exp.direct`) → hits ??? → Django

The browser has **three separate failure points**, all producing the same symptom: `Connection failed. Check your network.`

---

## Failure Point 1 — Wrong API URL for web

### Problem
`theme.js` had:
```javascript
export const API_URL = Platform.OS === 'web' ? CODESPACES : NGROK;
```

Web was pointing to the **Codespaces tunnel** (`cautious-eureka-jj56xxggr9vpcq9qj-8000.app.github.dev`).

GitHub Codespaces tunnel **blocks cross-origin OPTIONS preflight requests** from external origins like `exp.direct`. The browser sends a preflight before every POST — Codespaces tunnel returns `404` before Django even sees the request.

**Evidence:**
```
Status Code: 404 Not Found
x-served-by: tunnels-prod-rel-inc1-v3-cluster  ← GitHub's tunnel, not Django
```

### Fix
```bash
sed -i "s|export const API_URL  = Platform.OS === 'web' ? CODESPACES : NGROK;|export const API_URL  = NGROK; // both web + native use ngrok|" /workspaces/eventapp/mobile/src/theme.js
```

Both web and native now use ngrok. Codespaces tunnel is bypassed entirely.

---

## Failure Point 2 — ngrok interstitial page blocking CORS

### Problem
`theme.js` had:
```javascript
export const API_HEADERS = Platform.OS === 'web'
  ? BASE_HEADERS
  : { ...BASE_HEADERS, 'ngrok-skip-browser-warning': 'true' };
```

The `ngrok-skip-browser-warning` header was sent on **native only, not web**.

ngrok free tier shows an HTML interstitial warning page for browser requests that don't have this header. That HTML page has **no CORS headers**. So the browser sees:

```
No 'Access-Control-Allow-Origin' header is present on the requested resource
net::ERR_FAILED 200 (OK)   ← 200 = ngrok's HTML page, not Django
```

The `200 OK` with CORS failure is the giveaway — it's ngrok's page, not Django rejecting it.

### Fix
```bash
python3 << 'EOF'
path = '/workspaces/eventapp/mobile/src/theme.js'
with open(path) as f:
    content = f.read()

old = """export const API_HEADERS = Platform.OS === 'web'
  ? BASE_HEADERS
  : { ...BASE_HEADERS, 'ngrok-skip-browser-warning': 'true' };"""

new = """export const API_HEADERS = { ...BASE_HEADERS, 'ngrok-skip-browser-warning': 'true' };"""

content = content.replace(old, new)
with open(path, 'w') as f:
    f.write(content)
print("Fixed")
EOF
```

Now all requests (web + native) include the header. ngrok skips the interstitial and passes directly to Django.

---

## Failure Point 3 — Stale Django process not picking up settings

### Problem
Django's `CorsMiddleware` was not first in `MIDDLEWARE`:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',   # ← was first
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',            # ← was third
    ...
]
```

`SecurityMiddleware` can short-circuit requests before CORS headers are added. Even after fixing the order, the **running Django process was stale** — it hadn't reloaded the new settings. So CORS headers were missing even after the fix was applied to the file.

### Fix — middleware order
```bash
python3 << 'EOF'
path = '/workspaces/eventapp/backend/confhub/settings.py'
with open(path) as f:
    content = f.read()

old = """MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',"""

new = """MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',"""

content = content.replace(old, new)
with open(path, 'w') as f:
    f.write(content)
print("Fixed")
EOF
```

### Fix — always restart Django after settings changes
```bash
pkill -f "manage.py runserver" 2>/dev/null
sleep 1
cd /workspaces/eventapp/backend && python manage.py runserver 0.0.0.0:8000
```

**Rule: Any change to `settings.py` requires a Django restart. Hot reload does not apply to settings.**

---

## How to verify everything is working

Run this single diagnostic command:

```bash
echo "=== 1. Django ===" && \
curl -s http://localhost:8000/api/v1/auth/me/ && echo "" && \
echo "=== 2. ngrok ===" && \
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" && \
echo "=== 3. CORS ===" && \
curl -s -I -X OPTIONS \
  -H "Origin: https://j1wmlco-coder2026-8081.exp.direct" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,ngrok-skip-browser-warning" \
  http://localhost:8000/api/v1/auth/login/ | grep -i "access-control" && \
echo "=== 4. Docker ===" && \
docker compose ps --format "table {{.Name}}\t{{.Status}}" && \
echo "=== 5. API_URL ===" && \
grep "export const API_URL\|export const API_HEADERS" /workspaces/eventapp/mobile/src/theme.js
```

### All green looks like this:
```
=== 1. Django ===
{"detail":"Authentication credentials were not provided."}

=== 2. ngrok ===
https://bauble-aftermost-buffalo.ngrok-free.dev

=== 3. CORS ===
access-control-allow-origin: https://j1wmlco-coder2026-8081.exp.direct
access-control-allow-methods: DELETE, GET, OPTIONS, PATCH, POST, PUT

=== 4. Docker ===
NAME                STATUS
eventapp-db-1       Up
eventapp-redis-1    Up
eventapp-minio-1    Up

=== 5. API_URL ===
export const API_URL  = NGROK;
export const API_HEADERS = { ...BASE_HEADERS, 'ngrok-skip-browser-warning': 'true' };
```

---

## Complete restart sequence (every Codespace restart)

```bash
# Terminal 1 — Docker + Django
cd /workspaces/eventapp && docker compose up -d && sleep 3 && \
cd backend && python manage.py runserver 0.0.0.0:8000

# Terminal 2 — ngrok (required for BOTH phone and browser)
ngrok http 8000

# Terminal 3 — Expo
cd /workspaces/eventapp/mobile && \
npx expo start --tunnel --port 8081 --clear
```

Then **hard refresh browser** `Ctrl+Shift+R`.

---

## Failure diagnosis table

| Symptom | What you see in console | Root cause | Fix |
|---------|------------------------|-----------|-----|
| Connection failed on web | `OPTIONS 404` + `x-served-by: tunnels-prod-rel-inc1-v3-cluster` | API_URL pointing to Codespaces tunnel | Failure Point 1 |
| Connection failed on web | `200 OK` + CORS error | ngrok interstitial — header missing on web | Failure Point 2 |
| Connection failed on web | `OPTIONS` returns no CORS headers | Stale Django or wrong middleware order | Failure Point 3 |
| Works on phone, fails on browser | Any CORS error | All three above combined | All three fixes |
| Works then breaks after restart | Same errors return | Django process killed on restart | Restart sequence |

---

## Permanent state of the three fixed files

### `mobile/src/theme.js` — lines 95–110
```javascript
const NGROK      = 'https://bauble-aftermost-buffalo.ngrok-free.dev/api/v1';
const CODESPACES = 'https://cautious-eureka-jj56xxggr9vpcq9qj-8000.app.github.dev/api/v1';

// Codespaces tunnel blocks cross-origin OPTIONS — ngrok works for both
export const API_URL  = NGROK;
export const API_ROOT = API_URL.replace(/\/api\/v1$/, '');

// ngrok-skip-browser-warning required on web too — without it ngrok
// serves an HTML interstitial page with no CORS headers
export const API_HEADERS = { ...BASE_HEADERS, 'ngrok-skip-browser-warning': 'true' };
```

### `backend/confhub/settings.py` — MIDDLEWARE
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # ← MUST be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    ...
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
```