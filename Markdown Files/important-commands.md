# Start App in this sequence

1. cd backend && python manage.py runserver 0.0.0.0:8000

2. cd /workspaces/eventapp/mobile && npx expo start --tunnel --clear

3. ngrok http 8000

Context Gen: Okay its working Now give me the full context to start a new chat with new feature to be build it must cover everything till now and i give you early.

---
# Git Push 
```bash
cd /workspaces/eventapp && git add . && git commit -m "feat: YOUR MESSAGE" && git push origin main


git pull origin main --rebase && git push origin main
```
---


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

### Reset connection between Participants,
```bash
python3 manage.py shell <<'EOF'
from django.contrib.auth import get_user_model
from django.db.models import Q
from apps.chat.models import Conversation, ConnectionRequest

User = get_user_model()

EMAIL_1 = "sudhanshu.stu@gmail.com"
EMAIL_2 = "test@iitd.ac.in"

try:
    u1 = User.objects.get(email=EMAIL_1)
    u2 = User.objects.get(email=EMAIL_2)
except User.DoesNotExist:
    print("User not found.")
    print("Available users:")
    for email in User.objects.values_list("email", flat=True).order_by("email"):
        print(" -", email)
    raise SystemExit(1)

# Find shared conversations using reverse relation names on User
u1_conv_ids = set(u1.conversations_as_a.values_list("id", flat=True)) | set(u1.conversations_as_b.values_list("id", flat=True))
u2_conv_ids = set(u2.conversations_as_a.values_list("id", flat=True)) | set(u2.conversations_as_b.values_list("id", flat=True))
shared_conv_ids = u1_conv_ids & u2_conv_ids

convs = Conversation.objects.filter(id__in=shared_conv_ids)
reqs = ConnectionRequest.objects.filter(
    Q(sender=u1, receiver=u2) | Q(sender=u2, receiver=u1)
)

c_count = convs.count()
r_count = reqs.count()

print(f"Found {c_count} conversation(s)")
print(f"Found {r_count} connection request(s)")

convs.delete()
reqs.delete()

print("Reset complete.")
print("Next interaction should behave like a fresh connection/contact-card flow.")
EOF
```

### If you want a different pair
Replace these two lines:

```python
EMAIL_1 = "sudhanshu.stu@gmail.com"
EMAIL_2 = "test@iitd.ac.in"
```

