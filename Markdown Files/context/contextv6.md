# Complete Project Context (v6 — Chat Ready)

---

## PROJECT OVERVIEW
```
Product: Conference Management Platform
Event:   ETD 2026 — "ETDs in the age of AI" — IIT Delhi
Website: https://etd2026.iitd.ac.in/
Type:    Mobile App (React Native Expo) + Web Admin Panel (Django MVT)
GitHub:  Repository: eventapp | Path: /workspaces/eventapp
Dev Env: GitHub Codespaces (Ubuntu)
Status:  Core features COMPLETE — now in polishing/new features phase
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
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   ├── admin_views.py
│   │   │   ├── admin_urls.py
│   │   │   ├── urls.py
│   │   │   ├── serializers.py
│   │   │   └── management/commands/
│   │   │       ├── seed_dummy_participants.py
│   │   │       └── purge_dummy_participants.py
│   │   ├── notifications/
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   ├── admin_views.py
│   │   │   ├── admin_urls.py
│   │   │   ├── urls.py
│   │   │   └── fcm.py          ← Expo Push API sender
│   │   ├── sponsors/
│   │   ├── speakers/
│   │   ├── conferences/
│   │   ├── events/
│   │   ├── photos/
│   │   ├── polls/
│   │   ├── posts/
│   │   ├── checkins/
│   │   │   ├── models.py       ← CheckIn, MealPass, MealWindow
│   │   │   ├── views.py        ← all API logic
│   │   │   ├── admin_views.py  ← panel AJAX + page views
│   │   │   ├── admin_urls.py   ← panel URL wiring
│   │   │   └── urls.py         ← API URL wiring
│   │   ├── chat/
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   └── leaderboard/
│   ├── templates/panel/        ← ALL web admin templates live here
│   │   ├── base.html                  ← custom CSS, no Bootstrap
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── participants_list.html
│   │   ├── participants_upload.html
│   │   ├── participants_preview.html
│   │   ├── participant_add.html
│   │   ├── participant_edit.html
│   │   ├── checkin_list.html          ← 3 tabs: checked-in/not/meal
│   │   ├── scanner.html               ← full JS QR scanner (2 modes)
│   │   ├── notifications.html
│   │   ├── notification_edit.html
│   │   ├── speakers_list.html
│   │   ├── speaker_form.html
│   │   ├── sponsors_list.html
│   │   ├── sponsor_form.html
│   │   ├── users_manage.html
│   │   ├── events_list.html
│   │   ├── event_form.html
│   │   ├── conference_settings.html
│   │   ├── password_reset_request.html
│   │   └── password_reset_confirm.html
│   ├── media/
│   │   └── profiles/
│   │       ├── placeholder-image-male.jpg
│   │       └── placeholder-image-female.jpg
│   ├── requirements.txt
│   ├── db.sqlite3
│   └── manage.py
├── mobile/
│   ├── App.js                         ← root, session persistence
│   ├── app.json                       ← EAS config + all plugins
│   ├── babel.config.js                ← reanimated plugin last
│   ├── package.json
│   ├── eas.json
│   ├── index.js
│   ├── google-services.json
│   └── src/
│       ├── theme.js                   ← COLORS, FONT, SPACE, API_URL
│       ├── components.js              ← reusable components
│       ├── cache.js                   ← AsyncStorage cache utility
│       ├── MainApp.js                 ← navigation, tab bar
│       ├── notifications.js
│       └── screens/
│           ├── LoginScreen.js
│           ├── HomeTab.js
│           ├── ScheduleTab.js
│           ├── QRScreen.js            ← conference QR + meal pass
│           ├── FeedScreen.js
│           ├── NetworkScreen.js
│           ├── ProfileTab.js
│           ├── NotificationsScreen.js
│           ├── EditProfileScreen.js
│           ├── ChangePasswordScreen.js
│           ├── SponsorsScreen.js
│           ├── SponsorDetailScreen.js
│           ├── SpokersScreen.js       ← NOTE: typo in filename, keep it
│           ├── SpeakerDetailScreen.js
│           ├── ChatListScreen.js
│           ├── ChatRoomScreen.js
│           ├── ContactCardModal.js
│           ├── TopicPickerModal.js
│           ├── SpeakerRequestModal.js
│           ├── ConnectionRequestsScreen.js
│           └── admin/
│               ├── AdminTab.js
│               ├── NotificationsAdmin.js
│               ├── UsersAdmin.js
│               ├── AddParticipantScreen.js
│               └── CheckInScreen.js   ← 3 tabs: checkin/meal/history
├── .devcontainer/
│   ├── devcontainer.json              ← auto public ports + docker start
│   └── autostart.sh                   ← docker + django on restart
└── docker-compose.yml
```

---

