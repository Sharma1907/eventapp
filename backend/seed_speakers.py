"""
Run: python manage.py shell < seed_speakers.py
Or:  cd backend && python seed_speakers.py
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'confhub.settings')
django.setup()

from apps.speakers.models import Speaker

SPEAKERS = [
    dict(title='prof', first_name='A.R.D.',       last_name='Prasad',          designation='Former Professor',                  institute='DRTC (ISI), Bangalore', country='India',  display_order=1),
    dict(title='prof', first_name='Ajay Pratap',  last_name='Singh',           designation='Professor',                          institute='University of Delhi, New Delhi', country='India', display_order=2),
    dict(title='prof', first_name='Ana',           last_name='Pavani',          designation='Professor',                          institute='Pontifical Catholic University, Rio de Janeiro', country='Brazil', display_order=3),
    dict(title='prof', first_name='Devika',        last_name='Madalli',         designation='Director',                           institute='INFLIBNET Centre, Gandhinagar', country='India', display_order=4),
    dict(title='prof', first_name='Edward A.',     last_name='Fox',             designation='Professor of Computer Science',       institute='Virginia Tech', country='USA', is_keynote=True, display_order=5),
    dict(title='ms',   first_name='Heather Greer', last_name='Klein',           designation='Community Manager',                  institute='Samvera Foundation', country='USA', display_order=6),
    dict(title='dr',   first_name='Jagdish',       last_name='Arora',           designation='Ex Director',                        institute='INFLIBNET, Gandhinagar', country='India', display_order=7),
    dict(title='prof', first_name='M.',            last_name='Madhan',          designation='Director, Global Library & Professor', institute='O.P. Jindal University, Haryana', country='India', display_order=8),
    dict(title='mr',   first_name='Manoj Kumar',   last_name='K',               designation='Scientist F-CS',                     institute='INFLIBNET Centre, Gandhinagar', country='India', display_order=9),
    dict(title='prof', first_name='Parthasarathi', last_name='Mukhopadhyay',    designation='Professor',                          institute='Dept. of Library and Information Science, University of Kalyani', country='India', display_order=10),
    dict(title='prof', first_name='Ramesh C.',     last_name='Gaur',            designation='Professor & Dean',                   institute='IGNCA, Ministry of Culture, Govt. of India', country='India', display_order=11),
    dict(title='dr',   first_name='Saiful',        last_name='Amin',            designation='Director',                           institute='Semantic Consulting Services Pvt. Ltd., Bengaluru', country='India', display_order=12),
    dict(title='dr',   first_name='Sangeeta',      last_name='Kaul',            designation='Director',                           institute='DELNET, New Delhi', country='India', display_order=13),
    dict(title='prof', first_name='Uma',           last_name='Kanjilal',        designation='Vice-Chancellor',                    institute='IGNOU, New Delhi', country='India', display_order=14),
    dict(title='dr',   first_name='Usha Mujoo',   last_name='Munshi',           designation='Chief Librarian',                    institute='India International Centre, New Delhi', country='India', display_order=15),
    dict(title='dr',   first_name='William A.',   last_name='Ingram',           designation='Associate Dean & Director, IT for University Libraries', institute='Virginia Tech', country='USA', display_order=16),
]

created = 0
for data in SPEAKERS:
    obj, new = Speaker.objects.get_or_create(
        first_name=data['first_name'],
        last_name=data['last_name'],
        defaults=data,
    )
    if new:
        created += 1
        print(f"  ✅ Created: {obj.full_name}")
    else:
        print(f"  ⚠️  Already exists: {obj.full_name}")

print(f"\nDone — {created} new speakers seeded.")
