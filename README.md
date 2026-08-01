

---

# Complete Project Context (v4 — Chat Ready)

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
│   │   ├── notifications/
│   │   ├── sponsors/
│   │   ├── speakers/
│   │   ├── conferences/
│   │   ├── events/
│   │   ├── photos/
│   │   ├── polls/
│   │   ├── posts/
│   │   ├── checkins/
│   │   └── leaderboard/
│   ├── templates/panel/
│   ├── requirements.txt
│   ├── db.sqlite3
│   └── manage.py
├── mobile/
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   ├── eas.json
│   ├── google-services.json        ← Firebase config (tracked in git)
│   ├── .easignore
│   ├── src/
│   │   ├── theme.js
│   │   ├── components.js
│   │   ├── MainApp.js
│   │   ├── notifications.js
│   │   └── screens/
│   │       ├── LoginScreen.js
│   │       ├── HomeTab.js
│   │       ├── ScheduleTab.js
│   │       ├── QRScreen.js
│   │       ├── FeedScreen.js
│   │       ├── NetworkScreen.js
│   │       ├── ProfileTab.js
│   │       ├── NotificationsScreen.js
│   │       ├── EditProfileScreen.js
│   │       ├── ChangePasswordScreen.js
│   │       ├── SponsorsScreen.js
│   │       ├── SponsorDetailScreen.js
│   │       ├── SpokersScreen.js
│   │       ├── SpeakerDetailScreen.js
│   │       └── admin/
│   │           ├── AdminTab.js
│   │           ├── NotificationsAdmin.js
│   │           └── UsersAdmin.js
│   └── node_modules/
├── _backup/sdk51_before_upgrade/   ← SDK 51 backup
├── docker-compose.yml
├── Makefile
├── start.sh
└── .devcontainer/
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
  State:         useState (no Zustand)
  API:           fetch() with JWT Bearer token
  Icons:         @expo/vector-icons (Ionicons)
  Gradient:      expo-linear-gradient ~15.0.8
  Push:          expo-notifications ~0.32.17
  Device:        expo-device ~8.0.10
  ImagePicker:   expo-image-picker ~17.0.11
  DevClient:     expo-dev-client ~6.0.21
  StatusBar:     expo-status-bar ~3.0.9
  SVG:           react-native-svg 15.12.1

BACKEND:
  Framework:   Django 4.2.9 + Django REST Framework
  Auth:        JWT via djangorestframework-simplejwt
  User model:  Custom (UUID pk, email as USERNAME_FIELD, role field)
  Database:    SQLite (dev)
  Push:        Expo Push API (NOT Firebase Admin SDK for sending)
               Uses FCM V1 Service Account via Expo credentials dashboard
  Admin panel: Custom Django MVT (NO Bootstrap, custom CSS in base.html)
  Media:       ImageField uploads served via static(MEDIA_URL, MEDIA_ROOT)

INFRASTRUCTURE:
  Dev:     GitHub Codespaces
  Docker:  PostgreSQL:5432, Redis:6379, MinIO:9000
  Ports:   Django:8000, Expo:8081
  Tunnel:  ngrok → Django (new URL every restart)
           Expo tunnel → phone via Dev Build APK

BUILD & DEPLOYMENT:
  Build tool:  EAS (Expo Application Services)
  EAS CLI:     21.4.0+
  Profile:     development (internal distribution APK)
  Owner:       coder2026s-team
  Project ID:  afa28d7e-10d5-4e85-bed4-783b7371a56b
  Android pkg: com.etd2026.app
  iOS bundle:  com.etd2026.app
  APK type:    Development build (NOT Expo Go)
               → supports push notifications
               → JS reloads live via expo start --tunnel
               → no rebuild needed for JS/API changes
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
  "typescript": "~5.9.2",
  "@types/react": "~19.1.10",
  "babel-preset-expo": "~54.0.10",
  "qrcode-generator": "^1.4.4"
}
```

---

## STARTUP SEQUENCE (Every Codespace restart)
```bash
# Terminal 1 — Docker services
cd /workspaces/eventapp && docker compose up -d