## TECH STACK
```
MOBILE:
  Framework:     React Native Expo SDK 54.0.36
  React:         19.1.0
  React Native:  0.81.5
  Entry:         index.js → registerRootComponent(App)
  Navigation:    Manual useState (NO expo-router, NO React Navigation)
  Language:      JavaScript only (NO TypeScript)
  State:         useState (no Zustand, no Redux)
  API:           fetch() with JWT Bearer token
  Icons:         @expo/vector-icons (Ionicons)
  Cache:         AsyncStorage via src/cache.js

BACKEND:
  Framework:   Django 4.2.9 + Django REST Framework
  Auth:        JWT via djangorestframework-simplejwt
  User model:  Custom (UUID pk, email as USERNAME_FIELD, role field)
  Database:    SQLite (dev)
  Push:        Expo Push API (NOT Firebase Admin SDK for sending)
  Admin panel: Custom Django MVT (NO Bootstrap, custom CSS in base.html)
  Media:       ImageField uploads served via MEDIA_URL/MEDIA_ROOT

INFRASTRUCTURE:
  Dev:     GitHub Codespaces
  Docker:  PostgreSQL:5432, Redis:6379, MinIO:9000
  Ports:   Django:8000, Expo:8081
  Tunnel:  ngrok → Django (stable: bauble-aftermost-buffalo.ngrok-free.dev)
           Expo tunnel → phone + browser via exp.direct URL
```

---

## STARTUP SEQUENCE (Every Codespace restart)
```bash
# Terminal 1 — Docker + Django
cd /workspaces/eventapp && docker compose up -d && sleep 3
cd backend && python manage.py runserver 0.0.0.0:8000

# Terminal 2 — ngrok (REQUIRED for both phone AND browser)
ngrok http 8000

# Terminal 3 — Expo
cd /workspaces/eventapp/mobile && npx expo start --tunnel --port 8081 --clear

# Browser: https://j1wmlco-coder2026-8081.exp.direct (or current exp.direct URL)
# Phone:   Open ETD 2026 Dev APK → scan QR → live reload
```

---

## CRITICAL: WEB BROWSER ACCESS — HOW IT WORKS
```
PROBLEM HISTORY (solved — do not revert):

1. Codespaces tunnel (port 8000) blocks cross-origin OPTIONS preflight
   from exp.direct origin → 404 before Django sees request
   FIX: API_URL = NGROK for both web and native

2. ngrok shows HTML interstitial page for browser requests without
   ngrok-skip-browser-warning header → browser gets HTML with no
   CORS headers → CORS error even though Django config is correct
   FIX: API_HEADERS always includes ngrok-skip-browser-warning: true

3. CorsMiddleware was 3rd in MIDDLEWARE list → SecurityMiddleware
   short-circuits some requests before CORS headers added
   FIX: CorsMiddleware must be FIRST in MIDDLEWARE

CURRENT STATE (working):
  theme.js:
    export const API_URL = NGROK;  ← both web + native use ngrok
    export const API_HEADERS = { ...BASE_HEADERS, 'ngrok-skip-browser-warning': 'true' };

  settings.py MIDDLEWARE order:
    'corsheaders.middleware.CorsMiddleware',     ← MUST be first
    'django.middleware.security.SecurityMiddleware',
    ...

  CORS settings:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True

KNOWN WEB LIMITATIONS (acceptable):
  - expo-camera QR scan does not work on web
  - expo-haptics does not work on web
  - Push notifications not supported on web
  - useNativeDriver warnings in console — harmless
  - props.pointerEvents deprecation warning — harmless
```

---

## NGROK — IMPORTANT
```
Stable URL: https://bauble-aftermost-buffalo.ngrok-free.dev

Used by: BOTH mobile app AND web browser
Must be running for web to work — not optional

theme.js:
  const NGROK = 'https://bauble-aftermost-buffalo.ngrok-free.dev/api/v1';
  export const API_URL = NGROK;

Verify running:
  curl -s http://localhost:4040/api/tunnels | python3 -c \
  "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])"
```

---

## QUICK DIAGNOSTIC (run when anything breaks)
```bash
echo "=== Django ===" && \
curl -s http://localhost:8000/api/v1/auth/me/ && echo "" && \
echo "=== ngrok ===" && \
curl -s http://localhost:4040/api/tunnels | python3 -c \
"import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" && \
echo "=== CORS ===" && \
curl -s -I -X OPTIONS \
  -H "Origin: https://j1wmlco-coder2026-8081.exp.direct" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:8000/api/v1/auth/login/ | grep -i "access-control" && \
echo "=== Docker ===" && \
docker compose ps --format "table {{.Name}}\t{{.Status}}" && \
echo "=== API_URL ===" && \
grep "export const API_URL\|export const API_HEADERS" \
/workspaces/eventapp/mobile/src/theme.js
```

---

## PACKAGE VERSIONS (SDK 54)
```json
{
  "expo": "~54.0.36",
  "expo-dev-client": "~6.0.21",
  "expo-device": "~8.0.10",
  "expo-image-picker": "~17.0.11",
  "expo-linear-gradient": "~15.0.8",
  "expo-notifications": "~0.32.17",
  "expo-status-bar": "~3.0.9",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-svg": "15.12.1",
  "qrcode-generator": "^1.4.4",
  "expo-camera": "installed",
  "expo-document-picker": "installed",
  "expo-file-system": "installed",
  "expo-sharing": "installed",
  "expo-haptics": "installed",
  "expo-web-browser": "installed",
  "expo-clipboard": "installed",
  "@react-native-async-storage/async-storage": "installed",
  "expo-av": "installed",
  "expo-sensors": "installed",
  "expo-location": "installed",
  "expo-media-library": "installed",
  "expo-image-manipulator": "installed",
  "expo-blur": "installed",
  "expo-keep-awake": "installed",
  "expo-brightness": "installed",
  "expo-local-authentication": "installed",
  "expo-calendar": "installed",
  "react-native-reanimated": "installed",
  "react-native-gesture-handler": "installed"
}
```

