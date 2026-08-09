[Improvements]
# Complete Project Context (v5 — Chat Ready)

---

## PROJECT OVERVIEW
```
Product: Conference Management Platform
Event:   ETD 2026 — "ETDs in the age of AI" — IIT Delhi
Website: https://etd2026.iitd.ac.in/
Type:    Mobile App (React Native Expo) + Web Admin Panel (Django MVT)
GitHub:  Repository: eventapp | Path: /workspaces/eventapp
Dev Env: GitHub Codespaces (Ubuntu)
Status:  Core features COMPLETE — now in polishing phase
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
│   │   │   └── management/
│   │   │       └── commands/
│   │   │           ├── seed_dummy_participants.py
│   │   │           └── purge_dummy_participants.py
│   │   ├── notifications/
│   │   ├── sponsors/
│   │   ├── speakers/
│   │   ├── conferences/
│   │   ├── events/
│   │   ├── photos/
│   │   ├── polls/
│   │   ├── posts/
│   │   ├── checkins/
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   ├── admin_views.py
│   │   │   ├── admin_urls.py
│   │   │   └── urls.py
│   │   ├── chat/
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   └── leaderboard/
│   ├── templates/panel/
│   │   ├── base.html                  ← custom CSS, no Bootstrap
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── participants_list.html
│   │   ├── participants_upload.html
│   │   ├── participants_preview.html
│   │   ├── participant_add.html       ← single add form
│   │   ├── participant_edit.html
│   │   ├── checkin_list.html          ← tabs: checked-in / not checked-in
│   │   ├── scanner.html               ← full JS QR scanner
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
│   ├── babel.config.js                ← reanimated plugin
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
│           ├── QRScreen.js
│           ├── FeedScreen.js
│           ├── NetworkScreen.js       ← cache-first, bulk status
│           ├── ProfileTab.js
│           ├── NotificationsScreen.js
│           ├── EditProfileScreen.js
│           ├── ChangePasswordScreen.js
│           ├── SponsorsScreen.js
│           ├── SponsorDetailScreen.js
│           ├── SpokersScreen.js
│           ├── SpeakerDetailScreen.js
│           ├── ChatListScreen.js
│           ├── ChatRoomScreen.js
│           ├── ContactCardModal.js
│           ├── TopicPickerModal.js
│           ├── SpeakerRequestModal.js
│           ├── ConnectionRequestsScreen.js
│           └── admin/
│               ├── AdminTab.js              ← 2×2 grid layout
│               ├── NotificationsAdmin.js
│               ├── UsersAdmin.js
│               ├── AddParticipantScreen.js
│               └── CheckInScreen.js         ← check-in + meal scan
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
  Tunnel:  ngrok → Django (URL persists: bauble-aftermost-buffalo.ngrok-free.app)
           Expo tunnel → phone via Dev Build APK
```

---

## PACKAGE VERSIONS (SDK 54 — Current)
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
  "react-native-gesture-handler": "installed",
  "react-native-worklets": "installed"
}
```

---

## STARTUP SEQUENCE (Every Codespace restart)
```bash
# Terminal 1 — Docker services
cd /workspaces/eventapp && docker compose up -d

# Terminal 2 — Django backend
cd /workspaces/eventapp/backend && python manage.py runserver 0.0.0.0:8000

# Terminal 3 — ngrok tunnel (URL is STABLE: bauble-aftermost-buffalo.ngrok-free.app)
ngrok http 8000

# Terminal 4 — Expo
cd /workspaces/eventapp/mobile && npx expo start --tunnel --port 8081 --clear

# Phone: Open ETD 2026 Dev APK → scan QR → live reload active
```

---

## NGROK URL — IMPORTANT
```
Current stable URL: https://bauble-aftermost-buffalo.ngrok-free.app

This URL is STABLE (paid/reserved ngrok domain).
Does NOT change on restart.

Location in code:
  mobile/src/theme.js:
    const NGROK = 'https://bauble-aftermost-buffalo.ngrok-free.app/api/v1';

