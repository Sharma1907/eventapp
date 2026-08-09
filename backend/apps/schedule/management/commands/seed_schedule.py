"""
Seed the ETD 2026 conference program.
Run: python manage.py seed_schedule
Safe to re-run — clears existing data first.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, date
import pytz

IST = pytz.timezone('Asia/Kolkata')

def dt(d, h, m):
    """Build timezone-aware datetime in IST."""
    return IST.localize(datetime(2026, 10, d, h, m))

class Command(BaseCommand):
    help = 'Seed ETD 2026 conference schedule'

    def handle(self, *args, **options):
        from apps.schedule.models import ScheduleSession, ScheduleSubSession, FeedbackForm, FeedbackQuestion

        # Clear existing
        ScheduleSession.objects.all().delete()
        self.stdout.write('Cleared existing schedule.')

        sessions = []

        # ── DAY 1 — Oct 23 ──────────────────────────────────────────────
        sessions += [
            dict(day=1, order=1,  title='Registration',
                 stype='special',  room='Main Lobby',
                 start=dt(23,8,30),  end=dt(23,9,30),
                 featured=False, desc='Check-in and Registration',
                 subs=[]),

            dict(day=1, order=2,  title='Inaugural Session',
                 stype='ceremony', room='Main Auditorium',
                 start=dt(23,9,30),  end=dt(23,10,15),
                 featured=True, desc='Opening Ceremony with Dignitaries and Presidential Address',
                 subs=[]),

            dict(day=1, order=3,  title='Group Photograph, Inauguration of Exhibition & High Tea',
                 stype='special',  room='Exhibition Area',
                 start=dt(23,10,15), end=dt(23,11,0),
                 featured=False, desc='',
                 subs=[]),

            dict(day=1, order=4,  title='ETD Workshop',
                 stype='workshop', room='Workshop Hall',
                 start=dt(23,11,0),  end=dt(23,13,0),
                 featured=False, desc='Hands-on Workshop',
                 subs=[]),

            dict(day=1, order=5,  title='Lunch Break & Visit to Exhibition Area',
                 stype='meal',     room='Cafeteria',
                 start=dt(23,13,0),  end=dt(23,13,45),
                 featured=False, desc='',
                 subs=[]),

            dict(day=1, order=6,  title='Keynote Address – 1',
                 stype='keynote',  room='Main Auditorium',
                 start=dt(23,13,45), end=dt(23,14,15),
                 featured=True, desc='',
                 subs=[]),

            dict(day=1, order=7,  title='Technical Session – 1',
                 stype='technical', room='Main Auditorium',
                 start=dt(23,14,15), end=dt(23,16,5),
                 featured=False, desc='',
                 subs=[
                     ('Invited Talk',       dt(23,14,15), dt(23,14,55)),
                     ('Paper Presentations',dt(23,14,55), dt(23,16,5)),
                 ]),

            dict(day=1, order=8,  title='Tea Break & Visit to Exhibition Area',
                 stype='break',    room='Exhibition Area',
                 start=dt(23,16,5),  end=dt(23,16,25),
                 featured=False, desc='',
                 subs=[]),

            dict(day=1, order=9,  title='Technical Session – 2',
                 stype='technical', room='Main Auditorium',
                 start=dt(23,16,25), end=dt(23,18,10),
                 featured=False, desc='',
                 subs=[
                     ('Innovative Lab Papers — Experiential / Work-in-Progress', dt(23,16,25), dt(23,17,15)),
                     ('Poster Presentations',  dt(23,17,15), dt(23,17,45)),
                     ('Product Presentation',  dt(23,17,45), dt(23,17,55)),
                     ('Visit to Poster Area / Exhibition', dt(23,17,55), dt(23,18,10)),
                 ]),

            dict(day=1, order=10, title='Cultural Event',
                 stype='cultural',  room='Main Auditorium',
                 start=dt(23,18,30), end=dt(23,20,0),
                 featured=False, desc='',
                 subs=[]),

            dict(day=1, order=11, title='Dinner',
                 stype='meal',     room='Dining Hall',
                 start=dt(23,20,0),  end=dt(23,22,0),
                 featured=False, desc='',
                 subs=[]),
        ]

        # ── DAY 2 — Oct 24 ──────────────────────────────────────────────
        sessions += [
            dict(day=2, order=1,  title='Keynote Address – 2',
                 stype='keynote',  room='Main Auditorium',
                 start=dt(24,9,0),   end=dt(24,9,30),
                 featured=True, desc='',
                 subs=[]),

            dict(day=2, order=2,  title='Technical Session – 3',
                 stype='technical', room='Main Auditorium',
                 start=dt(24,9,30),  end=dt(24,11,0),
                 featured=False, desc='',
                 subs=[
                     ('Invited Talk',        dt(24,9,30),  dt(24,10,10)),
                     ('Paper Presentations', dt(24,10,10), dt(24,10,50)),
                     ('Product Presentation',dt(24,10,50), dt(24,11,0)),
                 ]),

            dict(day=2, order=3,  title='Ideathon — Innovation Challenge',
                 stype='ideathon',  room='Innovation Lab',
                 start=dt(24,9,30),  end=dt(24,13,0),
                 featured=False, is_parallel=True,
                 desc='Collaborative Solution Development & Prototype Building — Parallel Event',
                 subs=[]),

            dict(day=2, order=4,  title='Tea Break & Visit to Exhibition Area',
                 stype='break',    room='Exhibition Area',
                 start=dt(24,11,0),  end=dt(24,11,20),
                 featured=False, desc='',
                 subs=[]),

            dict(day=2, order=5,  title='Technical Session – 4',
                 stype='technical', room='Main Auditorium',
                 start=dt(24,11,20), end=dt(24,13,0),
                 featured=False, desc='',
                 subs=[
                     ('Invited Talk',        dt(24,11,20), dt(24,12,0)),
                     ('Paper Presentations', dt(24,12,0),  dt(24,12,50)),
                     ('Product Presentation',dt(24,12,50), dt(24,13,0)),
                 ]),

            dict(day=2, order=6,  title='Lunch Break & Visit to Exhibition Area',
                 stype='meal',     room='Cafeteria',
                 start=dt(24,13,0),  end=dt(24,13,45),
                 featured=False, desc='',
                 subs=[]),

            dict(day=2, order=7,  title='Technical Session – 5',
                 stype='technical', room='Main Auditorium',
                 start=dt(24,13,45), end=dt(24,15,35),
                 featured=False, desc='',
                 subs=[
                     ('Invited Talk',        dt(24,13,45), dt(24,14,25)),
                     ('Paper Presentations', dt(24,14,25), dt(24,15,25)),
                     ('Product Presentation',dt(24,15,25), dt(24,15,35)),
                 ]),

            dict(day=2, order=8,  title='Tea Break & Visit to Exhibition Area',
                 stype='break',    room='Exhibition Area',
                 start=dt(24,15,35), end=dt(24,16,0),
                 featured=False, desc='',
                 subs=[]),

            dict(day=2, order=9,  title='Technical Session – 6',
                 stype='technical', room='Main Auditorium',
                 start=dt(24,16,0),  end=dt(24,17,40),
                 featured=False, desc='',
                 subs=[
                     ('Invited Talk',        dt(24,16,0),  dt(24,16,40)),
                     ('Paper Presentations', dt(24,16,40), dt(24,17,30)),
                     ('Product Presentation',dt(24,17,30), dt(24,17,40)),
                 ]),

            dict(day=2, order=10, title='Ideathon — Live Collaborative Library Innovation Challenge',
                 stype='ideathon',  room='Main Auditorium',
                 start=dt(24,17,40), end=dt(24,18,10),
                 featured=False, desc='Presentations — 5 minutes each',
                 subs=[]),

            dict(day=2, order=11, title='Gala Dinner',
                 stype='meal',     room='Dining Hall',
                 start=dt(24,19,30), end=dt(24,21,0),
                 featured=False, desc='',
                 subs=[]),
        ]

        # ── DAY 3 — Oct 25 ──────────────────────────────────────────────
        sessions += [
            dict(day=3, order=1,  title='Keynote Address – 3',
                 stype='keynote',  room='Main Auditorium',
                 start=dt(25,9,0),   end=dt(25,9,30),
                 featured=True, desc='',
                 subs=[]),

            dict(day=3, order=2,  title='Technical Session – 7',
                 stype='technical', room='Main Auditorium',
                 start=dt(25,9,30),  end=dt(25,11,10),
                 featured=False, desc='',
                 subs=[
                     ('Invited Talk',        dt(25,9,30),  dt(25,10,10)),
                     ('Paper Presentations', dt(25,10,10), dt(25,11,0)),
                     ('Product Presentation',dt(25,11,0),  dt(25,11,10)),
                 ]),

            dict(day=3, order=3,  title='Tea Break & Visit to Exhibition Area',
                 stype='break',    room='Exhibition Area',
                 start=dt(25,11,10), end=dt(25,11,30),
                 featured=False, desc='',
                 subs=[]),

            dict(day=3, order=4,  title='Technical Session – 8',
                 stype='technical', room='Main Auditorium',
                 start=dt(25,11,30), end=dt(25,13,0),
                 featured=False, desc='',
                 subs=[
                     ('Invited Talk',        dt(25,11,30), dt(25,12,10)),
                     ('Paper Presentations', dt(25,12,10), dt(25,12,50)),
                     ('Product Presentation',dt(25,12,50), dt(25,13,0)),
                 ]),

            dict(day=3, order=5,  title='Lunch Break & Visit to Exhibition Area',
                 stype='meal',     room='Cafeteria',
                 start=dt(25,13,0),  end=dt(25,13,45),
                 featured=False, desc='',
                 subs=[]),

            dict(day=3, order=6,  title='Technical Session – 9',
                 stype='technical', room='Main Auditorium',
                 start=dt(25,13,45), end=dt(25,15,35),
                 featured=False, desc='',
                 subs=[
                     ('Invited Talk',        dt(25,13,45), dt(25,14,25)),
                     ('Paper Presentations', dt(25,14,25), dt(25,15,25)),
                     ('Product Presentation',dt(25,15,25), dt(25,15,35)),
                 ]),

            dict(day=3, order=7,  title='Tea Break & Visit to Exhibition Area',
                 stype='break',    room='Exhibition Area',
                 start=dt(25,15,35), end=dt(25,15,55),
                 featured=False, desc='',
                 subs=[]),

            dict(day=3, order=8,  title='Panel Discussion',
                 stype='panel',    room='Main Auditorium',
                 start=dt(25,15,55), end=dt(25,17,0),
                 featured=False, desc='',
                 subs=[]),

            dict(day=3, order=9,  title='Concluding Session',
                 stype='ceremony', room='Main Auditorium',
                 start=dt(25,17,0),  end=dt(25,18,0),
                 featured=True, desc='Closing Ceremony',
                 subs=[]),

            dict(day=3, order=10, title='High Tea',
                 stype='break',    room='Foyer',
                 start=dt(25,18,0),  end=dt(25,19,0),
                 featured=False, desc='',
                 subs=[]),
        ]

        # ── Create sessions ──────────────────────────────────────────────
        created = 0
        for s in sessions:
            sess = ScheduleSession.objects.create(
                day=s['day'],
                title=s['title'],
                session_type=s['stype'],
                start_datetime=s['start'],
                end_datetime=s['end'],
                room=s.get('room',''),
                description=s.get('desc',''),
                is_featured=s.get('featured', False),
                is_parallel=s.get('is_parallel', False),
                is_published=True,
                feedback_enabled=s['stype'] not in ('break','meal','special'),
                feedback_auto_open=True,
                display_order=s['order'],
            )
            for i, sub in enumerate(s.get('subs',[])):
                ScheduleSubSession.objects.create(
                    parent=sess,
                    title=sub[0],
                    start_datetime=sub[1],
                    end_datetime=sub[2],
                    display_order=i+1,
                )
            # Auto-create default feedback form for sessions that need one
            if sess.feedback_enabled:
                form = FeedbackForm.objects.create(session=sess, title=f'Feedback: {sess.title}')
                defaults = [
                    ('How would you rate this session overall?', 'rating',  True,  1),
                    ('How relevant was the content to your interests?', 'rating', True, 2),
                    ('How effective was the speaker/presenter?', 'rating',  True,  3),
                    ('Would you recommend this session to others?', 'boolean', True, 4),
                    ('Any comments or suggestions?', 'text', False, 5),
                ]
                for qtext, qtype, req, order in defaults:
                    FeedbackQuestion.objects.create(
                        form=form, question_text=qtext,
                        question_type=qtype, is_required=req, display_order=order
                    )
            created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {created} sessions with sub-sessions and feedback forms.'
        ))
