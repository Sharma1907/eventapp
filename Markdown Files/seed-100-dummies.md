## Assess First

This is **not** an import flow task — the import flow sets `must_change_password=True` and sends emails. These dummy users need:
- Known password (`Test@1234`) — so we bypass `create_user` hashing with a direct `set_password`
- Profile photos set directly
- `must_change_password=False` (they're test accounts)
- Easy bulk delete

**Shortest path**: a Django management command. No new model, no UI, no API. One script to seed, one to purge.

---

## Step 1: Create the management command directory

```bash
mkdir -p /workspaces/eventapp/backend/apps/accounts/management/commands
touch /workspaces/eventapp/backend/apps/accounts/management/__init__.py
touch /workspaces/eventapp/backend/apps/accounts/management/commands/__init__.py
```

```bash
cat > /workspaces/eventapp/backend/apps/accounts/management/commands/seed_dummy_participants.py <<'EOF'
"""
Management command: seed 100 dummy participants for testing.

Usage:
    python manage.py seed_dummy_participants
    python manage.py seed_dummy_participants --start 10
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

MALE_NAMES = [
    ("Aarav", "Sharma"), ("Aditya", "Kumar"), ("Akash", "Singh"), ("Amit", "Verma"),
    ("Anand", "Patel"), ("Arjun", "Gupta"), ("Aryan", "Mishra"), ("Ashish", "Yadav"),
    ("Bhavesh", "Joshi"), ("Chirag", "Mehta"), ("Deep", "Shah"), ("Devraj", "Nair"),
    ("Dhruv", "Pillai"), ("Dinesh", "Rao"), ("Farhan", "Khan"), ("Gaurav", "Tiwari"),
    ("Harsh", "Pandey"), ("Himanshu", "Srivastava"), ("Ishaan", "Bose"), ("Jay", "Desai"),
    ("Karan", "Malhotra"), ("Kartik", "Agarwal"), ("Kunal", "Saxena"), ("Lokesh", "Reddy"),
    ("Manish", "Choudhary"), ("Mayank", "Tripathi"), ("Mohit", "Chauhan"), ("Mukesh", "Dubey"),
    ("Nikhil", "Banerjee"), ("Nilesh", "Jain"), ("Nitin", "Kapoor"), ("Piyush", "Bhatt"),
    ("Pranav", "Kulkarni"), ("Prashant", "Shukla"), ("Pratik", "Ghosh"), ("Rahul", "Das"),
    ("Raj", "Iyer"), ("Rajesh", "Menon"), ("Rakesh", "Chandra"), ("Rohit", "Bhardwaj"),
    ("Sachin", "Patil"), ("Sagar", "Thakur"), ("Sanjay", "Dutta"), ("Shubham", "Awasthi"),
    ("Siddharth", "Mukherjee"), ("Suresh", "Naidu"), ("Tarun", "Mathur"), ("Uday", "Rajan"),
    ("Vikram", "Sinha"), ("Vishal", "Garg"),
]

FEMALE_NAMES = [
    ("Aakanksha", "Sharma"), ("Aditi", "Gupta"), ("Akshita", "Singh"), ("Amrita", "Verma"),
    ("Ananya", "Patel"), ("Anjali", "Kumar"), ("Ankita", "Mishra"), ("Aparna", "Yadav"),
    ("Archana", "Joshi"), ("Avni", "Mehta"), ("Bhavna", "Shah"), ("Deepa", "Nair"),
    ("Divya", "Pillai"), ("Diya", "Rao"), ("Garima", "Khan"), ("Harshita", "Tiwari"),
    ("Isha", "Pandey"), ("Jyoti", "Srivastava"), ("Kajal", "Bose"), ("Kavita", "Desai"),
    ("Khushi", "Malhotra"), ("Komal", "Agarwal"), ("Kritika", "Saxena"), ("Lakshmi", "Reddy"),
    ("Mansi", "Choudhary"), ("Meera", "Tripathi"), ("Megha", "Chauhan"), ("Monika", "Dubey"),
    ("Namrata", "Banerjee"), ("Nandini", "Jain"), ("Neha", "Kapoor"), ("Nidhi", "Bhatt"),
    ("Nisha", "Kulkarni"), ("Pallavi", "Shukla"), ("Pooja", "Ghosh"), ("Prachi", "Das"),
    ("Pragya", "Iyer"), ("Priya", "Menon"), ("Priyanka", "Chandra"), ("Radha", "Bhardwaj"),
    ("Renu", "Patil"), ("Riddhi", "Thakur"), ("Ritu", "Dutta"), ("Rupal", "Awasthi"),
    ("Seema", "Mukherjee"), ("Shreya", "Naidu"), ("Simran", "Mathur"), ("Sneha", "Rajan"),
    ("Sonali", "Sinha"), ("Swati", "Garg"),
]

DESIGNATIONS = [
    "PhD Scholar", "Research Scholar", "Assistant Professor",
    "Associate Professor", "Professor", "Post-doctoral Fellow",
    "M.Tech Student", "Junior Research Fellow", "Senior Research Fellow",
]

INSTITUTES = [
    "IIT Delhi", "IIT Bombay", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
    "IISc Bangalore", "NIT Trichy", "NIT Warangal", "TIFR Mumbai",
    "IIIT Hyderabad", "Jadavpur University", "BHU Varanasi",
    "University of Delhi", "Anna University", "Pune University",
]

# All available interests — each user gets 5 picked by rotation
ALL_INTERESTS = [
    "Digital Libraries", "Metadata Standards", "Open Access",
    "Semantic Web", "Information Retrieval", "AI in Libraries",
    "Linked Data", "Knowledge Graphs", "ETD Management",
    "Scholarly Communication", "Data Curation", "Interoperability",
    "Machine Learning", "Natural Language Processing", "Research Data Management",
    "Bibliometrics", "Scientometrics", "Academic Publishing",
    "Institutional Repositories", "Copyright & Licensing",
]


def _pick_interests(index):
    """Pick 5 interests for user at given index — rotating through the full list."""
    start = (index * 5) % len(ALL_INTERESTS)
    picked = []
    for j in range(5):
        picked.append(ALL_INTERESTS[(start + j) % len(ALL_INTERESTS)])
    return ', '.join(picked)


class Command(BaseCommand):
    help = 'Seed 100 dummy participant accounts for testing'

    def add_arguments(self, parser):
        parser.add_argument('--start', type=int, default=10,
                            help='Starting reg ID number (default: 10 → ETD-2026-R-010)')

    def handle(self, *args, **options):
        import itertools
        start     = options['start']
        all_names = [('M', *n) for n in MALE_NAMES] + [('F', *n) for n in FEMALE_NAMES]

        male_photo   = 'profiles/placeholder-image-male.jpg'
        female_photo = 'profiles/placeholder-image-female.jpg'

        desig_cycle = itertools.cycle(DESIGNATIONS)
        inst_cycle  = itertools.cycle(INSTITUTES)

        created = 0
        skipped = 0

        for i, (gender, first, last) in enumerate(all_names):
            reg_num = start + i
            reg_id  = f'ETD-2026-R-{reg_num:03d}'
            email   = f'{first.lower()}.{last.lower()}@test.com'

            if User.objects.filter(email=email).exists():
                self.stdout.write(f'  SKIP {email} (exists)')
                skipped += 1
                continue

            if User.objects.filter(registration_id=reg_id).exists():
                self.stdout.write(f'  SKIP {reg_id} (reg_id exists)')
                skipped += 1
                continue

            user = User(
                email              = email,
                first_name         = first,
                last_name          = last,
                registration_id    = reg_id,
                role               = 'participant',
                gender             = 'Male' if gender == 'M' else 'Female',
                designation        = next(desig_cycle),
                affiliation        = next(inst_cycle),
                research_interests = _pick_interests(i),
                profile_photo      = male_photo if gender == 'M' else female_photo,
                must_change_password = False,
                is_active          = True,
                profile_complete   = True,
            )
            user.set_password('Test@1234')
            user.save()
            created += 1
            self.stdout.write(f'  OK  {email}  {reg_id}  [{_pick_interests(i)[:40]}…]')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone: {created} created, {skipped} skipped.'
        ))
EOF
```

Now purge, reset check-ins, re-seed:

```bash
cd /workspaces/eventapp/backend

# 1. remove old dummies
python manage.py purge_dummy_participants --confirm

# 2. re-seed with 5 research interests each
python manage.py seed_dummy_participants

# 3. check in all of them so they appear in network tab
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.checkins.models import CheckIn
User = get_user_model()
dummies = User.objects.filter(email__endswith='@test.com', role='participant')
created = 0
for u in dummies:
    _, was_created = CheckIn.objects.get_or_create(
        user=u, checkin_type='conference',
        defaults={'goodies_status': 'pending'}
    )
    if was_created: created += 1
print(f'Checked in {created} | already had {dummies.count()-created}')
"
```

## Dummy Participant Check-in Management Commands

### 1. Reset ALL dummy check-ins
```bash
python manage.py shell -c "
from apps.checkins.models import CheckIn
from django.contrib.auth import get_user_model
User = get_user_model()
dummies = User.objects.filter(email__endswith='@test.com', role='participant')
deleted, _ = CheckIn.objects.filter(user__in=dummies, checkin_type='conference').delete()
print(f'Deleted {deleted} check-ins')
"
```

---

### 2. Check in a specific person by reg ID
```bash
# Replace ETD-2026-R-010 with actual reg ID
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.checkins.models import CheckIn
User = get_user_model()
REG_ID = 'ETD-2026-R-010'
try:
    user = User.objects.get(registration_id=REG_ID)
    obj, created = CheckIn.objects.get_or_create(
        user=user,
        checkin_type='conference',
        defaults={'goodies_status': 'pending'}
    )
    if created:
        print(f'Checked in: {user.get_full_name()} ({REG_ID})')
    else:
        print(f'Already checked in: {user.get_full_name()} ({REG_ID})')
except User.DoesNotExist:
    print(f'No user found with reg ID: {REG_ID}')
"
```

---

### 3. Reset a specific person's check-in
```bash
# Replace ETD-2026-R-010 with actual reg ID
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.checkins.models import CheckIn
User = get_user_model()
REG_ID = 'ETD-2026-R-010'
try:
    user = User.objects.get(registration_id=REG_ID)
    deleted, _ = CheckIn.objects.filter(user=user, checkin_type='conference').delete()
    if deleted:
        print(f'Reset check-in for: {user.get_full_name()} ({REG_ID})')
    else:
        print(f'No check-in found for: {user.get_full_name()} ({REG_ID})')
except User.DoesNotExist:
    print(f'No user found with reg ID: {REG_ID}')
"
```

---

### 4. Check in ALL dummy users at once
```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.checkins.models import CheckIn
User = get_user_model()
dummies = User.objects.filter(email__endswith='@test.com', role='participant')
created_count = 0
already_count = 0
for u in dummies:
    _, was_created = CheckIn.objects.get_or_create(
        user=u,
        checkin_type='conference',
        defaults={'goodies_status': 'pending'}
    )
    if was_created:
        created_count += 1
    else:
        already_count += 1
print(f'Newly checked in : {created_count}')
print(f'Already had one  : {already_count}')
print(f'Total dummies    : {dummies.count()}')
"
```

---

### 5. Check who's checked in and who's not
```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.checkins.models import CheckIn
User = get_user_model()

dummies = User.objects.filter(email__endswith='@test.com', role='participant').order_by('registration_id')
checked_in_ids = CheckIn.objects.filter(
    user__in=dummies,
    checkin_type='conference'
).values_list('user_id', flat=True)

checked     = dummies.filter(id__in=checked_in_ids)
not_checked = dummies.exclude(id__in=checked_in_ids)

print(f'=== CHECKED IN ({checked.count()}) ===')
for u in checked:
    print(f'  [IN]  {u.registration_id:<18} {u.get_full_name()}')

print(f'\n=== NOT CHECKED IN ({not_checked.count()}) ===')
for u in not_checked:
    print(f'  [OUT] {u.registration_id:<18} {u.get_full_name()}')

print(f'\nSummary: {checked.count()} in / {not_checked.count()} out / {dummies.count()} total')
"
```

---

### Quick Reference

| Task | Key filter used |
|---|---|
| Reset all | `email__endswith='@test.com'` |
| By reg ID | `registration_id='ETD-2026-R-010'` |
| Bulk check-in | `get_or_create` loop over all dummies |
| Status report | `values_list('user_id')` diff against full dummy set |



## Delete All Dummy Participants

```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

dummies = User.objects.filter(email__endswith='@test.com', role='participant')
count = dummies.count()

if count == 0:
    print('No dummy users found.')
else:
    dummies.delete()
    print(f'Deleted {count} dummy participant accounts.')
"
```

---

### Verify they're gone
```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
remaining = User.objects.filter(email__endswith='@test.com', role='participant').count()
print(f'Remaining dummy users: {remaining}')
"
```