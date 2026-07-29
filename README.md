```
# Complete Project Context

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
│   │   ├── settings.py          ← INSTALLED_APPS includes 'apps.sponsors'
│   │   ├── urls.py              ← includes sponsors API + panel routes
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/
│   │   │   ├── models.py         ← Custom User (UUID pk, email login, role field)
│   │   │   ├── views.py          ← login, me, change_password, logout APIs
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   ├── admin_urls.py
│   │   │   ├── admin_views.py    ← Dashboard, login, logout, admin_required decorator
│   │   │   └── backends.py       ← EmailBackend
│   │   ├── notifications/
│   │   │   ├── models.py         ← DeviceToken, Notification, UserNotification
│   │   │   ├── fcm.py            ← Expo Push API sender (NOT Firebase direct)
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   ├── admin_views.py
│   │   │   └── admin_urls.py
│   │   ├── sponsors/             ← NEW (built this session)
│   │   │   ├── models.py         ← Sponsor model (see SPONSORS section)
│   │   │   ├── serializers.py    ← SponsorListSerializer, SponsorDetailSerializer
│   │   │   ├── views.py          ← list_sponsors (grouped), sponsor_detail
│   │   │   ├── urls.py           ← API routes
│   │   │   ├── admin_views.py    ← Panel CRUD (list/create/edit/delete)
│   │   │   ├── admin_urls.py     ← Panel routes
│   │   │   ├── apps.py
│   │   │   └── migrations/
│   │   ├── conferences/          ← ConferenceSetting singleton model
│   │   ├── events/
│   │   ├── photos/
│   │   ├── polls/
│   │   ├── posts/
│   │   ├── checkins/
│   │   └── leaderboard/
│   ├── templates/
│   │   └── panel/
│   │       ├── base.html          ← Custom CSS admin panel (NO Bootstrap), sidebar has Sponsors link
│   │       ├── dashboard.html
│   │       ├── login.html
│   │       ├── notifications.html
│   │       ├── sponsors_list.html ← NEW: tier-grouped grid with edit/delete
│   │       └── sponsor_form.html  ← NEW: create/edit form w/ logo upload
│   ├── seed_sponsors.py           ← NEW: seeds 12 sponsors from ETD website
│   ├── requirements.txt
│   ├── db.sqlite3
│   └── manage.py
├── mobile/
│   ├── App.js                     ← Root: splash → login → app + notification listeners
│   ├── src/
│   │   ├── theme.js               ← ALL colors, fonts, spacing, shadows + API_URL/API_HEADERS
│   │   ├── components.js          ← Card, Badge, Avatar, GradientAvatar, StatBox, FadeIn, PulsingDot etc.
│   │   ├── MainApp.js             ← Tab container + subScreen gate (notifications/edit_profile/change_password/sponsors)
│   │   ├── notifications.js       ← Expo push token registration + listeners
│   │   └── screens/
│   │       ├── LoginScreen.js
│   │       ├── HomeTab.js         ← Bell + unread badge, Quick Actions (now includes Sponsors)
│   │       ├── ScheduleTab.js
│   │       ├── QRScreen.js
│   │       ├── FeedScreen.js
│   │       ├── NetworkScreen.js
│   │       ├── ProfileTab.js
│   │       ├── NotificationsScreen.js
│   │       ├── EditProfileScreen.js
│   │       ├── ChangePasswordScreen.js
│   │       ├── SponsorsScreen.js      ← NEW: dark gradient, tier sections, tile grid, pull-refresh
│   │       ├── SponsorDetailScreen.js ← NEW: hero + about/partnership/contact/social cards
│   │       └── admin/AdminTab.js
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
  Push:        Expo Push API (NOT Firebase Admin SDK for sending)
  Admin panel: Custom Django MVT (NO Bootstrap, custom CSS in base.html)
  Media:       ImageField uploads served via static(MEDIA_URL, MEDIA_ROOT) in urls.py

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
COLORS.brandLight   // light blue tint (used for icon backgrounds)
COLORS.accent       = '#f59e0b'   // Amber gold
COLORS.accentDark   = '#d97706'
COLORS.success      = '#10b981'
COLORS.error        = '#ef4444'
// Also: purple, teal, rose + their *Light variants; text, textSec, textTer,
// surface, border, borderLight, textInverse

FONT  = { xs, sm, base, md, lg, xl, xxl, w5, w6, w7, w8, w9 }
SPACE = { xs, sm, md, lg, xl, xxl }
RADIUS= { sm, md, lg, xl, full }
SHADOW= { sm, md, lg, accent }  // Platform.select: iOS real shadows, Android elevation/border

// API config also lives in theme.js:
API_URL     = 'https://bauble-aftermost-buffalo.ngrok-free.dev/api/v1'  ← CHANGES on ngrok restart
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

## MOBILE NAVIGATION PATTERN (IMPORTANT for new screens)
```
MainApp.js holds:
  const [tab, setTab] = useState('home')          ← bottom tabs
  const [subScreen, setSubScreen] = useState(null) ← full-screen overlays