# Terminal 2 — Django backend
cd /workspaces/eventapp/backend && python manage.py runserver 0.0.0.0:8000

# Terminal 3 — ngrok tunnel
ngrok http 8000
# Copy: https://XXXX.ngrok-free.app → update API_URL in src/theme.js

# Terminal 4 — Expo (for live JS reload to Dev APK)
cd /workspaces/eventapp/mobile && npx expo start --tunnel --port 8081 --clear

# Phone: Open ETD 2026 Dev APK → scan QR → live reload active
```

---

## DEV BUILD WORKFLOW
```
BUILT ONCE via EAS:
  cd mobile && eas build --platform android --profile development
  → Download APK → Install on Android phone
  → APK contains all native modules

DAILY DEVELOPMENT (no rebuild needed):
  1. Start Django + ngrok + expo start --tunnel
  2. Open Dev APK on phone → scan QR once
  3. Edit any .js file → phone reloads in ~2 seconds
  4. New backend endpoints → no rebuild
  5. New screens → no rebuild
  6. New features → no rebuild

REBUILD ONLY WHEN:
  ✗ npm install <new-native-package>
  ✗ Changes to app.json plugins array
  ✗ Changes to google-services.json

PUSH NOTIFICATIONS SETUP:
  ✅ Firebase project: ETD2026 (console.firebase.google.com)
  ✅ google-services.json: mobile/google-services.json (tracked in git)
  ✅ FCM V1 Service Account uploaded to Expo credentials dashboard
  ✅ Expo Push API used for sending (NOT Firebase Admin SDK directly)
  ✅ Token cleanup: register_token view deletes old tokens on new login
  ✅ One token per user enforced in backend
```

---

## EAS CONFIGURATION
```json
// mobile/eas.json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": { "autoIncrement": true }
  }
}
```

---

## APP.JSON (Current)
```json
{
  "expo": {
    "name": "ETD 2026",
    "slug": "etd2026",
    "version": "1.0.0",
    "sdkVersion": "54.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": ["**/*"],
    "owner": "coder2026s-team",
    "extra": {
      "eas": { "projectId": "afa28d7e-10d5-4e85-bed4-783b7371a56b" }
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.etd2026.app"
    },
    "android": {
      "package": "com.etd2026.app",
      "googleServicesFile": "./google-services.json"
    },
    "scheme": "etd2026",
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/icon.png",
        "color": "#0333b6",
        "sounds": []
      }],
      "expo-image-picker",
      "expo-dev-client"
    ]
  }
}
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
COLORS.error        = '#ef4444'
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

FONT  = { micro:9, xs:11, sm:13, base:15, md:16, lg:18, xl:22, xxl:26,
          xxxl:32, hero:40, w4-w9 }
SPACE = { xxs:2, xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, huge:48 }
RADIUS= { xs:4, sm:8, md:12, lg:16, xl:20, xxl:28, xxxl:36, full:999 }
SHADOW= { none, sm, md, lg, xl, brand, accent }
TOP   = Platform.OS === 'ios' ? 54 : 44

API_URL     = 'https://XXXX.ngrok-free.app/api/v1'  ← CHANGES on ngrok restart
API_HEADERS = { Content-Type, Accept, ngrok-skip-browser-warning }
```

---

## REUSABLE COMPONENTS — src/components.js
```
Card            — white surface, shadow, optional onPress
GlassCard       — frosted glass for dark/gradient backgrounds
Badge           — colored pill label
Avatar          — initials circle
GradientAvatar  — gradient initials circle (brand colors)
StatBox         — number + label (light/dark variant)
SectionHeader   — title + optional action link
Divider         — 1px horizontal line
PrimaryButton   — gradient button with loading state
IconBox         — icon inside colored rounded box
FadeIn          — animate-in wrapper (opacity + translateY)
PulsingDot      — animated live indicator dot
```

---

## MOBILE NAVIGATION PATTERN
```
MainApp.js holds:
  const [tab, setTab] = useState('home')
  const [subScreen, setSubScreen] = useState(null)

