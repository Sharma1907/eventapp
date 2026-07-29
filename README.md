# Complete Project Context (Updated)

---

## PROJECT OVERVIEW
```
Product: Conference Management Platform
Event:   ETD 2026 — "ETDs in the age of AI" — IIT Delhi
Website: https://etd2026.iitd.ac.in/
Type:    Mobile App (React Native Expo) + Web Admin Panel (Django MVT)
GitHub:  Repository: eventapp | Path: /workspaces/eventapp
Dev Env: GitHub Codespaces (Ubuntu)
```

---

## COMPLETE PROJECT STRUCTURE
```
/workspaces/eventapp/
├── backend/
│   ├── confhub/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/
│   │   │   ├── models.py         ← Custom User (UUID pk, email login, role field)
│   │   │   ├── views.py          ← login, me, change_password, logout APIs
│   │   │   ├── serializers.py
│   │   │   ├── urls.py           ← API routes
│   │   │   ├── admin_urls.py     ← Admin panel routes
│   │   │   ├── admin_views.py    ← Dashboard, login, logout
│   │   │   └── backends.py       ← EmailBackend
│   │   ├── notifications/
│   │   │   ├── models.py         ← DeviceToken, Notification, UserNotification
│   │   │   ├── fcm.py            ← Expo Push API sender (NOT Firebase direct)
│   │   │   ├── views.py          ← API: register/send/my/mark-read/unread-count
│   │   │   ├── urls.py           ← API routes
│   │   │   ├── admin_views.py    ← Panel: compose + history with read counts
│   │   │   └── admin_urls.py     ← Panel routes
│   │   ├── conferences/
│   │   ├── events/
│   │   ├── photos/
│   │   ├── polls/
│   │   ├── posts/
│   │   ├── checkins/
│   │   └── leaderboard/
│   ├── credentials/
│   │   └── firebase-service-account.json  ← Firebase (for future native build)
│   ├── templates/
│   │   └── panel/
│   │       ├── base.html          ← Custom CSS admin panel (NO Bootstrap)
│   │       ├── dashboard.html
│   │       ├── login.html
│   │       └── notifications.html ← Compose + history + read count
│   ├── requirements.txt
│   ├── db.sqlite3
│   └── manage.py
├── mobile/
│   ├── App.js                     ← Root: splash → login → app + notification listeners
│   ├── src/
│   │   ├── theme.js               ← ALL colors, fonts, spacing, shadows (single source)
│   │   ├── components.js          ← Card, Badge, Avatar, StatBox, FadeIn, PulsingDot etc.
│   │   ├── MainApp.js             ← Tab container + BottomTabBar + notifications screen gate
│   │   ├── notifications.js       ← Expo push token registration + listeners
│   │   └── screens/
│   │       ├── LoginScreen.js
│   │       ├── HomeTab.js         ← Bell icon + unread badge + polls every 30s
│   │       ├── ScheduleTab.js
│   │       ├── QRScreen.js
│   │       ├── FeedScreen.js
│   │       ├── ProfileTab.js
│   │       └── NotificationsScreen.js ← List + mark read + mark all read + pull refresh
│   ├── app.json
│   ├── package.json
│   ├── index.js
│   └── node_modules/
├── docker-compose.yml
├── Makefile
├── start.sh
└── .devcontainer/
```

---