Verify after restart:
  curl -s http://localhost:4040/api/tunnels | python3 -c \
  "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])"
```

---

## WEB BROWSER ACCESS — SOLVED
```
The app works in web browser (Codespaces port 8081).

HOW IT WORKS:
  App.js has localStorage-based session persistence for web:
    Storage.get/set/remove → window.localStorage on web, null on native

  theme.js has two URLs:
    const NGROK      = 'https://bauble-aftermost-buffalo.ngrok-free.app/api/v1';
    const CODESPACES = 'https://cautious-eureka-jj56xxggr9vpcq9qj-8000.app.github.dev/api/v1';
    export const API_URL = Platform.OS === 'web' ? CODESPACES : NGROK;

  App.js restore function uses API_URL (not hardcoded URL).

REQUIREMENTS:
  1. Port 8000 must be set to PUBLIC in Codespaces Ports tab
  2. Port 8081 must be set to PUBLIC in Codespaces Ports tab
  3. Django CORS: CORS_ALLOW_ALL_ORIGINS = True (already set)

ACCESS URL:
  https://[codespace-name]-8081.app.github.dev

KNOWN LIMITATIONS on web:
  - expo-camera QR scanning does not work on web
  - expo-haptics does not work on web
  - expo-sensors does not work on web
  - expo-local-authentication does not work on web
  - Push notifications not supported on web
  These are acceptable — web is for testing/admin only.
```

---

## EAS BUILD — CURRENT APK
```
Latest build: after installing 20 native packages
Build ID: (new build after package installation)
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
  ✓ theme.js URL changes

BUILD COMMAND:
  cd /workspaces/eventapp/mobile && eas build --platform android --profile development

NOTE: Run from /workspaces/eventapp/mobile NOT from root.
      eas build:list also must run from /workspaces/eventapp/mobile
```

---

## app.json PLUGINS (all registered)
```json
"plugins": [
  ["expo-notifications", { "icon": "./assets/icon.png", "color": "#0333b6", "sounds": [] }],
  "expo-image-picker",
  "expo-dev-client",
  "expo-camera",
  "expo-document-picker",
  ["expo-media-library", {
    "photosPermission": "ETD 2026 saves photos to your gallery.",
    "savePhotosPermission": "ETD 2026 saves photos to your gallery.",
    "isAccessMediaLocationEnabled": true
  }],
  ["expo-location", {
    "locationAlwaysAndWhenInUsePermission": "ETD 2026 uses your location to tag selfie point photos."
  }],
  ["expo-av", { "microphonePermission": "ETD 2026 uses the microphone for live stream audio." }],
  "expo-local-authentication",
  "expo-calendar"
]
```

**NOTE: `react-native-gesture-handler` does NOT go in plugins — it has no app.plugin.js**

---

## babel.config.js (reanimated must be last)
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

---

## THEME SYSTEM — src/theme.js
```javascript
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
COLORS.glass        = 'rgba(255,255,255,0.14)'
COLORS.glassBorder  = 'rgba(255,255,255,0.22)'
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
COLORS.rose         = '#f43f5e'
COLORS.roseLight    = '#ffe4e6'
COLORS.text         = '#0F172A'
COLORS.textSec      = '#475569'
COLORS.textTer      = '#94a3b8'
COLORS.textInverse  = '#FFFFFF'
COLORS.border       = '#e2e8f0'
COLORS.borderLight  = '#f1f5f9'

FONT  = { micro:9, xs:11, sm:13, base:15, md:16, lg:18, xl:22, xxl:26, xxxl:32, hero:40,
          w4-w9 weights }
SPACE = { xxs:2, xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, huge:48 }
RADIUS= { xs:4, sm:8, md:12, lg:16, xl:20, xxl:28, xxxl:36, full:999 }
SHADOW= { none, sm, md, lg, xl, brand, accent }
TOP   = Platform.OS === 'ios' ? 54 : 44