Current subScreen gates:
  'notifications'   → NotificationsScreen
  'edit_profile'    → EditProfileScreen
  'change_password' → ChangePasswordScreen
  'sponsors'        → SponsorsScreen
  'speakers'        → SpokersScreen

To add NEW screen:
  1. Create src/screens/NewScreen.js ({ tokens, onBack, ... })
  2. Import in MainApp.js
  3. Add subScreen gate
  4. Pass callback to HomeTab or relevant tab
  5. Wire HomeTab Quick Actions if needed

HomeTab Quick Actions:
  Schedule, Sponsors, Speakers, Photos,
  Polls, Feed, Directory, Leaderboard
  (Schedule/Photos/Polls/Feed/Directory/Leaderboard have no onPress yet)
```

---

## USER MODEL — apps/accounts/models.py
```python
class User(AbstractBaseUser, PermissionsMixin):
    id                  = UUIDField(primary_key=True)
    email               = EmailField(unique=True)
    registration_id     = CharField(50, unique=True, blank, null)
    role                = CharField(choices=[
                            super_admin, mgmt_admin, team_head,
                            staff, speaker, participant])
    first_name          = CharField(100)
    last_name           = CharField(100)
    phone               = CharField(20, blank)
    affiliation         = CharField(200, blank)
    bio                 = TextField(blank)
    designation         = CharField(200, blank)
    gender              = CharField(20, blank)
    research_interests  = TextField(blank)  ← comma-separated
    profile_photo       = ImageField(upload_to='profiles/', blank, null)
    linkedin_url        = URLField(blank)
    show_phone          = BooleanField(default=False)
    show_linkedin       = BooleanField(default=True)
    must_change_password = BooleanField(default=True)
    profile_complete    = BooleanField(default=False)
    warning_note        = TextField(blank)
    suspended_reason    = TextField(blank)
    is_active           = BooleanField(default=True)
    is_staff            = BooleanField(default=False)
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
```

---

## NOTIFICATION SYSTEM
```
Models:
  DeviceToken:      user, token(unique), platform, is_active, created_at, updated_at
  Notification:     title, body, data(JSON), target_type, target_role,
                    target_user, status, sent_count, failed_count, sent_by
  UserNotification: notification(FK), user(FK), delivered, read,
                    delivered_at, read_at

Push Flow:
  1. Login → registerForPushNotifications(access_token)
  2. Old tokens deleted, new token saved (one per user enforced)
  3. Token format: ExponentPushToken[xxxx]
  4. Backend sends via Expo Push API (exp.host/--/api/v2/push/send)
  5. Expo delivers via FCM V1 (service account on Expo dashboard)
  6. UserNotification created → app polls unread-count every 30s

FCM Setup (REQUIRED for Dev Build):
  ✅ Firebase project created (console.firebase.google.com)
  ✅ google-services.json in mobile/ (tracked in git)
  ✅ FCM V1 Service Account JSON uploaded to Expo credentials
  ✅ Legacy FCM API NOT used (deprecated by Google June 2024)
```

---

## SPEAKERS FEATURE
```
Models:
  Speaker:     title, first_name, last_name, designation, institute,
               country, bio, photo, email, website_url, linkedin_url,
               google_scholar_url, researchgate_url, twitter_url,
               is_keynote, is_active, display_order
               @property: full_name, initials, photo_url

  SpeakerTalk: speaker(FK), title, abstract, track, talk_date,
               talk_time, display_order

API:
  GET /api/v1/speakers/       ← keynotes/regular split + total
  GET /api/v1/speakers/<pk>/  ← full detail with talks[]

Admin Panel:
  /panel/speakers/              ← card grid
  /panel/speakers/new/          ← create
  /panel/speakers/<pk>/edit/    ← edit + inline talks
  /panel/speakers/<pk>/delete/
  /panel/speakers/<pk>/talks/new/
  /panel/speakers/talks/<pk>/delete/

Mobile:
  SpokersScreen.js       ← dark gradient, animated cards
  SpeakerDetailScreen.js ← parallax hero, bio/talks/social

