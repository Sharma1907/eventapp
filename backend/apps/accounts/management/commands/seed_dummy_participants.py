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
