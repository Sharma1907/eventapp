"""Run: python manage.py shell < seed_sponsors.py"""
from apps.sponsors.models import Sponsor

DATA = [
    # National Funding
    ('Anusandhan National Research Foundation', 'national_funding', 10),

    # Platinum
    ('Clarivate', 'platinum', 10),

    # Silver
    ('VIR Softech', 'silver', 10),
    ('DrillBit',    'silver', 20),

    # Bronze
    ('IEEE',                       'bronze', 10),
    ('iGroup',                     'bronze', 20),
    ('Packt',                      'bronze', 30),
    ('BSB Edge',                   'bronze', 40),
    ('World Scientific',           'bronze', 50),
    ('Cambridge University Press', 'bronze', 60),
    ('Springer Nature',            'bronze', 70),
    ('KGL Accucoms',               'bronze', 80),
]

created = 0
skipped = 0
for name, tier, order in DATA:
    obj, was_created = Sponsor.objects.get_or_create(
        name=name, tier=tier,
        defaults={'display_order': order, 'is_active': True},
    )
    if was_created:
        created += 1
        print(f"  + {name} ({tier})")
    else:
        skipped += 1
        print(f"  · {name} (exists)")

print(f"\nDone. Created: {created}, Skipped: {skipped}")
