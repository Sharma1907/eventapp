#!/bin/bash
set -e
cd /workspaces/eventapp

echo "==> Creating .env (Django won't boot without SECRET_KEY)..."
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env 2>/dev/null || touch backend/.env
  python3 - <<'PY'
import secrets, re, pathlib
p = pathlib.Path('backend/.env')
t = p.read_text()
key = secrets.token_urlsafe(50)
t = re.sub(r'^SECRET_KEY=.*', f'SECRET_KEY={key}', t, flags=re.M) if re.search(r'^SECRET_KEY=', t, re.M) else t + f'\nSECRET_KEY={key}\n'
p.write_text(t)
print("   SECRET_KEY generated — add EMAIL + FCM keys manually later")
PY
fi

echo "==> Python deps..."
pip install -q -r backend/requirements.txt

echo "==> Node deps..."
cd mobile && npm install --silent && cd ..

echo "==> Docker services (optional — app runs on SQLite without them)..."
docker compose up -d 2>/dev/null || echo "   skipped, not needed"

echo "==> Migrations..."
python3 backend/manage.py migrate --noinput

echo "==> Superuser..."
python3 backend/manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@confhub.com').exists():
    User.objects.create_superuser('admin@confhub.com', 'Admin@1234')
    print('   admin@confhub.com / Admin@1234 created')
else:
    print('   already exists')
"

echo "==> Registration IDs for users missing them..."
python3 backend/manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
n = 0
for i, u in enumerate(User.objects.filter(registration_id__isnull=True).order_by('created_at'), 1):
    u.registration_id = f'ETD-2026-{i:04d}'
    u.save(update_fields=['registration_id'])
    n += 1
print(f'   fixed {n}')
"

echo "==> Done. Run: python3 backend/manage.py runserver 0.0.0.0:8000"