export function fixMediaUrl(url) — fixes localhost URLs to ngrok/codespaces
```

---

## CACHE UTILITY — src/cache.js
```javascript
// AsyncStorage cache with 5-minute TTL
getCached(key)        → returns data or null if expired
setCache(key, data)   → stores with timestamp
clearCache(key)       → removes entry

Usage:
  import { getCached, setCache } from '../cache';
  const cached = await getCached('network_attendees');
  if (cached) { setData(cached); }
  setCache('network_attendees', freshData);
```

---

## REUSABLE COMPONENTS — src/components.js
```
Card, GlassCard, Badge, Avatar, GradientAvatar,
StatBox, SectionHeader, Divider, PrimaryButton,
IconBox, FadeIn, PulsingDot
```

---

## MOBILE NAVIGATION PATTERN
```
MainApp.js:
  const [tab, setTab] = useState('home')
  const [subScreen, setSubScreen] = useState(null)
  const [subParams, setSubParams] = useState({})

Tab bar: home | schedule | qr (center) | network | admin (admins) / profile (users)

SubScreen gates in MainApp.js:
  'notifications'        → NotificationsScreen
  'edit_profile'         → EditProfileScreen
  'change_password'      → ChangePasswordScreen
  'sponsors'             → SponsorsScreen
  'speakers'             → SpokersScreen
  'chat_list'            → ChatListScreen
  'chat_room'            → ChatRoomScreen (params: conversationId)
  'connection_requests'  → ConnectionRequestsScreen

AdminTab internal navigation (useState, NOT MainApp subScreen):
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
Bulk import (from Excel):  ETD-2026-R-001  (R = Registered, from file)
Single add via admin app:  ETD-2026-S-001  (S = Single, auto-incremented)
Dummy/test users:          ETD-2026-R-010 to ETD-2026-R-109
```

---

## PARTICIPANT IMPORT SYSTEM
```
Model: ParticipantImport (staging table)
  Fields: salutation, full_name, email, registration_id,
          gender, designation, organisation, mobile,
          address, pin_code, status, error_note,
          uploaded_at, uploaded_by

Flow: Upload CSV/Excel → Preview → Confirm
  Step 1: /panel/participants/upload/
  Step 2: /panel/participants/preview/  ← shows reg_id column + email checkbox
  Step 3: /panel/participants/confirm/  ← creates User records

Email checkbox: UNCHECKED by default (for testing)
  Only sends credentials email if explicitly checked.

CSV columns:
  Salutation, Full Name, Registration ID, Email ID, Gender,
  Designation, Organisation / Institute, Mobile Number,
  Address, PIN / Postal Code

Single add: /panel/participants/add/
  → Auto-generates ETD-2026-S-XXX reg ID
  → Same email checkbox
```

---

## DUMMY DATA SYSTEM
```bash
# Seed 100 dummy participants
python manage.py seed_dummy_participants

# Remove all dummy participants
python manage.py purge_dummy_participants --confirm

# Check all dummy users + check-in status
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.checkins.models import CheckIn
User = get_user_model()
dummies = User.objects.filter(email__endswith='@test.com', role='participant').order_by('registration_id')
checked_ids = set(CheckIn.objects.filter(checkin_type='conference').values_list('user_id', flat=True))
print(f'{'REG ID':<20} {'NAME':<30} {'CHECKED IN'}')
for u in dummies:
    print(f'{u.registration_id or \"—\":<20} {u.get_full_name():<30} {\"YES\" if u.id in checked_ids else \"NO\"}')
"

# Check in all dummy users
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.checkins.models import CheckIn
User = get_user_model()
dummies = User.objects.filter(email__endswith='@test.com', role='participant')
created = 0
for u in dummies:
    _, was_created = CheckIn.objects.get_or_create(user=u, checkin_type='conference', defaults={'goodies_status': 'pending'})
    if was_created: created += 1
print(f'Checked in {created}')
"

# Reset all dummy check-ins
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.checkins.models import CheckIn
User = get_user_model()
ids = User.objects.filter(email__endswith='@test.com').values_list('id', flat=True)
deleted, _ = CheckIn.objects.filter(user_id__in=ids).delete()
print(f'Deleted {deleted}')
"

