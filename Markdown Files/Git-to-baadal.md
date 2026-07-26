# ConfHub — Complete Local Setup on IIT Delhi Baadal VM

---

## Part 1: Understanding the Architecture Change

```
CURRENT (Codespaces):                    TARGET (Baadal VM):
─────────────────────────────────────    ─────────────────────────────────
GitHub Codespaces (remote)               Baadal VM (IIT Delhi cloud)
Docker (PostgreSQL, Redis, MinIO)   →    Direct installs (no Docker)
Expo tunnel (ngrok)                 →    Direct IP / domain access
Expo Go + tunnel                    →    Built APK (direct FCM)
Personal GitHub/API keys            →    Same but stored in .env files
```

---

## Part 2: Baadal VM Initial Setup

### Step 1: Get Baadal VM

```
1. Login: https://baadal.iitd.ac.in
2. Request VM: Ubuntu 22.04 LTS
3. Recommended specs: 4 vCPU, 8GB RAM, 50GB disk
4. Note your VM IP: something like 10.17.x.x (internal IITD)
```

### Step 2: SSH into VM

```bash
# From IITD network or VPN
ssh username@10.17.x.x

# Or if they give you a public IP
ssh username@YOUR_VM_IP
```

### Step 3: Update System

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  python3 python3-pip python3-venv \
  postgresql postgresql-contrib \
  redis-server \
  nginx \
  git \
  curl wget \
  build-essential \
  libpq-dev \
  certbot python3-certbot-nginx \
  ufw \
  supervisor

echo "All packages installed"
```

---

## Part 3: PostgreSQL Setup (No Docker)

### Step 4: Configure PostgreSQL

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'ENDOFFILE'
CREATE DATABASE confhub_db;
CREATE USER confhub_user WITH PASSWORD 'ChooseStrongPassword123!';
ALTER ROLE confhub_user SET client_encoding TO 'utf8';
ALTER ROLE confhub_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE confhub_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE confhub_db TO confhub_user;
\q
ENDOFFILE

echo "PostgreSQL setup done"
```

### Step 5: Verify PostgreSQL

```bash
# Test connection
psql -h localhost -U confhub_user -d confhub_db -c "SELECT version();"
# Enter password when asked: ChooseStrongPassword123!

# Should print PostgreSQL version
```

---

## Part 4: Redis Setup (No Docker)

```bash
# Redis is already installed
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
# Should print: PONG
```

---

## Part 5: MinIO Setup (No Docker)

```bash
# Download MinIO binary directly
cd /opt
sudo wget https://dl.min.io/server/minio/release/linux-amd64/minio
sudo chmod +x minio

# Create MinIO user and directories
sudo useradd -r minio-user -s /sbin/nologin 2>/dev/null || true
sudo mkdir -p /data/minio
sudo chown minio-user:minio-user /data/minio

# Create MinIO environment file
sudo cat > /etc/default/minio << 'ENDOFFILE'
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=MinioStrongPass123!
MINIO_VOLUMES=/data/minio
MINIO_OPTS="--console-address :9001"
ENDOFFILE

# Create systemd service for MinIO
sudo cat > /etc/systemd/system/minio.service << 'ENDOFFILE'
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
User=minio-user
Group=minio-user
EnvironmentFile=/etc/default/minio
ExecStart=/opt/minio server $MINIO_VOLUMES $MINIO_OPTS
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
ENDOFFILE

sudo systemctl daemon-reload
sudo systemctl start minio
sudo systemctl enable minio

echo "MinIO running on port 9000"
```

---

## Part 6: Clone and Setup Project

### Step 6: Clone Repository

```bash
cd /home/$USER

# Clone your repo (use personal access token)
git clone https://github.com/YOUR_USERNAME/eventapp.git confhub

cd confhub
```

### Step 7: Create Python Virtual Environment

```bash
cd /home/$USER/confhub/backend

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Additional production packages
pip install gunicorn daphne psycopg2-binary
```

### Step 8: Create Production .env File

```bash
cd /home/$USER/confhub/backend

cat > .env << 'ENDOFFILE'
# Django
SECRET_KEY=generate-a-long-random-string-here-minimum-50-chars-xyz123abc456
DEBUG=False
ALLOWED_HOSTS=10.17.x.x,localhost,127.0.0.1,YOUR_DOMAIN_IF_ANY

# PostgreSQL (no Docker)
USE_POSTGRES=True
DB_NAME=confhub_db
DB_USER=confhub_user
DB_PASSWORD=ChooseStrongPassword123!
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=MinioStrongPass123!
MINIO_SECURE=False

# Email (Brevo SMTP)
BREVO_API_KEY=your-brevo-api-key

# Firebase FCM
FCM_SERVER_KEY=your-fcm-server-key

# JWT
JWT_ACCESS_TOKEN_LIFETIME_HOURS=24
JWT_REFRESH_TOKEN_LIFETIME_DAYS=30
ENDOFFILE

echo ".env created"
```

