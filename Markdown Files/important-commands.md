# Start App in this sequence

1. cd backend && python manage.py runserver 0.0.0.0:8000

2. cd /workspaces/eventapp/mobile && npx expo start --tunnel --clear

3. ngrok http 8000

Okay its working Now give me the full context to start a new chat with new feature to be build it must cover everything till now and i give you early.


# Change Admin ID:
```bash
cd /workspaces/eventapp/backend && python3 manage.py shell -c "
from apps.accounts.models import User
u = User.objects.filter(email__in=['admin@confhub.com','admin@etd.iitd.ac.in']).first()
if u:
    old = u.email
    u.email = 'etd@admin.iitd.ac.in'
    u.save()
    print(f'✓ {old} → etd@admin.iitd.ac.in')
else:
    print('not found, existing emails:')
    print(list(User.objects.values_list('email', flat=True)[:10]))
"
```

# Start Expo Server
```bash
cd /workspaces/eventapp/mobile
npx expo start --tunnel --port 8081 --clear
```

# Default Login Creds for app
```
=== ALL LOGIN CREDENTIALS ===
  admin@confhub.com | Role: super_admin | Password: Test@1234 (or Admin@1234 for admin)
  participant@test.com | Role: participant | Password: Test@1234 (or Admin@1234 for admin)
  speaker@test.com | Role: speaker | Password: Test@1234 (or Admin@1234 for admin)
```

# Reset Check in for test 
```bash
cd /workspaces/eventapp/backend && python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'confhub.settings')
django.setup()
from apps.checkins.models import CheckIn
count = CheckIn.objects.all().delete()[0]
print(f'✓ Deleted {count} check-ins — ready for fresh testing')
"
```

# Reset Meal Passes

```bash
cd /workspaces/eventapp/backend && python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'confhub.settings')
django.setup()
from apps.checkins.models import MealPass, MealWindow
w = MealWindow.objects.all().delete()[0]
p = MealPass.objects.all().delete()[0]
print(f'✓ Deleted {w} meal windows')
print(f'✓ Deleted {p} meal passes')
print('✓ Ready for fresh meal testing')
"
```

# And if you also want to reset conference check-ins at the same time:

```bash
cd /workspaces/eventapp/backend && python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'confhub.settings')
django.setup()
from apps.checkins.models import CheckIn, MealPass, MealWindow
c = CheckIn.objects.all().delete()[0]
w = MealWindow.objects.all().delete()[0]
p = MealPass.objects.all().delete()[0]
print(f'✓ Deleted {c} check-ins')
print(f'✓ Deleted {w} meal windows')
print(f'✓ Deleted {p} meal passes')
print('✓ Everything reset — fresh start')
"
```