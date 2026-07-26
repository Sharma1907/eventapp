from django.db import models


class Event(models.Model):
    class EventType(models.TextChoices):
        CEREMONY = 'ceremony', 'Ceremony'
        KEYNOTE  = 'keynote',  'Keynote'
        WORKSHOP = 'workshop', 'Workshop'
        PAPER    = 'paper',    'Paper Session'
        POSTER   = 'poster',  'Poster Session'
        BREAK    = 'break',   'Break'
        OTHER    = 'other',   'Other'

    title      = models.CharField(max_length=200)
    event_type = models.CharField(max_length=20, choices=EventType.choices, default=EventType.OTHER)
    day        = models.PositiveSmallIntegerField(default=1, help_text='Conference day (1, 2, 3...)')
    start_time = models.TimeField()
    end_time   = models.TimeField()
    room       = models.CharField(max_length=100, blank=True)
    speaker    = models.CharField(max_length=200, blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['day', 'start_time']

    def __str__(self):
        return f"Day {self.day} {self.start_time.strftime('%H:%M')} — {self.title}"