Dummy user details:
  Email:    firstname.lastname@test.com
  Password: Test@1234
  Reg IDs:  ETD-2026-R-010 to ETD-2026-R-109
  Photos:   placeholder-image-male/female.jpg
  Interests: 5 interests per user (rotating from 20 topics)
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
  GET  /api/v1/auth/users/              ← admin: list all users
  POST /api/v1/auth/users/<pk>/action/  ← warn/suspend/unsuspend
  POST /api/v1/auth/participants/create/ ← admin: create single participant

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
  GET  /api/v1/sponsors/
  GET  /api/v1/sponsors/<id>/

SPEAKERS (AllowAny):
  GET  /api/v1/speakers/
  GET  /api/v1/speakers/<pk>/

CHECKINS:
  POST /api/v1/checkins/scan/           ← conference check-in
  POST /api/v1/checkins/goodies/        ← conference kit confirm
  GET  /api/v1/checkins/status/
  GET  /api/v1/checkins/list/
  GET  /api/v1/checkins/my-qr/
  GET  /api/v1/checkins/network/        ← ONLY checked-in users visible
  GET  /api/v1/checkins/meal/status/
  POST /api/v1/checkins/meal/generate/
  POST /api/v1/checkins/meal/scan/
  POST /api/v1/checkins/meal/window/
  GET  /api/v1/checkins/meal/stats/

CHAT:
  POST /api/v1/chat/requests/send/
  GET  /api/v1/chat/requests/inbox/
  GET  /api/v1/chat/requests/sent/
  POST /api/v1/chat/requests/<id>/respond/
  POST /api/v1/chat/requests/<id>/withdraw/
  GET  /api/v1/chat/requests/count/
  POST /api/v1/chat/check/bulk/         ← ONE call for all users (replaces N calls)
  GET  /api/v1/chat/check/<user_id>/
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

## CHECK-IN SYSTEM
```
Models: CheckIn, MealPass, MealWindow

Conference Check-In:
  - Staff scans reg ID → CheckIn record created
  - Conference Kit (formerly "Goodies") tracked: pending/received/skipped
  - 10 leaderboard points awarded on first check-in
  - Already checked-in response NOW includes checkin_id (bug fixed)

Network visibility:
  - ONLY checked-in participants appear in Network tab
  - Speakers always visible (no check-in required)

Admin panel check-in list (/panel/checkins/):
  - Two tabs: "Checked In" | "Not Checked In"
  - Search by name/email/reg ID
  - Conference Kit status column (NOT "Goodies")
  - Stats: checked in count + remaining count

Admin phone check-in:
  - CheckInScreen.js: manual reg ID + camera QR scan
  - Mode tabs: "Check In" | "Scan Meal Passes"
  - Conference Kit confirm buttons (Given/Skip) in result card
  - Haptic feedback on scan result

Meal System:
  - Admin opens window → participants generate pass → staff scans
  - Push notification sent when window opens
```

---

## ADMIN PANEL (Web)
```
URL:      /panel/
Login:    /panel/login/
CSS:      Custom (base.html) — NO Bootstrap
Font:     Inter + Font Awesome 6.5.1
Theme:    Dark sidebar, white content area

HOW TEMPLATES ARE WIRED:
  confhub/urls.py:
    path('panel/', include('apps.accounts.admin_urls'))
    path('panel/checkins/', include('apps.checkins.admin_urls'))
    path('panel/speakers/', include('apps.speakers.admin_urls'))
    path('panel/sponsors/', include('apps.sponsors.admin_urls'))
    path('panel/notifications/', include('apps.notifications.admin_urls'))

  base.html:
    All panel templates extend {% extends "panel/base.html" %}
    Django TEMPLATES setting: 'DIRS': [BASE_DIR / 'templates']

  Admin views use @login_required(login_url='/panel/login/')
  Role check: request.user.role in ('super_admin', 'mgmt_admin')

  admin_required decorator defined in accounts/admin_views.py
  Used by: speakers, sponsors, notifications, events

Sidebar sections:
  Main:       Dashboard
  Management: Participants, Teams, Meal Scanner, Check-In Scanner
  Content:    Events & Schedule, Photo Moderation, Posts & Feed
  Engagement: Polls, Q&A, Leaderboard
  System:     Notifications, Sponsors, Speakers,
              User Management, Reports, Settings
```