---

## HOW THE ADMIN PANEL IS WIRED
```
TEMPLATE DIRECTORY:
  backend/templates/panel/
  Linked via settings.py:
    TEMPLATES = [{ 'DIRS': [BASE_DIR / 'templates'] }]
  All templates extend: {% extends "panel/base.html" %}

URL ROUTING (confhub/urls.py):
  path('panel/', include('apps.accounts.admin_urls'))
  path('panel/', include('apps.notifications.admin_urls'))
  path('panel/', include('apps.checkins.admin_urls'))
  path('panel/', include('apps.sponsors.admin_urls'))
  path('panel/', include('apps.speakers.admin_urls'))
  path('panel/', include('apps.chat.admin_urls'))

CHECKINS ADMIN URLS (apps/checkins/admin_urls.py):
  checkins/scanner/            → scanner_view      (page)
  checkins/list/               → checkin_list_view (page)
  checkins/scan/               → panel_scan        (AJAX POST)
  checkins/goodies/            → panel_goodies     (AJAX POST)
  checkins/stats/              → panel_stats       (AJAX GET)
  checkins/meal-window-status/ → panel_meal_window_status (AJAX GET)
  checkins/meal/window/        → panel_meal_window_toggle (AJAX POST)
  checkins/meal/scan/          → panel_meal_scan   (AJAX POST)

AUTH:
  Panel uses Django session auth (@login_required)
  API uses JWT Bearer tokens
  Panel AJAX views use _require_scanner decorator (session-based)
  scanner_view passes admin_jwt to template (not used anymore)

base.html:
  Custom CSS variables (--primary, --bg, --text-tertiary etc.)
  Font Awesome 6.5.1 for icons
  Inter font from Google Fonts
  Dark sidebar, white content area
  NO Bootstrap
```

---

## THEME SYSTEM — src/theme.js
```javascript
const NGROK      = 'https://bauble-aftermost-buffalo.ngrok-free.dev/api/v1';
const CODESPACES = 'https://cautious-eureka-jj56xxggr9vpcq9qj-8000.app.github.dev/api/v1';

export const API_URL  = NGROK;  // both web + native — DO NOT change back to Platform conditional
export const API_ROOT = API_URL.replace(/\/api\/v1$/, '');

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'ngrok-skip-browser-warning': 'true',  // required on web too
};
export const API_HEADERS = { ...BASE_HEADERS, 'ngrok-skip-browser-warning': 'true' };

COLORS.brand        = '#0333b6'
COLORS.brandDark    = '#022a8f'
COLORS.brandDeep    = '#0F172A'
COLORS.brandDeeper  = '#070614'
COLORS.brandLight   = '#e8eeff'
COLORS.brandMid     = 'rgba(3,51,182,0.10)'
COLORS.accent       = '#f59e0b'
COLORS.accentDark   = '#d97706'
COLORS.accentLight  = '#fef3c7'
COLORS.accentMid    = 'rgba(245,158,11,0.15)'
COLORS.bg           = '#f0f4f9'
COLORS.surface      = '#FFFFFF'
COLORS.success      = '#10b981'
COLORS.successLight = '#d1fae5'
COLORS.error        = '#ef4444'
COLORS.errorLight   = '#fee2e2'
COLORS.warning      = '#f59e0b'
COLORS.warningLight = '#fef3c7'
COLORS.purple       = '#8b5cf6'
COLORS.purpleLight  = '#ede9fe'
COLORS.teal         = '#14b8a6'
COLORS.tealLight    = '#ccfbf1'
COLORS.text         = '#0F172A'
COLORS.textSec      = '#475569'
COLORS.textTer      = '#94a3b8'
COLORS.textInverse  = '#FFFFFF'
COLORS.border       = '#e2e8f0'
COLORS.borderLight  = '#f1f5f9'

FONT  = { micro:9, xs:11, sm:13, base:15, md:16, lg:18, xl:22, xxl:26, xxxl:32, hero:40 }
SPACE = { xxs:2, xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, huge:48 }
RADIUS= { xs:4, sm:8, md:12, lg:16, xl:20, xxl:28, xxxl:36, full:999 }
TOP   = Platform.OS === 'ios' ? 54 : 44

export function fixMediaUrl(url) — fixes localhost URLs to ngrok
```

---

