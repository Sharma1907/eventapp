from django.db import models
from django.conf import settings
import uuid


class DeviceToken(models.Model):
    PLATFORM_CHOICES = [
        ('android', 'Android'),
        ('ios', 'iOS'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='device_tokens')
    token      = models.TextField(unique=True)
    platform   = models.CharField(max_length=10, choices=PLATFORM_CHOICES, default='android')
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.email} — {self.platform}"


class Notification(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent',    'Sent'),
        ('failed',  'Failed'),
    ]
    TARGET_CHOICES = [
        ('all',  'All Users'),
        ('role', 'By Role'),
        ('user', 'Specific User'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=200)
    body         = models.TextField()
    data         = models.JSONField(default=dict, blank=True)
    target_type  = models.CharField(max_length=20, choices=TARGET_CHOICES, default='all')
    target_role  = models.CharField(max_length=50, blank=True)
    target_user  = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='targeted_notifications')
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_count   = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    sent_by      = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='sent_notifications')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.status})"

    @property
    def delivered_count(self):
        return self.user_notifications.filter(delivered=True).count()

    @property
    def read_count(self):
        return self.user_notifications.filter(read=True).count()


class UserNotification(models.Model):
    """
    Per-user delivery + read tracking.
    Created when a notification is sent to a user.
    """
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='user_notifications')
    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    delivered    = models.BooleanField(default=False)
    read         = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at      = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['notification', 'user']

    def __str__(self):
        return f"{self.notification.title} → {self.user.email}"