Generate a real SECRET_KEY:

```bash
python3 -c "
import secrets, string
chars = string.ascii_letters + string.digits + '!@#$%^&*()'
key = ''.join(secrets.choice(chars) for _ in range(60))
print(f'SECRET_KEY={key}')
"
# Copy this output and update .env SECRET_KEY
```

### Step 9: Update Django Settings for Production

```bash
cd /home/$USER/confhub/backend

cat > confhub/settings.py << 'ENDOFFILE'
from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.conferences',
    'apps.events',
    'apps.photos',
    'apps.polls',
    'apps.posts',
    'apps.checkins',
    'apps.notifications',
    'apps.leaderboard',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'confhub.middleware.DisableCSRFForAPI',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'confhub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'confhub.wsgi.application'
ASGI_APPLICATION = 'confhub.asgi.application'

# Database
if config('USE_POSTGRES', default=False, cast=bool):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME'),
            'USER': config('DB_USER'),
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [REDIS_URL]},
    },
}

AUTH_USER_MODEL = 'accounts.User'

AUTHENTICATION_BACKENDS = [
    'apps.accounts.backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        hours=config('JWT_ACCESS_TOKEN_LIFETIME_HOURS', default=24, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=30, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    'http://10.17.x.x',
    'https://YOUR_DOMAIN',
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'http://10.17.x.x',
    'https://YOUR_DOMAIN',
]

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

LOGIN_URL = '/panel/login/'
LOGIN_REDIRECT_URL = '/panel/'

# Security (enable in production)
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
ENDOFFILE
```

### Step 10: Run Migrations and Setup

```bash
cd /home/$USER/confhub/backend
source venv/bin/activate

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email='admin@confhub.com').exists():
    u = User.objects.create_superuser(
        email='admin@confhub.com',
        password='Admin@1234',
    )
    u.first_name = 'Super'
    u.last_name = 'Admin'
    u.must_change_password = False
    u.save()
    print('Admin created')

if not User.objects.filter(email='participant@test.com').exists():
    u = User(
        email='participant@test.com',
        role='participant',
        first_name='Sudhanshu',
        last_name='Kumar',
        registration_id='CONF-0001',
        affiliation='IIT Delhi',
        must_change_password=False,
        profile_complete=True,
    )
    u.set_password('Test@1234')
    u.save()
    print('Participant created')

print('Done')
"
```

---

## Part 7: Gunicorn + Daphne Setup

### Step 11: Create Gunicorn Service

```bash
sudo cat > /etc/systemd/system/confhub-gunicorn.service << ENDOFFILE
[Unit]
Description=ConfHub Gunicorn (Django HTTP)
After=network.target postgresql.service redis.service

[Service]
User=$USER
Group=www-data
WorkingDirectory=/home/$USER/confhub/backend
Environment="PATH=/home/$USER/confhub/backend/venv/bin"
ExecStart=/home/$USER/confhub/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --log-level info \
    --error-logfile /var/log/confhub/gunicorn-error.log \
    --access-logfile /var/log/confhub/gunicorn-access.log \
    confhub.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
ENDOFFILE

# Create Daphne service for WebSocket
sudo cat > /etc/systemd/system/confhub-daphne.service << ENDOFFILE
[Unit]
Description=ConfHub Daphne (WebSocket)
After=network.target postgresql.service redis.service

[Service]
User=$USER
Group=www-data
WorkingDirectory=/home/$USER/confhub/backend
Environment="PATH=/home/$USER/confhub/backend/venv/bin"
ExecStart=/home/$USER/confhub/backend/venv/bin/daphne \
    -b 127.0.0.1 \
    -p 8001 \
    confhub.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
ENDOFFILE

# Create Celery service
sudo cat > /etc/systemd/system/confhub-celery.service << ENDOFFILE
[Unit]
Description=ConfHub Celery Worker
After=network.target redis.service

[Service]
User=$USER
Group=www-data
WorkingDirectory=/home/$USER/confhub/backend
Environment="PATH=/home/$USER/confhub/backend/venv/bin"
ExecStart=/home/$USER/confhub/backend/venv/bin/celery \
    -A confhub worker \
    --loglevel=info \
    --logfile=/var/log/confhub/celery.log
Restart=always

[Install]
WantedBy=multi-user.target
ENDOFFILE

# Create log directory
sudo mkdir -p /var/log/confhub
sudo chown $USER:www-data /var/log/confhub

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable confhub-gunicorn confhub-daphne confhub-celery
sudo systemctl start confhub-gunicorn confhub-daphne

echo "Services started"
```

