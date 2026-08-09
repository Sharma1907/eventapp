from django.db import models
from django.conf import settings
import uuid


class CheckIn(models.Model):
    GOODIES_CHOICES = [
        ('pending',  'Pending'),
        ('received', 'Received'),
        ('skipped',  'Skipped'),
    ]

    user         = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='checkins'
    )
    checkin_type  = models.CharField(max_length=20, default='conference')
    scanned_by    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='scanned_checkins'
    )
    scanned_at    = models.DateTimeField(auto_now_add=True)
    notes         = models.CharField(max_length=200, blank=True)

    goodies_status       = models.CharField(max_length=20, choices=GOODIES_CHOICES, default='pending')
    goodies_note         = models.TextField(blank=True)
    goodies_confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='goodies_confirmed'
    )
    goodies_confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table        = 'checkins'
        unique_together = ['user', 'checkin_type']
        ordering        = ['-scanned_at']

    def __str__(self):
        return f"{self.user.email} — {self.checkin_type} @ {self.scanned_at:%Y-%m-%d %H:%M}"


class MealPass(models.Model):
    # 'meal' = unified, old lunch/dinner kept for any existing rows
    MEAL_CHOICES = [('meal', 'Meal'), ('lunch', 'Lunch'), ('dinner', 'Dinner')]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meal_passes'
    )
    meal_type  = models.CharField(max_length=20, choices=MEAL_CHOICES, default='meal')
    date       = models.DateField()
    is_active  = models.BooleanField(default=True)
    used       = models.BooleanField(default=False)
    used_at    = models.DateTimeField(null=True, blank=True)
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='meal_scans'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'meal_passes'
        unique_together = ['user', 'meal_type', 'date']
        ordering        = ['-created_at']

    def __str__(self):
        return f"{self.user.email} — {self.meal_type} {self.date}"


class MealWindow(models.Model):
    MEAL_CHOICES = [('meal', 'Meal'), ('lunch', 'Lunch'), ('dinner', 'Dinner')]

    meal_type  = models.CharField(max_length=20, choices=MEAL_CHOICES, default='meal')
    date       = models.DateField()
    is_open    = models.BooleanField(default=True)
    opened_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='meal_windows_opened'
    )
    opened_at  = models.DateTimeField(auto_now_add=True)
    closed_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table        = 'meal_windows'
        unique_together = ['meal_type', 'date']
        ordering        = ['-opened_at']

    def __str__(self):
        return f"{self.meal_type} {self.date} — {'open' if self.is_open else 'closed'}"
