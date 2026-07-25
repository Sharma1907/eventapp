#!/bin/bash
set -e

echo "==> Installing Python dependencies..."
cd /workspaces/confhub/backend
pip install -r requirements.txt

echo "==> Installing Node dependencies (mobile)..."
cd /workspaces/confhub/mobile
npm install

echo "==> Starting Docker services..."
cd /workspaces/confhub
docker compose up -d db redis

echo "==> Waiting for PostgreSQL..."
sleep 5

echo "==> Running migrations..."
cd /workspaces/confhub/backend
python manage.py migrate

echo "==> Creating superuser (if not exists)..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@confhub.com').exists():
    User.objects.create_superuser('admin@confhub.com', 'Admin@1234')
    print('Superuser created')
else:
    print('Superuser already exists')
"

echo "==> Setup complete!"