## TECH STACK
```
MOBILE:
  Framework:   React Native Expo SDK 51 (STAY ON 51 — Expo Go compatible)
  Entry:       index.js → registerRootComponent(App)
  Navigation:  Manual useState (NO expo-router, NO React Navigation)
  Language:    JavaScript only (NO TypeScript)
  State:       useState (no Zustand)
  API:         fetch() with JWT Bearer token
  Icons:       @expo/vector-icons (Ionicons)
  Gradient:    expo-linear-gradient
  Push:        expo-notifications + expo-device

BACKEND:
  Framework:   Django 4.2.9 + Django REST Framework
  Auth:        JWT via djangorestframework-simplejwt
  User model:  Custom (UUID pk, email as USERNAME_FIELD, role field)
  Database:    SQLite (dev)
  Push:        Expo Push API (https://exp.host/--/api/v2/push/send)
               NOT Firebase Admin SDK for sending
               Firebase project exists for future native builds only
  Admin panel: Custom Django MVT (NO Bootstrap, custom CSS in base.html)

INFRASTRUCTURE:
  Dev:     GitHub Codespaces
  Docker:  PostgreSQL:5432, Redis:6379, MinIO:9000
  Ports:   Django:8000, Expo:8081
  Tunnel:  ngrok → Django (new URL every restart)
           Expo tunnel → phone via Expo Go app
```

---

## STARTUP SEQUENCE (Every Codespace restart)
```bash
# Terminal 1
cd /workspaces/eventapp && docker compose up -d

# Terminal 2
cd /workspaces/eventapp/backend && python manage.py runserver 0.0.0.0:8000

# Terminal 3 — get new ngrok URL
ngrok http 8000
# Copy: https://XXXX.ngrok-free.app → update API_URL in src/theme.js

# Terminal 4
cd /workspaces/eventapp/mobile && npx expo start --tunnel --port 8081 --clear

# Or use the script:
cd /workspaces/eventapp && ./start.sh
```

---

## THEME SYSTEM — src/theme.js
```javascript
// ETD 2026 Brand Colors
COLORS.brand        = '#0333b6'   // Primary blue
COLORS.brandDark    = '#022a8f'
COLORS.brandDeep    = '#0F172A'
COLORS.accent       = '#f59e0b'   // Amber gold
COLORS.accentDark   = '#d97706'
COLORS.success      = '#10b981'
COLORS.error        = '#ef4444'

// All SHADOW values use Platform.select:
// iOS: real shadows | Android: elevation:0 + borderWidth:1

// API config also lives in theme.js:
API_URL     = 'https://bauble-aftermost-buffalo.ngrok-free.dev/api/v1'
API_HEADERS = { Content-Type, Accept, ngrok-skip-browser-warning }
```

---

## REUSABLE COMPONENTS — src/components.js
```
Card            — white surface, shadow, optional onPress
GlassCard       — frosted glass for use on dark/gradient backgrounds
Badge           — colored pill label
Avatar          — initials circle
GradientAvatar  — gradient initials circle
StatBox         — number + label (light/dark variant)
SectionHeader   — title + optional action link
Divider         — 1px horizontal line
PrimaryButton   — gradient button with loading state
IconBox         — icon inside colored rounded box
FadeIn          — animate-in wrapper (opacity + translateY)
PulsingDot      — animated live indicator dot
```

---

## MOBILE SCREENS
```
App.js (Root)
  └── SplashScreen (2.2s then → login)
  └── LoginScreen  → calls /api/v1/auth/login/ → onLogin
  └── MainApp
        └── BottomTabBar (Home / Schedule / QR / Feed / Profile)
        └── NotificationsScreen (shown over tabs when bell tapped)
              ├── Fetches /api/v1/notifications/my/
              ├── Pull to refresh
              ├── Tap to mark read → /api/v1/notifications/mark-read/
              └── Mark all read → /api/v1/notifications/mark-all-read/

HomeTab
  ├── Bell icon with unread badge (polls /unread-count/ every 30s)
  ├── Gradient header with stats
  ├── Live Now banner
  ├── Quick Actions grid (6 items)
  ├── QR Banner
  └── Today's Schedule
```

---

