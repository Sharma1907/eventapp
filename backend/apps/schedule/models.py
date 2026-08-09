from django.db import models
from django.conf import settings
import uuid


class SESSION_TYPE(models.TextChoices):
    KEYNOTE   = 'keynote',   'Keynote'
    TECHNICAL = 'technical', 'Technical Session'
    WORKSHOP  = 'workshop',  'Workshop'
    BREAK     = 'break',     'Break'
    MEAL      = 'meal',      'Meal'
    CULTURAL  = 'cultural',  'Cultural'
    PANEL     = 'panel',     'Panel Discussion'
    SPECIAL   = 'special',   'Special Session'
    IDEATHON  = 'ideathon',  'Ideathon'
    CEREMONY  = 'ceremony',  'Ceremony'


class ScheduleSession(models.Model):
    """Parent session — e.g. 'Technical Session – 1', 'Keynote Address – 2'."""

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    day             = models.PositiveSmallIntegerField(
                        choices=[(1,'Day 1'),(2,'Day 2'),(3,'Day 3')],
                        db_index=True)
    title           = models.CharField(max_length=300)
    session_type    = models.CharField(max_length=20, choices=SESSION_TYPE.choices, default=SESSION_TYPE.TECHNICAL)
    start_datetime  = models.DateTimeField()
    end_datetime    = models.DateTimeField()
    room            = models.CharField(max_length=200, blank=True)
    description     = models.TextField(blank=True)

    speaker         = models.ForeignKey(
                        'speakers.Speaker', null=True, blank=True,
                        on_delete=models.SET_NULL, related_name='sessions')

    is_featured     = models.BooleanField(default=False, help_text='★ Highlighted session')
    is_parallel     = models.BooleanField(default=False, help_text='Runs alongside another session')
    is_published    = models.BooleanField(default=True)

    feedback_enabled     = models.BooleanField(default=False)
    feedback_auto_open   = models.BooleanField(default=True,  help_text='Auto-enable at end_datetime')
    feedback_manual_open = models.BooleanField(default=False, help_text='Admin manually opened')

    # Prevent duplicate cron sends
    notify_all_5_sent_at       = models.DateTimeField(null=True, blank=True)
    notify_featured_60_sent_at = models.DateTimeField(null=True, blank=True)

    display_order   = models.PositiveIntegerField(default=0)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day', 'display_order', 'start_datetime']
        verbose_name = 'Session'

    def __str__(self):
        return f"Day {self.day} | {self.start_datetime:%H:%M} — {self.title}"

    @property
    def feedback_open(self):
        from django.utils import timezone
        if self.feedback_manual_open:
            return True
        if self.feedback_auto_open and timezone.now() >= self.end_datetime:
            return True
        return False

    @property
    def status(self):
        from django.utils import timezone
        now = timezone.now()
        if now < self.start_datetime:
            return 'upcoming'
        if now <= self.end_datetime:
            return 'live'
        return 'past'


class ScheduleSubSession(models.Model):
    """Child slot inside a parent session — e.g. 'Invited Talk', 'Paper Presentations'."""

    parent          = models.ForeignKey(ScheduleSession, on_delete=models.CASCADE, related_name='sub_sessions')
    title           = models.CharField(max_length=300)
    start_datetime  = models.DateTimeField(null=True, blank=True)
    end_datetime    = models.DateTimeField(null=True, blank=True)
    speaker         = models.ForeignKey(
                        'speakers.Speaker', null=True, blank=True,
                        on_delete=models.SET_NULL, related_name='sub_sessions')
    description     = models.TextField(blank=True)
    display_order   = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'start_datetime']

    def __str__(self):
        return f"{self.parent.title} → {self.title}"


class SessionBookmark(models.Model):
    """User bookmarks a session + sets reminder preference."""

    REMINDER_CHOICES = [(5,'5 min'),(15,'15 min'),(30,'30 min'),(60,'1 hour')]

    user             = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks')
    session          = models.ForeignKey(ScheduleSession, on_delete=models.CASCADE, related_name='bookmarks')
    reminder_minutes = models.PositiveSmallIntegerField(choices=REMINDER_CHOICES, default=5)
    reminder_sent    = models.BooleanField(default=False)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'session']
        ordering = ['session__start_datetime']

    def __str__(self):
        return f"{self.user.email} → {self.session.title}"


class FeedbackForm(models.Model):
    """Admin-created dynamic feedback form attached to a session."""

    session    = models.OneToOneField(ScheduleSession, on_delete=models.CASCADE, related_name='feedback_form')
    title      = models.CharField(max_length=300, default='Session Feedback')
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Form: {self.session.title}"


class FeedbackQuestion(models.Model):
    """Individual question in a feedback form."""

    TYPE_RATING  = 'rating'
    TYPE_BOOLEAN = 'boolean'
    TYPE_TEXT    = 'text'
    TYPE_CHOICES = [
        (TYPE_RATING,  'Star Rating (1–5)'),
        (TYPE_BOOLEAN, 'Yes / No'),
        (TYPE_TEXT,    'Free Text'),
    ]

    form          = models.ForeignKey(FeedbackForm, on_delete=models.CASCADE, related_name='questions')
    question_text = models.CharField(max_length=500)
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_RATING)
    is_required   = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return f"{self.form.session.title} — Q{self.display_order}: {self.question_text[:60]}"


class FeedbackResponse(models.Model):
    """One submission per user per session."""

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session      = models.ForeignKey(ScheduleSession, on_delete=models.CASCADE, related_name='feedback_responses')
    form         = models.ForeignKey(FeedbackForm, on_delete=models.CASCADE, related_name='responses')
    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='feedback_responses')
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'session']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.email} → {self.session.title}"


class FeedbackAnswer(models.Model):
    """One answer per question per response."""

    response      = models.ForeignKey(FeedbackResponse, on_delete=models.CASCADE, related_name='answers')
    question      = models.ForeignKey(FeedbackQuestion, on_delete=models.CASCADE, related_name='answers')
    rating_value  = models.PositiveSmallIntegerField(null=True, blank=True)
    boolean_value = models.BooleanField(null=True, blank=True)
    text_value    = models.TextField(blank=True)

    def __str__(self):
        return f"Answer to: {self.question.question_text[:40]}"