subScreen gates (checked before SCREENS render):
  'notifications'   → <NotificationsScreen tokens onBack={() => setSubScreen(null)} />
  'edit_profile'    → <EditProfileScreen user tokens onBack onProfileUpdated />
  'change_password' → <ChangePasswordScreen user tokens onDone onLogout />
  'sponsors'        → <SponsorsScreen tokens onBack={() => setSubScreen(null)} />

To add a NEW screen:
  1. Create src/screens/NewScreen.js (receives { tokens, onBack, ... })
  2. Import in MainApp.js
  3. Add: if (subScreen === 'new_screen') return <NewScreen ... onBack={() => setSubScreen(null)} />
  4. Pass a callback down: HomeTab gets onOpenXxx={() => setSubScreen('new_screen')}
  5. Trigger from HomeTab Quick Actions (QUICK array items can have action: 'xxx')

HomeTab Quick Actions currently:
  Schedule, Photos, Polls, Feed, Directory, Leaderboard, Sponsors(action:'sponsors')
  NOTE: Photos/Polls/Directory/Leaderboard tiles have NO onPress wired yet.
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
  POST /api/v1/notifications/send/              ← admin only
  GET  /api/v1/notifications/history/           ← admin only
  GET  /api/v1/notifications/my/
  POST /api/v1/notifications/mark-read/         ← { notification_ids: [...] }
  POST /api/v1/notifications/mark-all-read/
  GET  /api/v1/notifications/unread-count/      ← { unread_count: N }

SPONSORS (NEW — both AllowAny, no auth needed):
  GET  /api/v1/sponsors/            ← { groups: [ {tier, tier_display, sponsors:[...]}, ... ] }
                                      grouped in order: national_funding, platinum, silver, bronze
                                      each sponsor: id, name, tier, tier_display, logo_url,
                                                    website_url, display_order
  GET  /api/v1/sponsors/<id>/       ← full detail: + description, contact_email, contact_phone,
                                      address, linkedin_url, twitter_url, facebook_url,
                                      instagram_url, youtube_url, partnership_details,
                                      is_active, created_at, updated_at
                                      (404 if not found or is_active=False)
```

---

## SPONSORS FEATURE (built & working)

### Model — apps/sponsors/models.py
```python
class Sponsor(models.Model):
    TIER_CHOICES = [
        ('national_funding', 'National Funding Agency'),
        ('platinum',         'Platinum Sponsor'),
        ('silver',           'Silver Sponsor'),
        ('bronze',           'Bronze Sponsor'),
    ]
    name        = CharField(200)
    tier        = CharField(32, choices=TIER_CHOICES, db_index=True)
    logo        = ImageField(upload_to='sponsors/logos/', blank=True, null=True)
    description = TextField(blank=True)
    website_url = URLField(blank=True)
    contact_email = EmailField(blank=True)
    contact_phone = CharField(40, blank=True)
    address     = CharField(400, blank=True)
    linkedin_url, twitter_url, facebook_url, instagram_url, youtube_url = URLField(blank=True)
    partnership_details = TextField(blank=True)   # benefits shown on detail page
    display_order = PositiveIntegerField(default=0)  # lower = first within tier
    is_active   = BooleanField(default=True)
    created_at, updated_at

    Meta: ordering = ['tier', 'display_order', 'name']
```

### Admin Panel (custom MVT, NOT Django admin site)
```
Routes (apps/sponsors/admin_urls.py, included under /panel/):
  /panel/sponsors/                          ← sponsors_panel (list, grouped by tier)
  /panel/sponsors/new/                      ← sponsor_create (GET form / POST)
  /panel/sponsors/<id>/edit/                ← sponsor_edit
  /panel/sponsors/<id>/delete/              ← sponsor_delete (POST only, CSRF)

