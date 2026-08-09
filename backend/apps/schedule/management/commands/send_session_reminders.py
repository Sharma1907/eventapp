"""
Send push notifications for upcoming sessions.

Run every minute via cron:
  * * * * * cd /workspaces/eventapp/backend && python manage.py send_session_reminders >> /tmp/reminders.log 2>&1

Logic:
  1. Featured sessions → notify ALL users 60 min before start
  2. All sessions      → notify ALL users 5 min before start
  3. Bookmarked users  → notify at their chosen reminder_minutes before start
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Send session reminder push notifications'

    def handle(self, *args, **options):
        from apps.schedule.models import ScheduleSession, SessionBookmark
        from apps.notifications.models import DeviceToken
        from apps.notifications.fcm import send_to_tokens

        now = timezone.now()

        # 1) Featured sessions — 60 min reminder to ALL, once
        featured = ScheduleSession.objects.filter(
            is_published=True,
            is_featured=True,
            notify_featured_60_sent_at__isnull=True,
            start_datetime__gte=now + timedelta(minutes=59),
            start_datetime__lte=now + timedelta(minutes=61),
        )
        for sess in featured:
            self._notify_all(sess, '1 hour', DeviceToken, send_to_tokens, icon='⭐')
            sess.notify_featured_60_sent_at = now
            sess.save(update_fields=['notify_featured_60_sent_at'])
            self.stdout.write(f'Featured all-users reminder sent: {sess.title}')

        # 2) All sessions — 5 min reminder to ALL, once
        upcoming = ScheduleSession.objects.filter(
            is_published=True,
            notify_all_5_sent_at__isnull=True,
            start_datetime__gte=now + timedelta(minutes=4),
            start_datetime__lte=now + timedelta(minutes=6),
        )
        for sess in upcoming:
            self._notify_all(sess, '5 min', DeviceToken, send_to_tokens, icon='🔔')
            sess.notify_all_5_sent_at = now
            sess.save(update_fields=['notify_all_5_sent_at'])
            self.stdout.write(f'5-min all-users reminder sent: {sess.title}')

        # 3) Bookmarked users — once per bookmark
        for minutes in [5, 15, 30, 60]:
            bookmarks = SessionBookmark.objects.filter(
                reminder_sent=False,
                reminder_minutes=minutes,
                session__is_published=True,
                session__start_datetime__gte=now + timedelta(minutes=minutes - 1),
                session__start_datetime__lte=now + timedelta(minutes=minutes + 1),
            ).select_related('user', 'session')

            for bm in bookmarks:
                tokens = list(DeviceToken.objects.filter(
                    user=bm.user, is_active=True
                ).values_list('token', flat=True))
                if tokens:
                    label = f'{minutes} min' if minutes < 60 else '1 hour'
                    send_to_tokens(
                        tokens,
                        f'⏰ Starting in {label}',
                        f'{bm.session.title} starts soon.' + (f' Venue: {bm.session.room}' if bm.session.room else ''),
                        {'type': 'session_reminder', 'session_id': str(bm.session.id)},
                    )
                bm.reminder_sent = True
                bm.save(update_fields=['reminder_sent'])
                self.stdout.write(f'Bookmark reminder sent: {bm.user.email} → {bm.session.title}')

        self.stdout.write(self.style.SUCCESS(f'Reminders checked at {now:%Y-%m-%d %H:%M:%S UTC}'))

    def _notify_all(self, sess, label, DeviceToken, send_to_tokens, icon='🔔'):
        tokens = list(DeviceToken.objects.filter(is_active=True).values_list('token', flat=True))
        if not tokens:
            return
        send_to_tokens(
            tokens,
            f'{icon} Starting in {label}',
            f'{sess.title} is starting in {label}.' + (f' Venue: {sess.room}' if sess.room else ''),
            {'type': 'session_reminder', 'session_id': str(sess.id)},
        )