## MOBILE NAVIGATION PATTERN
```
App.js:
  Web:    localStorage for session persistence
  Native: AsyncStorage for session persistence
  Restores session on app open → shows MainApp or LoginScreen

MainApp.js:
  const [tab, setTab] = useState('home')
  const [subScreen, setSubScreen] = useState(null)
  const [subParams, setSubParams] = useState({})

Tab bar: home | schedule | qr (center) | network | admin/profile

SubScreens (rendered in MainApp based on subScreen state):
  'notifications'       → NotificationsScreen
  'edit_profile'        → EditProfileScreen
  'change_password'     → ChangePasswordScreen
  'sponsors'            → SponsorsScreen
  'speakers'            → SpokersScreen
  'chat_list'           → ChatListScreen
  'chat_room'           → ChatRoomScreen
  'connection_requests' → ConnectionRequestsScreen

AdminTab internal navigation (own useState, NOT MainApp subScreen):
  'checkin'         → CheckInScreen
  'notifications'   → NotificationsAdmin
  'add_participant' → AddParticipantScreen
  'users'           → UsersAdmin
```

---

## USER MODEL
```python
class User(AbstractBaseUser, PermissionsMixin):
    id                   = UUIDField(primary_key=True)
    email                = EmailField(unique=True)
    registration_id      = CharField(50, unique=True, blank, null)
    role                 = CharField(choices=[
                             super_admin, mgmt_admin, team_head,
                             staff, speaker, participant])
    first_name           = CharField(100)
    last_name            = CharField(100)
    phone                = CharField(20, blank)
    affiliation          = CharField(200, blank)
    bio                  = TextField(blank)
    designation          = CharField(200, blank)
    gender               = CharField(20, blank)
    research_interests   = TextField(blank)   ← comma-separated
    profile_photo        = ImageField(upload_to='profiles/')
    linkedin_url         = URLField(blank)
    show_phone           = BooleanField(default=False)
    show_linkedin        = BooleanField(default=True)
    must_change_password = BooleanField(default=True)
    profile_complete     = BooleanField(default=False)
    warning_note         = TextField(blank)
    suspended_reason     = TextField(blank)
    is_active            = BooleanField(default=True)
    created_at           = DateTimeField(auto_now_add=True)
```

---

## REGISTRATION ID FORMAT
```
Bulk import (Excel):  ETD-2026-R-001  (R = Registered)
Single add (admin):   ETD-2026-S-001  (S = Single, auto-incremented)
Dummy/test users:     ETD-2026-R-010 to ETD-2026-R-109
```

---

## CHECK-IN SYSTEM — COMPLETE
```
Models: CheckIn, MealPass, MealWindow

CheckIn:
  user, checkin_type='conference', scanned_by, scanned_at
  goodies_status: pending/received/skipped
  goodies_note, goodies_confirmed_by, goodies_confirmed_at

MealPass:
  meal_type: 'meal' (unified — no lunch/dinner in UI)
  NOTE: 'lunch'/'dinner' kept in model choices for old data only
  user, date, used, used_at, scanned_by

MealWindow:
  meal_type: 'meal' (unified)
  date, is_open, opened_by, opened_at, closed_at

FLOW:
  1. Admin opens meal window → users can generate pass
  2. User opens QR tab → sees "Meal Pass" card → Generate
  3. Staff scans user's meal QR → MealPass.used = True
  4. Push notification sent to user on both check-in and meal scan

POINTS:
  Conference check-in: 10 points (CHECKIN action)
  Meal scan: 10 points (MEAL_SCAN action) — one time only

PUSH ON SCAN:
  When staff scans conference QR → push sent to user's device
    title: '✅ Check-In Successful!'
    body:  'Welcome to ETD 2026, {name}! You are checked in.'
  When staff scans meal pass → push sent to user's device
    title: '🍽️ Meal Pass Verified!'
    body:  'Your meal pass has been scanned. Enjoy your meal!'

NETWORK VISIBILITY:
  Only checked-in participants appear in Network tab
  Speakers always visible (no check-in required)

CONFERENCE KIT (not "Goodies" anywhere in UI):
  After check-in scan → staff asked: Kit Given / Skip
  Status tracked: pending/received/skipped
  Shown in: web scanner, mobile admin CheckInScreen, checkin_list
```

---

## SCANNER PAGE — scanner.html
```
URL: /panel/checkins/scanner/

Two mode tabs:
  1. Conference Check-In
  2. Meal Pass

Features:
  - Camera via BarcodeDetector API (Chrome/Android WebView)
  - Manual registration ID entry (Enter key or Scan button)
  - Scan result card with user photo/name/reg ID
  - Conference Kit confirmation (Yes/Skip) after check-in
  - Meal window open/close controls in meal mode
  - Live stats (Checked In / Remaining / Total)
  - Toast notifications for actions

AJAX endpoints called by scanner.html JS:
  POST /panel/checkins/scan/               → panel_scan
  POST /panel/checkins/goodies/            → panel_goodies
  GET  /panel/checkins/stats/              → panel_stats
  GET  /panel/checkins/meal-window-status/ → panel_meal_window_status
  POST /panel/checkins/meal/window/        → panel_meal_window_toggle
  POST /panel/checkins/meal/scan/          → panel_meal_scan

All AJAX uses session auth + CSRF token (getCookie('csrftoken'))
No JWT needed for panel AJAX
```

---