### 
# Seed 100 Users in one go:
```bash
cd /workspaces/eventapp/backend && python manage.py shell <<'PYSHELL'
import uuid, random
from apps.accounts.models import User

INTERESTS_POOL = [
    'Metadata', 'AI', 'Open Access', 'Digital Libraries',
    'Machine Learning', 'ETD Management', 'Linked Data',
    'Institutional Repositories', 'Data Mining', 'NLP',
    'Semantic Web', 'Research Data', 'Scholarly Communication',
    'Information Retrieval', 'Knowledge Graphs',
]

DESIGNATIONS = [
    'PhD Scholar', 'Research Associate', 'Assistant Professor',
    'Associate Professor', 'Professor', 'Librarian',
    'Research Scientist', 'Postdoctoral Fellow',
    'Systems Analyst', 'Data Engineer',
]

AFFILIATIONS = [
    'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur',
    'JNU Delhi', 'Delhi University', 'BHU Varanasi',
    'IISc Bangalore', 'IIIT Hyderabad', 'NIT Trichy',
    'Anna University', 'Jadavpur University', 'Amity University',
    'University of Hyderabad', 'Panjab University',
    'MIT Boston', 'Stanford University', 'Oxford University',
    'University of Cape Town', 'NUS Singapore',
]

BIOS = [
    'Researching the intersection of AI and digital library systems.',
    'Working on metadata standards for electronic theses and dissertations.',
    'Passionate about open access and scholarly communication.',
    'Exploring machine learning applications in information retrieval.',
    'Focused on building sustainable institutional repositories.',
    'Investigating linked data approaches for ETD management.',
    'Developing NLP tools for academic document processing.',
    'Studying knowledge graph construction from research publications.',
    'Working on semantic web technologies for library systems.',
    'Interested in data mining techniques for research analytics.',
]

PEOPLE = [
    ('Aarav', 'Sharma', 'male'),
    ('Ananya', 'Verma', 'female'),
    ('Vivaan', 'Gupta', 'male'),
    ('Diya', 'Singh', 'female'),
    ('Aditya', 'Kumar', 'male'),
    ('Myra', 'Patel', 'female'),
    ('Vihaan', 'Shah', 'male'),
    ('Sara', 'Mehta', 'female'),
    ('Arjun', 'Joshi', 'male'),
    ('Kiara', 'Reddy', 'female'),
    ('Sai', 'Nair', 'male'),
    ('Riya', 'Iyer', 'female'),
    ('Reyansh', 'Rao', 'male'),
    ('Priya', 'Das', 'female'),
    ('Ayaan', 'Banerjee', 'male'),
    ('Isha', 'Roy', 'female'),
    ('Krishna', 'Sen', 'male'),
    ('Anika', 'Bose', 'female'),
    ('Ishaan', 'Mishra', 'male'),
    ('Navya', 'Pandey', 'female'),
    ('Shaurya', 'Dubey', 'male'),
    ('Tara', 'Tiwari', 'female'),
    ('Atharva', 'Saxena', 'male'),
    ('Zara', 'Agarwal', 'female'),
    ('Advait', 'Jain', 'male'),
    ('Kavya', 'Kapoor', 'female'),
    ('Dhruv', 'Malhotra', 'male'),
    ('Meera', 'Khanna', 'female'),
    ('Kabir', 'Pillai', 'male'),
    ('Nisha', 'Chatterjee', 'female'),
    ('Ritvik', 'Sinha', 'male'),
    ('Pooja', 'Thakur', 'female'),
    ('Aaryan', 'Bhatt', 'male'),
    ('Sneha', 'Menon', 'female'),
    ('Kian', 'Chauhan', 'male'),
    ('Tanvi', 'Rathore', 'female'),
    ('Darsh', 'Yadav', 'male'),
    ('Aditi', 'Kulkarni', 'female'),
    ('Rishi', 'Patil', 'male'),
    ('Bhavya', 'Deshmukh', 'female'),
    ('Arnav', 'Srivastava', 'male'),
    ('Charvi', 'Goswami', 'female'),
    ('Laksh', 'Chandra', 'male'),
    ('Divya', 'Mukherjee', 'female'),
    ('Veer', 'Shukla', 'male'),
    ('Esha', 'Ghosh', 'female'),
    ('Yash', 'Bajaj', 'male'),
    ('Fatima', 'Khan', 'female'),
    ('Rohan', 'Sethi', 'male'),
    ('Gauri', 'Deshpande', 'female'),
    ('Dev', 'Awasthi', 'male'),
    ('Hina', 'Chopra', 'female'),
    ('Parth', 'Luthra', 'male'),
    ('Ira', 'Bhatia', 'female'),
    ('Ansh', 'Kashyap', 'male'),
    ('Jiya', 'Mahajan', 'female'),
    ('Neil', 'Arora', 'male'),
    ('Kaira', 'Grover', 'female'),
    ('Samar', 'Dhillon', 'male'),
    ('Lavanya', 'Mathur', 'female'),
    ('Hrithik', 'Rawat', 'male'),
    ('Mahi', 'Tandon', 'female'),
    ('Om', 'Vyas', 'male'),
    ('Nandini', 'Choudhary', 'female'),
    ('Rudra', 'Khurana', 'male'),
    ('Ojasvi', 'Lal', 'female'),
    ('Abhinav', 'Datta', 'male'),
    ('Pallavi', 'Narayan', 'female'),
    ('Akash', 'Hegde', 'male'),
    ('Radhika', 'Kamat', 'female'),
    ('Vikram', 'Prasad', 'male'),
    ('Sakshi', 'Trivedi', 'female'),
    ('Kartik', 'Mohan', 'male'),
    ('Trisha', 'Rana', 'female'),
    ('Manav', 'Gill', 'male'),
    ('Uma', 'Chawla', 'female'),
    ('Pranav', 'Mitra', 'male'),
    ('Swara', 'Bedi', 'female'),
    ('Tanay', 'Kale', 'male'),
    ('Aisha', 'Soni', 'female'),
    ('James', 'Anderson', 'male'),
    ('Emily', 'Williams', 'female'),
    ('William', 'Brown', 'male'),
    ('Sarah', 'Johnson', 'female'),
    ('David', 'Taylor', 'male'),
    ('Jessica', 'Wilson', 'female'),
    ('Michael', 'Clark', 'male'),
    ('Ashley', 'Lee', 'female'),
    ('Robert', 'Miller', 'male'),
    ('Amanda', 'Jones', 'female'),
    ('Daniel', 'Davis', 'male'),
    ('Rachel', 'Moore', 'female'),
    ('Andrew', 'White', 'male'),
    ('Nicole', 'Martin', 'female'),
    ('Thomas', 'Harris', 'male'),
    ('Laura', 'Thompson', 'female'),
    ('Mark', 'Garcia', 'male'),
    ('Anna', 'Martinez', 'female'),
    ('Steven', 'Robinson', 'male'),
    ('Maria', 'Walker', 'female'),
]

TAG = 'SEEDED_100_ETD2026'
created = 0
emails = []

for first, last, gender in PEOPLE:
    email = f'{first.lower()}.{last.lower()}@gmail.com'

    if User.objects.filter(email=email).exists():
        print(f'  SKIP (exists): {email}')
        emails.append(email)
        continue

    num_interests = random.randint(2, 5)
    interests = ', '.join(random.sample(INTERESTS_POOL, num_interests))
    photo_path = f'profiles/placeholder-image-{"female" if gender == "female" else "male"}.jpg'

    u = User(
        id=uuid.uuid4(),
        email=email,
        first_name=first,
        last_name=last,
        role='participant',
        designation=random.choice(DESIGNATIONS),
        affiliation=random.choice(AFFILIATIONS),
        gender=gender,
        research_interests=interests,
        bio=random.choice(BIOS),
        profile_photo=photo_path,
        is_active=True,
        must_change_password=False,
        profile_complete=True,
        warning_note=TAG,
    )
    u.set_password('test123')
    u.save()
    created += 1
    emails.append(email)
    print(f'  CREATED: {email}')

# Clear the tag from warning_note so it doesn't show in the app
User.objects.filter(warning_note=TAG).update(warning_note='')

print(f'\nDone: {created} users created')
print(f'Total users now: {User.objects.count()}')
print(f'\nSample logins:')
for e in emails[:5]:
    print(f'  {e} / test123')
PYSHELL
```