---

## Part 8: Nginx Setup

### Step 12: Configure Nginx

```bash
sudo cat > /etc/nginx/sites-available/confhub << 'ENDOFFILE'
upstream django_backend {
    server 127.0.0.1:8000;
}

upstream websocket_backend {
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name 10.17.x.x YOUR_DOMAIN_HERE;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    client_max_body_size 20M;

    # Static files
    location /static/ {
        alias /home/USERNAME/confhub/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Media files
    location /media/ {
        alias /home/USERNAME/confhub/backend/media/;
        expires 7d;
    }

    # WebSocket connections
    location /ws/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Django API and admin
    location / {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
ENDOFFILE

# Replace USERNAME with actual username
sudo sed -i "s/USERNAME/$USER/g" /etc/nginx/sites-available/confhub

# Also replace the IP placeholder
read -p "Enter your VM IP (e.g. 10.17.5.100): " VM_IP
sudo sed -i "s/10.17.x.x/$VM_IP/g" /etc/nginx/sites-available/confhub

# Enable site
sudo ln -sf /etc/nginx/sites-available/confhub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo "Nginx configured"
```

### Step 13: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 8000    # Django (direct, for testing)

# Block everything else
sudo ufw --force enable
sudo ufw status
```

---

## Part 9: APK Build — No Expo Token Needed

### About FCM in APK vs Expo Go

```
┌─────────────────────────────────────────────────────────┐
│           EXPO GO vs BUILT APK                         │
├──────────────────┬──────────────────────────────────────┤
│ Expo Go          │ Built APK                            │
├──────────────────┼──────────────────────────────────────┤
│ Uses Expo's FCM  │ Uses YOUR Firebase project directly  │
│ Needs Expo token │ NO Expo token needed                 │
│ Shared push infra│ Your own FCM credentials             │
│ Dev only         │ Production ready                     │
│ google-services  │ google-services.json bundled in APK  │
│ not needed       │ REQUIRED                             │
└──────────────────┴──────────────────────────────────────┘
```

### Step 14: Setup Firebase for APK

```
1. Go to: https://console.firebase.google.com
2. Create project: ConfHub
3. Add Android app:
   Package name: com.confhub.app
4. Download: google-services.json
5. Place it at: mobile/google-services.json
```

### Step 15: Build APK with EAS

```bash
# On your LOCAL machine or Codespaces

cd /workspaces/eventapp/mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo (only needed for building, not for FCM)
eas login

# Initialize EAS
eas init

# Create eas.json
cat > eas.json << 'ENDOFFILE'
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
ENDOFFILE

# Update app.json for FCM
cat > app.json << 'ENDOFFILE'
{
  "expo": {
    "name": "ConfHub",
    "slug": "confhub",
    "version": "1.0.0",
    "sdkVersion": "51.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": ["**/*"],
    "android": {
      "package": "com.confhub.app",
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "NOTIFICATIONS",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.confhub.app"
    },
    "scheme": "confhub",
    "plugins": [
      "expo-notifications"
    ]
  }
}
ENDOFFILE

# Install expo-notifications properly
npx expo install expo-notifications --legacy-peer-deps

# Build APK
eas build --platform android --profile preview
```

### Step 16: Update App.js API URL for Production

Before building APK, hardcode the VM IP:

```bash
cd /workspaces/eventapp/mobile

# Replace API URL with your VM IP
sed -i "s|const API = '.*';|const API = 'http://YOUR_VM_IP/api/v1';|" App.js

# Or with domain
sed -i "s|const API = '.*';|const API = 'https://YOUR_DOMAIN/api/v1';|" App.js

grep "const API" App.js
```

---

## Part 10: Access from Outside IITD Network

### Option A: IITD VPN (Simplest)

```
Users connect to IITD VPN first, then access VM IP directly.

VPN: https://vpn.iitd.ac.in
After VPN: http://10.17.x.x (VM IP works directly)

Good for: Internal conference use, students/faculty
Bad for: External participants without IITD credentials
```

### Option B: Nginx + Public Domain (Recommended)

```bash
# If Baadal gives you a public IP (check with IITD CC):
# CSC / CC may assign a public IP on request