## CHECKIN LIST PAGE — checkin_list.html
```
URL: /panel/checkins/list/

Three tabs:
  1. Checked In — table with Conference Kit status column
  2. Not Checked In — participants pending check-in
  3. Meal Passes — today's meal passes with used/pending status

Stats at top:
  Checked In count | Not Checked In count | Meal Passes Used count

Search: by name/email/reg ID — applies to active tab
```

---

## MOBILE ADMIN — CheckInScreen.js
```
Three top-level tabs:
  1. Check In
     - Stats bar: Checked In / Remaining / Total
     - Manual reg ID input (auto-uppercase)
     - Camera QR scan via CameraView
     - Full-screen ScanOverlay popup on every scan result
       (staff shows phone to user as confirmation)
     - KitConfirm component below overlay after new check-in
       (Kit Given / Skip buttons)
     - Kit status badge persists after confirmation

  2. Meal Scan
     - Stats bar: Passes Used / Generated
     - Manual reg ID or camera scan
     - Full-screen ScanOverlay on every result
     - No lunch/dinner picker — just 'meal' type

  3. History
     - Sub-tabs: Check-Ins | Meal Passes
     - FlatList with pull-to-refresh
     - Check-Ins: name, reg ID, scanned by, time, kit badge
     - Meal Passes: name, reg ID, used time, used/pending badge
```

---

## QR SCREEN — QRScreen.js (User side)
```
Conference QR Card:
  - QR code generated client-side via qrcode-generator
  - Shows checked-in state (green overlay when checked in)
  - Registration ID displayed below QR
  - User name/email/role/affiliation

CheckInPopup (modal):
  - Shows ONLY on FALSE → TRUE transition (staff just scanned)
  - NOT on page refresh
  - Module-level flag: _popupShownThisSession
  - Shows points awarded, check-in time, kit status
  - Polling interval: 10 seconds (not 5 minutes)

Meal Pass Section:
  - Only shown when meal window is open
  - Single "Meal Pass" card (no lunch/dinner labels)
  - Generate → shows QR modal
  - MealPassModal: full-screen QR to show staff
```

---

## DJANGO API ENDPOINTS
```
AUTH:
  POST /api/v1/auth/login/
  GET  /api/v1/auth/me/
  POST /api/v1/auth/logout/
  POST /api/v1/auth/change-password/
  POST /api/v1/auth/token/refresh/
  POST /api/v1/auth/update-profile/
  GET  /api/v1/auth/users/
  POST /api/v1/auth/users/<pk>/action/
  POST /api/v1/auth/participants/create/

NOTIFICATIONS:
  POST /api/v1/notifications/register-token/
  POST /api/v1/notifications/unregister-token/
  POST /api/v1/notifications/send/
  GET  /api/v1/notifications/history/
  GET  /api/v1/notifications/my/
  POST /api/v1/notifications/mark-read/
  POST /api/v1/notifications/mark-all-read/
  GET  /api/v1/notifications/unread-count/

SPONSORS (AllowAny):
  GET /api/v1/sponsors/
  GET /api/v1/sponsors/<id>/

SPEAKERS (AllowAny):
  GET /api/v1/speakers/
  GET /api/v1/speakers/<pk>/

CHECKINS:
  POST /api/v1/checkins/scan/           ← conference check-in
  POST /api/v1/checkins/goodies/        ← kit confirm
  GET  /api/v1/checkins/status/
  GET  /api/v1/checkins/list/
  GET  /api/v1/checkins/my-qr/
  GET  /api/v1/checkins/network/
  GET  /api/v1/checkins/meal/status/
  POST /api/v1/checkins/meal/generate/
  POST /api/v1/checkins/meal/scan/
  POST /api/v1/checkins/meal/window/
  GET  /api/v1/checkins/meal/stats/
  GET  /api/v1/checkins/meal/list/      ← today's meal passes (admin)

CHAT:
  POST /api/v1/chat/requests/send/
  GET  /api/v1/chat/requests/inbox/
  GET  /api/v1/chat/requests/sent/
  POST /api/v1/chat/requests/<id>/respond/
  POST /api/v1/chat/requests/<id>/withdraw/
  GET  /api/v1/chat/requests/count/
  POST /api/v1/chat/check/bulk/         ← BEFORE uuid pattern in urls.py
  GET  /api/v1/chat/check/<uuid>/
  GET  /api/v1/chat/connections/count/
  GET  /api/v1/chat/conversations/
  GET  /api/v1/chat/conversations/<id>/
  POST /api/v1/chat/conversations/<id>/mute/
  GET  /api/v1/chat/conversations/<id>/messages/
  POST /api/v1/chat/conversations/<id>/messages/send/
  POST /api/v1/chat/conversations/<id>/messages/read/
  DELETE /api/v1/chat/conversations/<id>/messages/<mid>/delete/
  POST /api/v1/chat/conversations/<id>/messages/<mid>/react/
  POST /api/v1/chat/conversations/<id>/messages/<mid>/report/
  POST /api/v1/chat/block/
  POST /api/v1/chat/unblock/
  GET  /api/v1/chat/blocked/
```

---

