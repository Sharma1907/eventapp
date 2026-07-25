# ======================
# CONFHUB MAKE COMMANDS
# ======================

# Services
up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

# Backend
migrate:
	cd backend && python manage.py migrate

makemigrations:
	cd backend && python manage.py makemigrations

runserver:
	cd backend && python manage.py runserver 0.0.0.0:8000

shell:
	cd backend && python manage.py shell

superuser:
	cd backend && python manage.py createsuperuser

celery:
	cd backend && celery -A confhub worker --loglevel=info

# Mobile
mobile:
	cd mobile && npx expo start --tunnel

# Testing
test-backend:
	cd backend && python manage.py test

# Database
reset-db:
	docker compose down -v
	docker compose up -d db redis
	sleep 3
	cd backend && python manage.py migrate

# Utilities
freeze:
	cd backend && pip freeze > requirements.txt

format:
	cd backend && black . && isort .
