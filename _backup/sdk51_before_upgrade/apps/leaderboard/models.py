from django.db import models
from django.conf import settings


class PointAction(models.TextChoices):
    SIGNUP             = 'signup',             'Account Created'
    CHECKIN            = 'checkin',            'Check-in'
    POLL_VOTE          = 'poll_vote',          'Poll Vote'
    PHOTO_UPLOAD       = 'photo_upload',       'Photo Upload'
    PROFILE_COMPLETION = 'profile_completion', 'Profile Completion'


# Points awarded per action
POINT_VALUES = {
    PointAction.SIGNUP:             10,
    PointAction.CHECKIN:            10,
    PointAction.POLL_VOTE:          20,
    PointAction.PHOTO_UPLOAD:       15,
    PointAction.PROFILE_COMPLETION: 50,
}


class PointEntry(models.Model):
    """Each row = one point-earning event for a user."""
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='point_entries')
    action     = models.CharField(max_length=30, choices=PointAction.choices)
    points     = models.PositiveIntegerField()
    note       = models.CharField(max_length=200, blank=True)   # e.g. "Poll: Favourite keynote"
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'point_entries'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} +{self.points} ({self.action})"


class UserPoints(models.Model):
    """
    Denormalised total for fast reads. One row per user.
    Updated via award_points() helper — no signals, no magic.
    # PONYTAIL: O(n) rank query — fine for ≤500 users.
    # If >5k users, add a rank column and update via periodic task.
    """
    user         = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='points_summary')
    total_points = models.PositiveIntegerField(default=0)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_points'
        ordering = ['-total_points']

    def __str__(self):
        return f"{self.user.email}: {self.total_points}pts"

    @property
    def rank(self):
        """1-based rank among participants only."""
        if self.user.role != 'participant':
            return 0
        return UserPoints.objects.filter(
            user__role='participant',
            total_points__gt=self.total_points,
        ).count() + 1