## DJANGO API ENDPOINTS
```
AUTH:
  POST /api/v1/auth/login/               ← returns JWT + user data
  GET  /api/v1/auth/me/                  ← current user (JWT required)
  POST /api/v1/auth/logout/              ← blacklist token
  POST /api/v1/auth/change-password/
  POST /api/v1/auth/token/refresh/

NOTIFICATIONS:
  POST /api/v1/notifications/register-token/    ← save device push token
  POST /api/v1/notifications/unregister-token/  ← deactivate on logout
  POST /api/v1/notifications/send/              ← admin only
  GET  /api/v1/notifications/history/           ← admin only
  GET  /api/v1/notifications/my/                ← user's notifications + unread count
  POST /api/v1/notifications/mark-read/         ← { notification_ids: [...] }
  POST /api/v1/notifications/mark-all-read/
  GET  /api/v1/notifications/unread-count/      ← { unread_count: N }
```

---

## NOTIFICATION MODELS
```python
DeviceToken
  user, token (unique), platform, is_active, created_at, updated_at

Notification
  title, body, data (JSON), target_type (all/role/user)
  target_role, target_user, status, sent_count, failed_count
  sent_by, created_at
  @property delivered_count  ← from UserNotification
  @property read_count       ← from UserNotification

UserNotification              ← per-user tracking
  notification (FK), user (FK)
  delivered (bool), read (bool)
  delivered_at, read_at, created_at
  unique_together: [notification, user]
```

---

## PUSH NOTIFICATION FLOW
```
HOW IT WORKS:
  1. User logs in on phone
  2. App calls registerForPushNotifications(access_token)
  3. expo-notifications returns ExponentPushToken[xxxxx]
  4. App POSTs token to /api/v1/notifications/register-token/
  5. Token saved to DeviceToken table

  Admin sends:
  6. Admin fills form at /panel/notifications/
  7. Django calls fcm.send_to_all/role/user()
  8. fcm.py POSTs to https://exp.host/--/api/v2/push/send
  9. Expo delivers to phone
  10. UserNotification record created (delivered=True)

  User reads:
  11. App opens NotificationsScreen → fetches /my/
  12. User taps notification → POST /mark-read/
  13. UserNotification.read = True, read_at = now
  14. Admin panel shows 👁 N read count

TOKEN FORMAT:  ExponentPushToken[xxxx]  ← Expo Go format
               (Raw FCM token only works in standalone builds)
```

---

## EXPO PROJECT CONFIG
```
Account:     coder2026 (expo.dev)
Project ID:  afa28d7e-10d5-4e85-bed4-783b7371a56b
Slug:        etd2026
Package:     com.etd2026.app (Android + iOS)
SDK:         51.0.0
```

---

## TEST CREDENTIALS
```
MOBILE APP:
  participant@test.com / Test@1234   (role: participant)
  speaker@test.com    / Test@1234   (role: speaker)

ADMIN PANEL:
  admin@confhub.com   / Admin@1234  (role: super_admin)
  URL: /panel/login/
  Notifications URL: /panel/notifications/
```

---

## ADMIN PANEL STRUCTURE
```
base.html — Custom CSS, dark sidebar, Inter font, Font Awesome icons
  CSS Variables: --primary, --success, --danger, --warning, --bg, --surface,
                 --text, --text-secondary, --text-tertiary, --border

Sidebar sections:
  Main:       Dashboard
  Management: Participants, Teams, Check-In Scanner
  Content:    Events & Schedule, Photo Moderation, Posts & Feed
  Engagement: Polls, Q&A Manager, Leaderboard
  System:     Notifications (/panel/notifications/), Reports, Settings

Notifications page features:
  - Compose form (title, body, target: all/role/user)
  - Live preview box
  - History list with: status badge, sent count, 👁 read count, time ago
```

---

## DJANGO SETTINGS (Key)
```python
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    'https://*.app.github.dev',
    'http://localhost:8000',
    'https://*.ngrok-free.app',
    'https://*.ngrok-free.dev',
]
AUTH_USER_MODEL = 'accounts.User'
INSTALLED_APPS includes: 'apps.notifications'
SIMPLE_JWT: ACCESS_TOKEN = 24h, REFRESH = 30 days
```

---