Views use @admin_required decorator (imported from apps.accounts.admin_views).
Forms are plain HTML POST + multipart (logo file upload), no DRF.
Templates: panel/sponsors_list.html, panel/sponsor_form.html (extend panel/base.html).
Sidebar: "Sponsors" link with fa-handshake icon in System section of base.html.
Active detection: {% if 'sponsor' in request.resolver_match.url_name %}active{% endif %}
```

### Mobile Screens
```
SponsorsScreen.js
  - Dark blue gradient bg (#0a1a5e → #0333b6), light status bar
  - Header: back button + "Our Sponsors"
  - Hero text: "ETD 2026 · IIT Delhi" / "Powered by our partners"
  - TierSection per group: frosted card (rgba white 0.06), accent bar + tier title
  - LogoTile: WHITE tiles on dark bg, logo image or name fallback
  - Dynamic tile sizing: platinum 1-2 cols (h110), national 1-3 (h100),
    silver 2 cols, bronze 3 cols (h80)
  - Pull-to-refresh, loading spinner, empty state
  - Tap tile → setSelectedId → renders SponsorDetailScreen

SponsorDetailScreen.js
  - Hero gradient header: back btn + tier badge + white logo box + name
  - Cards (white, rounded): About (description), Partnership, Contact, Connect
  - InfoRow: icon + label + value, tappable (Linking.openURL / mailto / tel)
  - SocialBtn: round colored buttons (linkedin/twitter/facebook/instagram/youtube)
  - Sections hidden if their data is empty
```

### Seed Data (backend/seed_sponsors.py — already run)
```
national_funding: Anusandhan National Research Foundation
platinum:         Clarivate
silver:           VIR Softech, DrillBit
bronze:           IEEE, iGroup, Packt, BSB Edge, World Scientific,
                  Cambridge University Press, Springer Nature, KGL Accucoms
LOGOS: currently EMPTY — admin must upload via /panel/sponsors/ (user will do this manually)
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
  @property delivered_count / read_count  ← from UserNotification

UserNotification
  notification (FK), user (FK), delivered (bool), read (bool)
  delivered_at, read_at, created_at
  unique_together: [notification, user]
```

---

## PUSH NOTIFICATION FLOW
```
1. Login → registerForPushNotifications(access_token) → ExponentPushToken[xxxx]
2. POST /api/v1/notifications/register-token/ → DeviceToken saved
3. Admin composes at /panel/notifications/ → fcm.py POSTs to Expo Push API
4. UserNotification created (delivered=True)
5. App: NotificationsScreen lists /my/, tap → /mark-read/, bell badge polls /unread-count/ every 30s
6. Admin panel shows 👁 read count per notification
TOKEN FORMAT: ExponentPushToken[xxxx] (Expo Go). Raw FCM only in standalone builds.
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

ADMIN PANEL (URL: /panel/login/):
  admin@confhub.com   / Admin@1234  (role: super_admin)
  Sponsors panel: /panel/sponsors/
  Notifications panel: /panel/notifications/
```

---

## ADMIN PANEL STRUCTURE
```
base.html — Custom CSS, dark sidebar, Inter font, Font Awesome icons
  CSS Variables: --primary #1A73E8, --success, --danger, --warning, --bg, --surface,
                 --text, --text-secondary, --text-tertiary, --border
  Reusable classes: .card, .card-header, .card-body, .btn(.btn-primary/-secondary/-danger/-sm),
                    .form-label, .form-control, .badge-*, .alert-*, .data-table,
                    .empty-state, .page-header, .stats-grid, .stat-card

Sidebar sections:
  Main:       Dashboard
  Management: Participants, Teams, Meal Scanner, Check-In Scanner
  Content:    Events & Schedule, Photo Moderation, Posts & Feed
  Engagement: Polls, Q&A Manager, Leaderboard
  System:     Notifications, Sponsors (/panel/sponsors/), User Management,
              Reports, Settings (/panel/settings/conference/)
```

---

## DJANGO SETTINGS (Key)
```python
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ['https://*.app.github.dev', 'http://localhost:8000',
                        'https://*.ngrok-free.app', 'https://*.ngrok-free.dev']
AUTH_USER_MODEL = 'accounts.User'
INSTALLED_APPS includes: 'apps.notifications', 'apps.sponsors'
SIMPLE_JWT: ACCESS_TOKEN = 24h, REFRESH = 30 days
MEDIA served via: ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## IMPORTANT RULES (DO NOT BREAK)
```
MOBILE:
  ✗ Never upgrade Expo SDK (stay on 51)
  ✗ Never add expo-router / React Navigation — use subScreen useState pattern
  ✗ Never add TypeScript (.tsx files)
  ✗ Never add plugins to app.json that don't exist
  ✓ All screens are .js files in src/screens/, receive { tokens, onBack }
  ✓ All styles use COLORS/FONT/SPACE/RADIUS/SHADOW from src/theme.js
  ✓ Reuse Card, Badge, GradientAvatar, FadeIn, PulsingDot from src/components.js
  ✓ Android: elevation:0 + borderWidth:1 | iOS: real shadowColor shadows
  ✓ Dark screens: LinearGradient + StatusBar barStyle="light-content"

BACKEND:
  ✗ Never use Firebase Admin SDK for sending (use Expo Push API)
  ✓ Push tokens are ExponentPushToken[...] format in Expo Go
  ✓ Admin panel uses base.html CSS variables/classes only (no Bootstrap)
  ✓ Admin views use @admin_required from apps.accounts.admin_views
  ✓ CSRF must work via ngrok (CSRF_TRUSTED_ORIGINS includes *.ngrok-free.dev)
  ✓ New apps go in backend/apps/<name>/ with urls.py + admin_urls.py,
    wired into confhub/urls.py under api/v1/ and panel/

DEVELOPMENT:
  ✓ ngrok URL changes on every restart → update API_URL in src/theme.js
  ✓ Expo project ID: afa28d7e-10d5-4e85-bed4-783b7371a56b
  ✓ Give code in EPF heredoc commands (cat > file <<'EOF') so user can paste safely
  ✓ Ask before coding if unclear; ask for files if needed
```

---

## WHAT IS WORKING
```
✅ Django API on port 8000 + ngrok tunnel
✅ Admin panel at /panel/ with custom CSS
✅ JWT auth (login, refresh, blacklist on logout)
✅ Mobile app on phone via Expo Go (SDK 51)
✅ All 5 tabs + bottom tab bar with floating QR button
✅ Splash screen, login screen
✅ Push notifications end-to-end (register → send → deliver → read tracking → admin counts)
✅ NotificationsScreen + bell badge polling
✅ Edit Profile, Change Password screens
✅ SPONSORS (complete):
   - Sponsor model + migrations + seeded data (12 sponsors, logos pending upload)
   - Public API: grouped list + detail (AllowAny)
   - Admin panel: /panel/sponsors/ full CRUD with logo file upload,
     tier grouping, display order, active toggle
   - Mobile SponsorsScreen (dark gradient, tier tiles, pull-refresh)
   - Mobile SponsorDetailScreen (hero, about, partnership, contact, social links)
   - Entry point: HomeTab Quick Actions → "Sponsors" tile
```

---

## WHAT IS STATIC / PLACEHOLDER (To build next)
```
❌ Schedule — hardcoded data, needs real Django API
❌ Feed — hardcoded posts, needs real posts API
❌ QR code — placeholder icon, needs real QR generation
❌ Photos — Quick Action tile exists, no screen / no onPress
❌ Polls — Quick Action tile exists, no screen / no onPress
❌ Directory — Quick Action tile exists, no screen / no onPress
❌ Leaderboard — Quick Action tile exists, no screen / no onPress
❌ Check-in — admin menu item, no functionality
❌ User stats (points, rank) — from leaderboard API but may be empty
❌ Sponsor logos — seeded sponsors have NO logo images yet (admin uploads manually)
❌ Most admin panel sidebar items still href="#"
```

---

## PLANNED SPONSOR IMPROVEMENTS (proposed, NOT built — candidates for next work)
```
HIGH VALUE:
  1. Sponsor analytics — log detail-page views, show 👁 count per sponsor in panel
  2. sponsored_by FK on Event — "Sponsored by X" on schedule cards + sessions on detail page
  3. booth_number field — show booth pill on tile + detail page
  4. "Become a Sponsor" gradient CTA card at bottom of SponsorsScreen (mailto/website)
VISUAL:
  5. Tier-styled tiles (platinum shimmer / silver metallic / bronze amber)
  6. Press animation + FadeIn on tiles
  7. GradientAvatar-style initials fallback instead of plain text
  8. Skeleton shimmer loaders
VISIBILITY:
  9. Home tab auto-scroll logo marquee → opens SponsorsScreen
 10. AsyncStorage cache for instant/offline load
 11. Share button on detail page
BIG:
 12. Booth QR check-in → leaderboard points (ties into checkins + leaderboard apps)
 13. Sponsor promo codes / giveaways
 14. Admin ↑/↓ reorder buttons instead of typing display_order
 15. Phone-mockup preview in admin panel
```

---

## CURRENT ngrok URL (Changes on restart)
```
Django API: https://bauble-aftermost-buffalo.ngrok-free.dev/api/v1
            ↑ Update in: /workspaces/eventapp/mobile/src/theme.js → API_URL
```

---

## PACKAGE VERSIONS
```json
MOBILE (package.json):
  expo ~51.0.39, expo-linear-gradient ~13.0.2, expo-notifications ~0.28.19,
  expo-device ~6.0.2, expo-status-bar ~1.12.1, react 18.2.0, react-native 0.74.5

BACKEND (requirements.txt key):
  Django==4.2.9, djangorestframework, djangorestframework-simplejwt,
  django-cors-headers, Pillow (for ImageField), firebase-admin==7.5.0 (installed, unused)
```
```