---

## ADMIN MOBILE TAB
```
AdminTab.js — 2×2 gradient grid layout
  Card 1: Scan (green)       → CheckInScreen
  Card 2: Notifications(blue)→ NotificationsAdmin
  Card 3: Add Member (teal)  → AddParticipantScreen
  Card 4: User Mgmt (purple) → UsersAdmin

Sign Out button at bottom (with confirmation alert)
onLogout prop passed from MainApp.js

CheckInScreen features:
  - Mode tabs: Check In / Scan Meal Passes
  - Stats bar (checked in / remaining / total)
  - Manual reg ID input (auto-uppercase)
  - Camera QR scan via CameraView (expo-camera)
  - QR frame overlay with corner markers
  - Result card with user details + Conference Kit buttons
  - Haptic feedback (success/warning) on scan result
  - Meal type picker (Lunch/Dinner) in meal mode

AddParticipantScreen features:
  - Calls POST /api/v1/auth/participants/create/
  - Auto-assigns ETD-2026-S-XXX reg ID
  - Gender chip picker
  - Email credentials toggle (Switch)
```

---

## NETWORK SCREEN — PERFORMANCE
```
Problem solved: N+1 API calls (one per user) replaced with bulk endpoint

Solution:
  POST /api/v1/chat/check/bulk/
  Body: { user_ids: [...] }
  Returns: { statuses: { userId: { status, conversation_id } } }

  Status values: 'none' | 'connected' | 'pending_sent' | 'pending_received'

NetworkScreen.js optimizations:
  1. Cache-first loading (AsyncStorage, 5-min TTL)
     Keys: 'network_attendees', 'network_speakers'
  2. useEffect depends on [activeTab] ONLY — no re-fetch on every render
  3. 500ms debounced search
  4. Background refresh after showing cached data
  5. Animation delay capped at 300ms (not i*40ms unbounded)
  6. Single bulk status call per load (not N individual calls)

IMPORTANT: bulk URL must be BEFORE uuid pattern in urls.py:
  path('check/bulk/', views.bulk_connection_check, ...)   ← FIRST
  path('check/<uuid:user_id>/', views.check_connection, ...) ← SECOND
```

---

## CHAT SYSTEM
```
Models: ConnectionRequest, Conversation, Message

ConnectionRequest:
  sender, receiver, status(pending/accepted/rejected/withdrawn)
  topic (choices), custom_topic, request_type(contact/speaker_discussion)

Conversation:
  request (OneToOne FK)
  participant_a, participant_b (ForeignKey, NOT ManyToMany)
  topic, custom_topic
  muted_by_a, muted_by_b
  last_message_at

  NOTE: Filter conversations as:
    Q(participant_a=user) | Q(participant_b=user)
    NOT .filter(participants=user) — no M2M

Entry points:
  1. NetworkScreen → attendee → "Connect" → ContactCardModal
  2. NetworkScreen → Speakers tab → "Request Chat" → SpeakerRequestModal
  3. ProfileTab → "My Connections" → ChatListScreen
  4. HomeTab → "Chats" quick action → ChatListScreen

Topic choices:
  Research Collaboration, Session Discussion, Digital Libraries,
  Metadata, AI, Open Access, Networking, Career, Other
```

---

## NOTIFICATION SYSTEM
```
Push flow:
  Login → registerForPushNotifications → token saved to backend
  One token per user (old tokens deleted on new login)
  Backend sends via Expo Push API → FCM V1 → Android notification

Badge polling: every 30s via fetchBadges() in MainApp.js
  GET /api/v1/notifications/unread-count/
  GET /api/v1/chat/requests/count/
  GET /api/v1/chat/conversations/ (for total_unread)

Firebase:
  google-services.json in mobile/ (tracked in git)
  FCM V1 Service Account on Expo credentials dashboard
```