## IMPORTANT RULES (DO NOT BREAK)
```
MOBILE:
  ✗ Never upgrade Expo SDK (stay on 51)
  ✗ Never add expo-router
  ✗ Never add TypeScript (.tsx files)
  ✗ Never add plugins to app.json that don't exist
  ✓ All navigation via useState in MainApp.js
  ✓ All screens are .js files in src/screens/
  ✓ All styles use COLORS/FONT/SPACE/RADIUS from src/theme.js
  ✓ Reuse Card, Badge, Avatar etc from src/components.js
  ✓ Android: elevation:0 + borderWidth:1 (no ugly shadows)
  ✓ iOS: real shadowColor shadows

BACKEND:
  ✗ Never use Firebase Admin SDK for sending (use Expo Push API)
  ✓ Push tokens are ExponentPushToken[...] format in Expo Go
  ✓ UserNotification created per-send for read tracking
  ✓ Admin panel uses base.html CSS variables only (no Bootstrap)
  ✓ CSRF must work via ngrok (CSRF_TRUSTED_ORIGINS includes *.ngrok-free.dev)

DEVELOPMENT:
  ✓ ngrok URL changes on every restart → update API_URL in src/theme.js
  ✓ Expo project ID: afa28d7e-10d5-4e85-bed4-783b7371a56b
  ✓ Expo account: coder2026
```

---

## WHAT IS WORKING
```
✅ Django API on port 8000
✅ Admin panel at /panel/ with custom CSS (no Bootstrap)
✅ Admin login/logout
✅ JWT auth (login, refresh, blacklist on logout)
✅ Mobile app loads on phone via Expo Go (SDK 51)
✅ Login screen → JWT → enters app
✅ All 5 tabs: Home, Schedule, QR, Feed, Profile
✅ Bottom tab bar with animated press + floating QR button
✅ Splash screen with animation
✅ Push notifications:
    - Device token registration on login
    - Admin panel compose + send (all/role/user)
    - Expo Push API delivery (working, tested)
    - UserNotification tracking (delivered + read)
    - NotificationsScreen in app with pull-to-refresh
    - Mark read / mark all read
    - Bell icon with unread badge in HomeTab (polls every 30s)
    - Admin panel shows 👁 read count per notification
✅ ngrok tunnel for phone ↔ Django communication
✅ CSRF fixed for ngrok domains
```

---

## WHAT IS STATIC / PLACEHOLDER (To build next)
```
❌ Schedule — hardcoded data, needs real Django API
❌ Feed — hardcoded posts, needs real posts API
❌ QR code — placeholder icon, needs real QR generation
❌ Photos — menu item exists, no screen
❌ Polls — menu item exists, no screen
❌ Directory — menu item exists, no screen
❌ Leaderboard — menu item exists, no screen
❌ Check-in — admin menu item, no functionality
❌ Edit Profile — menu item in ProfileTab, no screen
❌ Change Password — menu item, no screen
❌ User stats (42 pts, #12 rank) — hardcoded
❌ Admin panel pages — most sidebar items are href="#"
```

---

## CURRENT ngrok URL (Changes on restart)
```
Django API: https://bauble-aftermost-buffalo.ngrok-free.dev/api/v1
            ↑ This changes every ngrok restart
            ↑ Update in: /workspaces/eventapp/mobile/src/theme.js → API_URL
```

---

## PACKAGE VERSIONS
```json
MOBILE (package.json):
{
  "expo": "~51.0.39",
  "expo-linear-gradient": "~13.0.2",
  "expo-notifications": "~0.28.19",
  "expo-device": "~6.0.2",
  "expo-status-bar": "~1.12.1",
  "react": "18.2.0",
  "react-native": "0.74.5",
  "@expo/vector-icons": "(included with expo)"
}

BACKEND (requirements.txt key packages):
  Django==4.2.9
  djangorestframework
  djangorestframework-simplejwt
  django-cors-headers
  firebase-admin==7.5.0  ← installed but NOT used for sending
```