## PARTICIPANT IMPORT SYSTEM
```
Model: ParticipantImport (staging table)

Flow: Upload CSV/Excel → Preview → Confirm
  Step 1: /panel/participants/upload/
  Step 2: /panel/participants/preview/ ← shows reg_id + email checkbox
  Step 3: /panel/participants/confirm/ ← creates User records

Email checkbox: UNCHECKED by default (for testing)

CSV columns:
  Salutation, Full Name, Registration ID, Email ID, Gender,
  Designation, Organisation/Institute, Mobile Number, Address, PIN

Single add: /panel/participants/add/
  → Auto-generates ETD-2026-S-XXX
  → Same email checkbox
```

---

## DUMMY DATA
```bash
# Seed 100 dummy participants
python manage.py seed_dummy_participants

# Remove all dummy participants
python manage.py purge_dummy_participants --confirm

Details:
  Email:    firstname.lastname@test.com
  Password: Test@1234
  Reg IDs:  ETD-2026-R-010 to ETD-2026-R-109
  Photos:   placeholder male/female
  Interests: 5 per user (rotating from 20 topics)
```

---

## NOTIFICATION SYSTEM
```
Push flow:
  Login → registerForPushNotifications → token saved to backend
  One token per user (old tokens deleted on new login)
  Backend sends via Expo Push API → FCM V1 → Android

Auto push triggers:
  1. Meal window opened → all users notified
  2. Conference check-in scan → push to scanned user
  3. Meal pass scan → push to scanned user

Badge polling: every 30s in MainApp.js
  GET /api/v1/notifications/unread-count/
  GET /api/v1/chat/requests/count/
  GET /api/v1/chat/conversations/ (total_unread)

fcm.py has:
  send_to_all(title, body, data, notif, request)
  send_to_tokens(tokens, title, body, data)   ← used for single user push
```

---

## SPEAKERS & SPONSORS
```
Speaker: STANDALONE model (no FK to User)
  is_keynote, is_active, display_order
  SpeakerTalk: FK to Speaker, track, talk_date, talk_time

Sponsor tiers: national_funding, platinum, silver, bronze

Both: full admin CRUD + public APIs + mobile screens
Speaker screen file: SpokersScreen.js (typo — do not rename)
```

---

## LEADERBOARD
```
Points:
  Conference check-in: 10 pts (CHECKIN action, one time)
  Meal scan:           10 pts (MEAL_SCAN action, one time)

_award() helper in checkins/views.py:
  Checks PointEntry exists before awarding (idempotent)
  Silent on any leaderboard error

Screen: tile exists in HomeTab, screen not yet built
```

---

## CHAT SYSTEM
```
Models: ConnectionRequest, Conversation, Message

Conversation uses participant_a/participant_b (NOT ManyToMany)
Filter: Q(participant_a=user) | Q(participant_b=user)

Connection status values: none | connected | pending_sent | pending_received

Bulk status check:
  POST /api/v1/chat/check/bulk/
  Body: { user_ids: [...] }
  Returns: { statuses: { userId: { status, conversation_id } } }

IMPORTANT: bulk URL must be BEFORE uuid URL in chat/urls.py
```

---

## CACHE UTILITY — src/cache.js
```javascript
getCached(key)     → data or null if > 5 min old
setCache(key, data)→ stores with timestamp
clearCache(key)    → removes entry

Used in: NetworkScreen (network_attendees, network_speakers)
TTL: 5 minutes
```

---

## REUSABLE COMPONENTS — src/components.js
```
Card, GlassCard, Badge, Avatar, GradientAvatar,
StatBox, SectionHeader, Divider, PrimaryButton,
IconBox, FadeIn, PulsingDot
```

---

## EAS BUILD
```
Latest build: after installing 20 native packages
Profile: development (internal distribution APK)
Owner: coder2026s-team
Project ID: afa28d7e-10d5-4e85-bed4-783b7371a56b
Android pkg: com.etd2026.app

REBUILD REQUIRED WHEN:
  ✗ npm install <new-native-package>
  ✗ Changes to app.json plugins array

NO REBUILD NEEDED:
  ✓ Any .js file change (live reload)
  ✓ New screens, new API endpoints
  ✓ theme.js changes

BUILD COMMAND:
  cd /workspaces/eventapp/mobile && eas build --platform android --profile development
```

---

## TEST CREDENTIALS
```
MOBILE + WEB APP:
  participant@test.com / Test@1234   (role: participant)
  speaker@test.com    / Test@1234   (role: speaker)
  Dummy: firstname.lastname@test.com / Test@1234

ADMIN PANEL (/panel/login/):
  etd@admin.iitd.ac.in / Admin@1234  (role: super_admin)
```

---

