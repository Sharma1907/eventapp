"""
Management command: remove all dummy participants (email ends with @test.com).

Usage:
    python manage.py purge_dummy_participants
    python manage.py purge_dummy_participants --confirm
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Remove all dummy participants whose email ends with @test.com'

    def add_arguments(self, parser):
        parser.add_argument('--confirm', action='store_true',
                            help='Actually delete (dry-run without this flag)')

    def handle(self, *args, **options):
        qs = User.objects.filter(email__endswith='@test.com', role='participant')
        count = qs.count()

        if count == 0:
            self.stdout.write('No dummy participants found.')
            return

        self.stdout.write(f'Found {count} dummy participant(s) with @test.com email.')

        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                'Dry run — no records deleted. Re-run with --confirm to actually delete.'
            ))
            for u in qs:
                self.stdout.write(f'  would delete: {u.email}  {u.registration_id}')
            return

        deleted, _ = qs.delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted} dummy participant(s).'))
