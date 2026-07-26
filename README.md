cd /workspaces/eventapp/mobile
npx expo start --tunnel --port 8081 --clear


=== ALL LOGIN CREDENTIALS ===
  admin@confhub.com | Role: super_admin | Password: Test@1234 (or Admin@1234 for admin)
  participant@test.com | Role: participant | Password: Test@1234 (or Admin@1234 for admin)
  speaker@test.com | Role: speaker | Password: Test@1234 (or Admin@1234 for admin)



  cd /workspaces/eventapp/backend && python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'confhub.settings')
django.setup()
from apps.checkins.models import CheckIn
count = CheckIn.objects.all().delete()[0]
print(f'✓ Deleted {count} check-ins — ready for fresh testing')
"


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

And if you also want to reset conference check-ins at the same time:

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