# Once you have public IP, set up domain:
# Buy domain or use free: confhub.your-name.me

# Point domain DNS to your public IP
# Then setup SSL with Certbot

sudo certbot --nginx -d confhub.yourdomain.com
```

### Option C: Cloudflare Tunnel (Best — Free, No Public IP Needed)

This is the **best option** — works even with only internal IITD IP:

```bash
# Install cloudflared on VM
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Login to Cloudflare (free account at cloudflare.com)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create confhub

# Configure tunnel
mkdir -p ~/.cloudflared

# Get tunnel ID from output above
TUNNEL_ID="your-tunnel-id-here"

cat > ~/.cloudflared/config.yml << ENDOFFILE
tunnel: $TUNNEL_ID
credentials-file: /home/$USER/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: confhub.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
ENDOFFILE

# Add DNS record (automatic)
cloudflared tunnel route dns confhub confhub.yourdomain.com

# Start tunnel
cloudflared tunnel run confhub

# Make it a service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

echo "Tunnel running at https://confhub.yourdomain.com"
```

### Option D: SSH Tunnel (For Testing Only)

```bash
# On your laptop, run this to expose VM to internet temporarily
ssh -R 80:localhost:80 serveo.net -l username@10.17.x.x

# Or use bore
curl -L https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-x86_64-unknown-linux-musl.tar.gz | tar xz
./bore local 80 --to bore.pub
```

---

## Part 11: Complete Deployment Summary

### Final Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 BAADAL VM (IIT Delhi)                   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │PostgreSQL│  │  Redis   │  │  MinIO   │             │
│  │ :5432    │  │  :6379   │  │  :9000   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │            Nginx :80/:443            │              │
│  │  /api/ → Gunicorn :8000              │              │
│  │  /ws/  → Daphne :8001               │              │
│  │  /static/ → Files                   │              │
│  └──────────────────────────────────────┘              │
│                                                         │
│  ┌──────────┐  ┌──────────┐                           │
│  │ Gunicorn │  │  Daphne  │                           │
│  │ :8000    │  │  :8001   │                           │
│  └──────────┘  └──────────┘                           │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │     Cloudflare Tunnel (optional)     │              │
│  │  confhub.yourdomain.com → VM        │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑
    IITD Network         Internet
   (direct IP)      (Cloudflare tunnel)
```

### Access Summary

```
┌─────────────────┬──────────────────────────────────────┐
│ WHO             │ HOW TO ACCESS                        │
├─────────────────┼──────────────────────────────────────┤
│ On IITD network │ http://10.17.x.x directly            │
│ IITD VPN        │ Connect VPN → http://10.17.x.x       │
│ Outside IITD    │ https://confhub.yourdomain.com        │
│                 │ (via Cloudflare tunnel)               │
│ Admin Panel     │ http://IP/panel/login/                │
│ API             │ http://IP/api/v1/                     │
│ Mobile APK      │ Points to domain URL (works anywhere) │
└─────────────────┴──────────────────────────────────────┘
```

### Daily Management Commands

```bash
# Check all services
sudo systemctl status confhub-gunicorn confhub-daphne postgresql redis-server nginx

# Restart after code update
cd /home/$USER/confhub/backend
source venv/bin/activate
git pull origin main
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart confhub-gunicorn confhub-daphne

# View logs
sudo journalctl -u confhub-gunicorn -f
sudo journalctl -u confhub-daphne -f
tail -f /var/log/confhub/gunicorn-error.log

# Database backup
pg_dump -U confhub_user confhub_db > backup_$(date +%Y%m%d).sql

# Restore database
psql -U confhub_user confhub_db < backup_20260725.sql
```

### Update Script (Save as deploy.sh)

```bash
cat > /home/$USER/confhub/deploy.sh << 'ENDOFFILE'
#!/bin/bash
set -e

echo "==> Pulling latest code..."
cd /home/$USER/confhub
git pull origin main

echo "==> Installing dependencies..."
cd backend
source venv/bin/activate
pip install -r requirements.txt -q

echo "==> Running migrations..."
python manage.py migrate

echo "==> Collecting static files..."
python manage.py collectstatic --noinput -v 0

echo "==> Restarting services..."
sudo systemctl restart confhub-gunicorn
sudo systemctl restart confhub-daphne

echo "==> Done! Checking status..."
sudo systemctl is-active confhub-gunicorn
sudo systemctl is-active confhub-daphne

echo "✅ Deployment complete!"
ENDOFFILE

chmod +x /home/$USER/confhub/deploy.sh

echo "Run: bash /home/\$USER/confhub/deploy.sh to deploy updates"
```