---

## Command to delete ONLY these 100 users

```bash
cd /workspaces/eventapp/backend && python manage.py shell -c "
from apps.accounts.models import User

emails = [
    'aarav.sharma@gmail.com', 'ananya.verma@gmail.com', 'vivaan.gupta@gmail.com',
    'diya.singh@gmail.com', 'aditya.kumar@gmail.com', 'myra.patel@gmail.com',
    'vihaan.shah@gmail.com', 'sara.mehta@gmail.com', 'arjun.joshi@gmail.com',
    'kiara.reddy@gmail.com', 'sai.nair@gmail.com', 'riya.iyer@gmail.com',
    'reyansh.rao@gmail.com', 'priya.das@gmail.com', 'ayaan.banerjee@gmail.com',
    'isha.roy@gmail.com', 'krishna.sen@gmail.com', 'anika.bose@gmail.com',
    'ishaan.mishra@gmail.com', 'navya.pandey@gmail.com', 'shaurya.dubey@gmail.com',
    'tara.tiwari@gmail.com', 'atharva.saxena@gmail.com', 'zara.agarwal@gmail.com',
    'advait.jain@gmail.com', 'kavya.kapoor@gmail.com', 'dhruv.malhotra@gmail.com',
    'meera.khanna@gmail.com', 'kabir.pillai@gmail.com', 'nisha.chatterjee@gmail.com',
    'ritvik.sinha@gmail.com', 'pooja.thakur@gmail.com', 'aaryan.bhatt@gmail.com',
    'sneha.menon@gmail.com', 'kian.chauhan@gmail.com', 'tanvi.rathore@gmail.com',
    'darsh.yadav@gmail.com', 'aditi.kulkarni@gmail.com', 'rishi.patil@gmail.com',
    'bhavya.deshmukh@gmail.com', 'arnav.srivastava@gmail.com', 'charvi.goswami@gmail.com',
    'laksh.chandra@gmail.com', 'divya.mukherjee@gmail.com', 'veer.shukla@gmail.com',
    'esha.ghosh@gmail.com', 'yash.bajaj@gmail.com', 'fatima.khan@gmail.com',
    'rohan.sethi@gmail.com', 'gauri.deshpande@gmail.com', 'dev.awasthi@gmail.com',
    'hina.chopra@gmail.com', 'parth.luthra@gmail.com', 'ira.bhatia@gmail.com',
    'ansh.kashyap@gmail.com', 'jiya.mahajan@gmail.com', 'neil.arora@gmail.com',
    'kaira.grover@gmail.com', 'samar.dhillon@gmail.com', 'lavanya.mathur@gmail.com',
    'hrithik.rawat@gmail.com', 'mahi.tandon@gmail.com', 'om.vyas@gmail.com',
    'nandini.choudhary@gmail.com', 'rudra.khurana@gmail.com', 'ojasvi.lal@gmail.com',
    'abhinav.datta@gmail.com', 'pallavi.narayan@gmail.com', 'akash.hegde@gmail.com',
    'radhika.kamat@gmail.com', 'vikram.prasad@gmail.com', 'sakshi.trivedi@gmail.com',
    'kartik.mohan@gmail.com', 'trisha.rana@gmail.com', 'manav.gill@gmail.com',
    'uma.chawla@gmail.com', 'pranav.mitra@gmail.com', 'swara.bedi@gmail.com',
    'tanay.kale@gmail.com', 'aisha.soni@gmail.com', 'james.anderson@gmail.com',
    'emily.williams@gmail.com', 'william.brown@gmail.com', 'sarah.johnson@gmail.com',
    'david.taylor@gmail.com', 'jessica.wilson@gmail.com', 'michael.clark@gmail.com',
    'ashley.lee@gmail.com', 'robert.miller@gmail.com', 'amanda.jones@gmail.com',
    'daniel.davis@gmail.com', 'rachel.moore@gmail.com', 'andrew.white@gmail.com',
    'nicole.martin@gmail.com', 'thomas.harris@gmail.com', 'laura.thompson@gmail.com',
    'mark.garcia@gmail.com', 'anna.martinez@gmail.com', 'steven.robinson@gmail.com',
    'maria.walker@gmail.com',
]

deleted = User.objects.filter(email__in=emails).delete()
print(f'Deleted: {deleted}')
print(f'Remaining users: {User.objects.count()}')
"
```

---

**Login with any of these:**
```
aarav.sharma@gmail.com     / test123
ananya.verma@gmail.com     / test123
vivaan.gupta@gmail.com     / test123
james.anderson@gmail.com   / test123
emily.williams@gmail.com   / test123
... (all 100 use test123)
```