## WHAT IS WORKING ✅
```
✅ Django API + ngrok + web browser access (both use ngrok)
✅ CORS correctly configured (CorsMiddleware first in MIDDLEWARE)
✅ ngrok-skip-browser-warning header on all requests (web + native)
✅ Admin panel at /panel/ with custom CSS
✅ JWT auth (login, refresh, blacklist on logout)
✅ Session persistence (localStorage web, AsyncStorage native)
✅ Mobile Dev Build APK (SDK 54) — all 20 native packages
✅ Live JS reload via expo start --tunnel
✅ All tabs + bottom tab bar + floating QR button
✅ Push notifications end-to-end (FCM V1)
✅ Warning modal on login
✅ Edit Profile, Change Password
✅ SPONSORS: full CRUD + API + mobile screens
✅ SPEAKERS: full CRUD + talks + API + mobile screens
✅ CHAT: full system (requests, conversations, messages)
✅ Network screen: cache-first, bulk status, debounced search
✅ Network: ONLY checked-in participants visible
✅ PARTICIPANT IMPORT: bulk CSV/Excel + single add
✅ Admin panel check-in list: 3 tabs + search + Kit column
✅ Admin mobile CheckInScreen: 3 tabs (checkin/meal/history)
✅ Scanner page: 2 modes (conference/meal), camera + manual
✅ Conference Kit tracking (not "Goodies") everywhere
✅ Meal pass: unified single type (no lunch/dinner in UI)
✅ Push to user on check-in scan + meal scan
✅ Full-screen ScanOverlay on mobile admin after every scan
✅ CheckInPopup on user QR screen: fires on scan transition only
✅ Leaderboard points: check-in (10pts) + meal scan (10pts)
✅ Dummy data: 100 users with 5 research interests each
✅ Dashboard uses real data
✅ Meal history in both web panel (tab) and mobile admin (tab)
```

---

## WHAT IS PLACEHOLDER ❌
```
❌ Schedule tab — hardcoded, needs real Django API
❌ Feed tab — hardcoded posts, needs real posts API
❌ Leaderboard screen — points awarded but no screen built
❌ Photos screen — tile exists, no screen
❌ Polls screen — tile exists, no screen
❌ Live stream — expo-av installed, not built
❌ Shake-to-share — expo-sensors installed, not built
❌ Venue map — expo-maps not installed
❌ Selfie points — not built
❌ Speaker/sponsor logos — no images uploaded
```

---

## IMPORTANT RULES
```
MOBILE:
  ✗ Never downgrade Expo SDK
  ✗ Never add expo-router / React Navigation
  ✗ Never add TypeScript
  ✗ Never add plugins to app.json without rebuilding APK
  ✗ Never add react-native-gesture-handler to plugins array
  ✗ Never change API_URL back to Platform.OS conditional
  ✗ Never remove ngrok-skip-browser-warning from API_HEADERS
  ✓ All screens are .js files in src/screens/
  ✓ All styles use COLORS/FONT/SPACE/RADIUS/SHADOW from theme.js
  ✓ Reuse components from components.js
  ✓ Use cache.js for any list screen data
  ✓ Speaker screen file: SpokersScreen.js (NOT SpeakersScreen.js)
  ✓ New native package = new EAS build required

BACKEND:
  ✗ Never use Firebase Admin SDK for sending push
  ✗ Never use Legacy FCM API
  ✗ Never move CorsMiddleware below SecurityMiddleware
  ✓ Push via Expo Push API only (fcm.py)
  ✓ Conversation: participant_a/participant_b (NOT M2M)
  ✓ Conference Kit (NOT Goodies) in all UI
  ✓ Admin panel uses base.html CSS variables only
  ✓ chat/urls.py: bulk endpoint BEFORE uuid endpoint
  ✓ Meal type: 'meal' for all new records (not lunch/dinner)
  ✓ After ANY settings.py change: restart Django process

CODING APPROACH:
  ✓ Diagnose before coding
  ✓ Get relevant files before writing code
  ✓ Give all code in EOF heredoc commands
  ✓ Lazy = efficient: reuse, don't rewrite
  ✓ Fix root cause, not symptom
  ✓ No abstractions not requested
  ✓ Shortest working diff wins
```

---

## GIT
```
Remote: https://github.com/sudhanshu1907/eventapp
Branch: main
```


Task:
We are going to add a new feature in the app which is Sessions and Timeline for the somescreen, feed the give information below so that manual feeding is avoid, after every session their will be a feedback form the particpant and users, Also particpant can set the session remineders and bookmarked them as well so that when session start they get notificed via notifcation, and each session is followed by the feedback so that we can do better for next session, This whole things is manageable form the admin web dashboard and form admin mobile app login.

To refine the flow of this i want to you to ask me related question to design it best.


This is the tentative program details day wise :
# CONFERENCE PROGRAM

## DAY 1 — FRIDAY, OCTOBER 23, 2026

### 08:30 – 09:30 hrs

**Registration**
Check-in and Registration

### 09:30 – 10:15 hrs

**Inaugural Session** ★
Opening Ceremony with Dignitaries and Presidential Address

### 10:15 – 11:00 hrs

**Group Photograph, Inauguration of Exhibition & High Tea**

### 11:00 – 13:00 hrs

**ETD Workshop**
*Hands-on Workshop*

### 13:00 – 13:45 hrs

**Lunch Break & Visit to Exhibition Area**

### 13:45 – 14:15 hrs

**Keynote Address – 1** ★

### 14:15 – 16:05 hrs

**Technical Session – 1**

* **14:15 – 14:55:** Invited Talk
* **14:55 – 16:05:** Paper Presentations