Note: Speaker model is STANDALONE (no FK to User model)
      Speakers with user accounts use User.role = 'speaker'
      These are separate — no automatic link
```

---

## SPONSORS FEATURE
```
Model: Sponsor (name, tier, logo, description, website_url,
                contact_email, contact_phone, address,
                linkedin/twitter/facebook/instagram/youtube_url,
                partnership_details, display_order, is_active)

Tiers: national_funding, platinum, silver, bronze

API:
  GET /api/v1/sponsors/      ← grouped by tier
  GET /api/v1/sponsors/<id>/

Admin: /panel/sponsors/ (full CRUD)
Mobile: SponsorsScreen.js + SponsorDetailScreen.js
```

---

## ADMIN PANEL
```
URL:      /panel/
Login:    /panel/login/
CSS:      Custom (base.html) — NO Bootstrap
Font:     Inter + Font Awesome 6.5.1
Theme:    Dark sidebar (#1A1D21→#2D3139), white content area

CSS Variables:
  --primary #1A73E8, --success #0D9F6E, --warning #F59E0B,
  --danger #DC2626, --bg #F0F2F5, --surface #FFFFFF,
  --text #1A1D21, --text-secondary #5F6368, --border #E1E5EB

Reusable classes:
  .card, .card-header, .card-body
  .btn, .btn-primary, .btn-secondary, .btn-danger, .btn-sm
  .form-label, .form-control
  .badge-success, .badge-warning, .badge-danger, .badge-info
  .alert-success, .alert-warning, .alert-error
  .data-table, .empty-state, .page-header, .stats-grid, .stat-card

Sidebar Sections:
  Main:       Dashboard
  Management: Participants, Teams, Meal Scanner, Check-In Scanner
  Content:    Events & Schedule, Photo Moderation, Posts & Feed
  Engagement: Polls, Q&A Manager, Leaderboard
  System:     Notifications, Sponsors, Speakers,
              User Management, Reports, Settings
```

---

## TEST CREDENTIALS
```
MOBILE APP:
  participant@test.com / Test@1234   (role: participant)
  speaker@test.com    / Test@1234   (role: speaker)

ADMIN PANEL (/panel/login/):
  etd@admin.iitd.ac.in / Admin@1234    (role: super_admin)
```

---

## IMPORTANT RULES
```
MOBILE (SDK 54):
  ✗ Never downgrade Expo SDK
  ✗ Never add expo-router / React Navigation
  ✗ Never add TypeScript (.tsx files)
  ✗ Never add plugins to app.json without rebuilding APK
  ✓ All screens are .js files in src/screens/
  ✓ All styles use COLORS/FONT/SPACE/RADIUS/SHADOW from theme.js
  ✓ Reuse components from components.js
  ✓ Android: elevation:0 + borderWidth:1
  ✓ iOS: real shadowColor shadows
  ✓ Dark screens: LinearGradient + StatusBar barStyle="light-content"
  ✓ Animations: Animated.Value + useRef, useNativeDriver:true
  ✓ Speaker screen file: SpokersScreen.js (NOT SpeakersScreen.js)
  ✓ New native package = new EAS build required

BACKEND:
  ✗ Never use Firebase Admin SDK for sending push
  ✗ Never use Legacy FCM API (deprecated)
  ✓ Push via Expo Push API only
  ✓ FCM V1 via service account on Expo credentials dashboard
  ✓ One DeviceToken per user (old tokens deleted on new login)
  ✓ Admin panel uses base.html CSS variables only
  ✓ Admin views use @admin_required decorator
  ✓ New apps: backend/apps/<name>/ with urls.py + admin_urls.py
  ✓ Wire into confhub/urls.py under api/v1/ and panel/

DEVELOPMENT:
  ✓ ngrok URL changes on restart → update API_URL in theme.js
  ✓ JS changes → no rebuild (live reload via expo start --tunnel)
  ✓ New native package → rebuild APK via eas build
  ✓ Give code in EPF heredoc commands (cat > file <<'EOF')
  ✓ Ask before coding if unclear
  ✓ Backup before major changes: _backup/ folder + git commit
```

---

## WHAT IS WORKING ✅
```
✅ Django API on port 8000 + ngrok tunnel
✅ Admin panel at /panel/ with custom CSS
✅ JWT auth (login, refresh, blacklist on logout)
✅ Mobile Dev Build APK (SDK 54) on Android phone
✅ Live JS reload via expo start --tunnel (no rebuild for JS changes)
✅ All 5 tabs + bottom tab bar with floating QR button
✅ Splash screen, login screen
✅ Push notifications end-to-end:
     Token registration (one per user, old deleted on login)
     Expo Push API → FCM V1 → Android system notification
     In-app notification screen
     Bell badge polling every 30s
     Read/unread tracking
✅ Warning modal (warning_note on login)
✅ Edit Profile, Change Password
✅ SPONSORS: full CRUD admin + public API + mobile screens
✅ SPEAKERS: full CRUD admin + inline talks + public API + mobile screens
✅ Network screen: attendee list with research interest filter
✅ Firebase: google-services.json configured, FCM V1 service account on Expo
```

---

## WHAT IS STATIC / PLACEHOLDER ❌
```
❌ Chat feature — NOT built yet (next to build)
❌ Schedule — hardcoded, needs real Django API
❌ Feed — hardcoded posts, needs real posts API
❌ QR code — placeholder, needs real QR generation
❌ Photos — Quick Action tile exists, no screen
❌ Polls — Quick Action tile exists, no screen
❌ Directory — Quick Action tile exists, no screen
❌ Leaderboard — Quick Action tile exists, no screen
❌ Check-in — admin menu item, no mobile functionality
❌ Sponsor logos — seeded but no images uploaded
❌ Speaker photos — seeded but no images uploaded
❌ Speaker talks — empty, admin adds manually
```

---

## NEXT FEATURE TO BUILD — CHAT
```
DESIGN DECISIONS (confirmed):
  Transport:     REST polling (3s interval) — NO WebSockets
  Speaker chat:  Via User.role='speaker' (NOT Speaker model)
                 Speakers found in Network screen sub-tab
  Contact card:  Short card (Name, Designation, Institute,
                 Photo, Research Interests)
  Animation:     Card slides right with paper-plane trail → "Sent!" badge
  Topic picker:  Modal sheet (Option A)
  Admin scope:   Full audit (conversations + messages + requests)
  File sharing:  expo-image-picker (already installed, no rebuild needed)
                 PDFs via expo-document-picker (needs install = rebuild)

TOPIC CHOICES:
  Research Collaboration, Session Discussion, Digital Libraries,
  Metadata, AI, Open Access, Networking, Career, Other (custom text)

MODELS NEEDED:
  ConnectionRequest   ← contact card + speaker discussion request
  Conversation        ← created after acceptance
  Message             ← text + image (PDF deferred — needs rebuild)

ENTRY POINTS (all 4 confirmed):
  1. NetworkScreen → tap attendee → "Send Contact Card"
  2. NetworkScreen → Speakers sub-tab → "Send Discussion Request"
  3. ProfileTab → "My Connections" → open chat
  4. HomeTab → new "Chats" Quick Action tile

ADMIN PANEL:
  /panel/chat/            ← all conversations audit
  /panel/chat/<id>/       ← full message thread

MOBILE SCREENS TO BUILD:
  ChatListScreen.js         ← conversations list
  ChatRoomScreen.js         ← messages + image send
  ContactCardModal.js       ← card send with animation
  TopicPickerModal.js       ← radio topic selector
  SpeakerRequestModal.js    ← discussion request to speaker
  ConnectionRequestsScreen.js ← pending requests inbox
```

---

## CURRENT ngrok URL
```
Update on every Codespace restart in:
  /workspaces/eventapp/mobile/src/theme.js → API_URL
```

---

## GIT
```
Remote: https://github.com/sudhanshu1907/eventapp
Branch: main
Last commit: fix: add google-services.json for FCM push
```