---

## SPEAKERS & SPONSORS
```
Speaker model: STANDALONE (no FK to User)
  is_keynote, is_active, display_order
  SpeakerTalk: FK to Speaker, track, talk_date, talk_time

Sponsor tiers: national_funding, platinum, silver, bronze

Both have full admin CRUD at /panel/speakers/ and /panel/sponsors/
Both have public APIs (AllowAny)
Both have mobile screens (SpokersScreen.js, SponsorsScreen.js)
```

---

## TEST CREDENTIALS
```
MOBILE APP:
  participant@test.com / Test@1234   (role: participant)
  speaker@test.com    / Test@1234   (role: speaker)
  Dummy users: firstname.lastname@test.com / Test@1234

ADMIN PANEL (/panel/login/):
  etd@admin.iitd.ac.in / Admin@1234    (role: super_admin)
```

---

## WHAT IS WORKING ✅
```
✅ Django API + ngrok tunnel + Codespaces web access
✅ Admin panel at /panel/ with custom CSS
✅ JWT auth (login, refresh, blacklist on logout)
✅ Mobile Dev Build APK (SDK 54) — all 20 native packages installed
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
✅ Registration ID: imported from file (ETD-2026-R-XXX)
✅ Single add: auto ETD-2026-S-XXX
✅ Email checkbox: unchecked = no email (for testing)
✅ Admin panel check-in list: tabs + search + Conference Kit column
✅ Admin mobile: 2×2 grid, check-in screen, meal scanner, camera QR
✅ Conference Kit (NOT "Goodies") everywhere
✅ Dummy data: 100 users with 5 research interests each
✅ Dashboard uses real data (not hardcoded)
```

---

## WHAT IS PLACEHOLDER ❌
```
❌ Schedule — hardcoded, needs real Django API
❌ Feed — hardcoded posts, needs real posts API
❌ QR code — basic display, needs real generation
❌ Photos screen — tile exists, no screen
❌ Polls screen — tile exists, no screen
❌ Leaderboard screen — tile exists, no screen
❌ Live stream — expo-av installed, feature not built
❌ Shake-to-share — expo-sensors installed, feature not built
❌ Venue map — expo-maps NOT yet installed (needs Google Maps API key)
❌ Selfie points — expo-location/media-library installed, feature not built
❌ Speaker/sponsor logos — no images uploaded yet
❌ Speaker talks — admin adds manually
```

---

## IMPORTANT RULES
```
MOBILE:
  ✗ Never downgrade Expo SDK
  ✗ Never add expo-router / React Navigation
  ✗ Never add TypeScript (.tsx files)
  ✗ Never add plugins to app.json without rebuilding APK
  ✗ Never add react-native-gesture-handler to plugins array
  ✓ All screens are .js files in src/screens/
  ✓ All styles use COLORS/FONT/SPACE/RADIUS/SHADOW from theme.js
  ✓ Reuse components from components.js
  ✓ Use cache.js for any list screen data
  ✓ Android: elevation:0 + borderWidth:1
  ✓ iOS: real shadowColor shadows
  ✓ Speaker screen file: SpokersScreen.js (NOT SpeakersScreen.js)
  ✓ New native package = new EAS build required

BACKEND:
  ✗ Never use Firebase Admin SDK for sending push
  ✗ Never use Legacy FCM API
  ✓ Push via Expo Push API only
  ✓ Conversation model uses participant_a/participant_b (NOT M2M participants)
  ✓ Conference Kit (NOT Goodies) in all UI
  ✓ Admin panel uses base.html CSS variables only
  ✓ chat/urls.py: bulk endpoint BEFORE uuid endpoint

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
In the https://bauble-aftermost-buffalo.ngrok-free.dev/panel/checkins/scanner/ i am unable to switch the tabs and the manual entry is not happening


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