### 16:05 – 16:25 hrs

**Tea Break & Visit to Exhibition Area**

### 16:25 – 18:10 hrs

**Technical Session – 2**

* **16:25 – 17:15:** Innovative Lab Papers — Experiential / Work-in-Progress
* **17:15 – 17:45:** Poster Presentations
* **17:45 – 17:55:** Product Presentation
* **17:55 – 18:10:** Visit to Poster Area / Exhibition

### 18:30 – 20:00 hrs

**Cultural Event**

### 20:00 hrs onwards

**Dinner**

---

# DAY 2 — SATURDAY, OCTOBER 24, 2026

### 09:00 – 09:30 hrs

**Keynote Address – 2** ★

### 09:30 – 11:00 hrs

**Technical Session – 3**

* **09:30 – 10:10:** Invited Talk
* **10:10 – 10:50:** Paper Presentations
* **10:50 – 11:00:** Product Presentation

### 09:30 – 13:00 hrs

**Ideathon — Innovation Challenge**
*Collaborative Solution Development & Prototype Building*
**Parallel Event**

### 11:00 – 11:20 hrs

**Tea Break & Visit to Exhibition Area**

### 11:20 – 13:00 hrs

**Technical Session – 4**

* **11:20 – 12:00:** Invited Talk
* **12:00 – 12:50:** Paper Presentations
* **12:50 – 13:00:** Product Presentation

### 13:00 – 13:45 hrs

**Lunch Break & Visit to Exhibition Area**

### 13:45 – 15:35 hrs

**Technical Session – 5**

* **13:45 – 14:25:** Invited Talk
* **14:25 – 15:25:** Paper Presentations
* **15:25 – 15:35:** Product Presentation

### 15:35 – 16:00 hrs

**Tea Break & Visit to Exhibition Area**

### 16:00 – 17:40 hrs

**Technical Session – 6**

* **16:00 – 16:40:** Invited Talk
* **16:40 – 17:30:** Paper Presentations
* **17:30 – 17:40:** Product Presentation

### 17:40 – 18:10 hrs

**Ideathon — Live Collaborative Library Innovation Challenge**
Presentations — **5 minutes each**

### 19:30 – 21:00 hrs

**Gala Dinner**

---

# DAY 3 — SUNDAY, OCTOBER 25, 2026

### 09:00 – 09:30 hrs

**Keynote Address – 3** ★

### 09:30 – 11:10 hrs

**Technical Session – 7**

* **09:30 – 10:10:** Invited Talk
* **10:10 – 11:00:** Paper Presentations
* **11:00 – 11:10:** Product Presentation

### 11:10 – 11:30 hrs

**Tea Break & Visit to Exhibition Area**

### 11:30 – 13:00 hrs

**Technical Session – 8**

* **11:30 – 12:10:** Invited Talk
* **12:10 – 12:50:** Paper Presentations
* **12:50 – 13:00:** Product Presentation

### 13:00 – 13:45 hrs

**Lunch Break & Visit to Exhibition Area**

### 13:45 – 15:35 hrs

**Technical Session – 9**

* **13:45 – 14:25:** Invited Talk
* **14:25 – 15:25:** Paper Presentations
* **15:25 – 15:35:** Product Presentation

### 15:35 – 15:55 hrs

**Tea Break & Visit to Exhibition Area**

### 15:55 – 17:00 hrs

**Panel Discussion**

### 17:00 – 18:00 hrs

**Concluding Session** ★
Closing Ceremony

### 18:00 hrs onwards

**High Tea**

---

### ★ Featured Sessions

* **★ Inaugural Session**
* **★ Keynote Addresses**
* **★ Concluding Session**


We code in this cycle diagnose > get code from me if needed > assess > gen code accordingly > give to me > if any error > get code / error > assess .....and repeat

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

Does this need to be built at all? (YAGNI)
Does it already exist in this codebase? Reuse the helper, util, or pattern that's already here, don't re-write it.
Does the standard library already do this? Use it.
Does a native platform feature cover it? Use it.
Does an already-installed dependency solve it? Use it.
Can this be one line? Make it one line.
Only then: write the minimum code that works.
The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end to end, then climb.

Bug fix = root cause, not symptom: a report names a symptom. Grep every caller of the function you touch and fix the shared function once — one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves a sibling caller still broken.

Rules:

No abstractions that weren't explicitly requested.
No new dependency if it can be avoided.
No boilerplate nobody asked for.
Deletion over addition. Boring over clever. Fewest files possible.
Shortest working diff wins, but only once you understand the problem. The smallest change in the wrong place isn't lazy, it's a second bug.
Question complex requests: "Do you actually need X, or does Y cover it?"
Pick the edge-case-correct option when two stdlib approaches are the same size, lazy means less code, not the flimsier algorithm.
Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a ponytail: comment naming the ceiling and upgrade path.
Not lazy about: understanding the problem (read it fully and trace the real flow before picking a rung, a small diff you don't understand is just laziness dressed up as efficiency), input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs (the platform is never the spec ideal, a clock drifts, a sensor reads off), anything explicitly requested. Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind, the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.