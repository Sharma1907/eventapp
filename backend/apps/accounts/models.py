from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'super_admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        SUPER_ADMIN  = 'super_admin',  'Super Admin'
        MGMT_ADMIN   = 'mgmt_admin',   'Management Admin'
        TEAM_HEAD    = 'team_head',    'Team Head'
        STAFF        = 'staff',        'Staff'
        SPEAKER      = 'speaker',      'Speaker'
        PARTICIPANT  = 'participant',  'Participant'

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email               = models.EmailField(unique=True)
    registration_id     = models.CharField(max_length=50, blank=True, null=True, unique=True)
    role                = models.CharField(max_length=20, choices=Role.choices, default=Role.PARTICIPANT)

    # Profile fields
    first_name          = models.CharField(max_length=100)
    last_name           = models.CharField(max_length=100)
    phone               = models.CharField(max_length=20, blank=True)
    affiliation         = models.CharField(max_length=200, blank=True)
    bio                 = models.TextField(blank=True)
    designation         = models.CharField(max_length=200, blank=True)
    gender              = models.CharField(max_length=20, blank=True)
    research_interests  = models.TextField(blank=True, help_text='Comma-separated research interests')
    profile_photo       = models.ImageField(upload_to='profiles/', blank=True, null=True)
    linkedin_url        = models.URLField(blank=True)

    # Visibility preferences
    show_phone          = models.BooleanField(default=False)
    show_linkedin       = models.BooleanField(default=True)

    # State flags
    must_change_password = models.BooleanField(default=True)
    profile_complete    = models.BooleanField(default=False)
    is_active           = models.BooleanField(default=True)
    is_staff            = models.BooleanField(default=False)

    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'User'

    def __str__(self):
        return f"{self.email} ({self.role})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class UserFCMToken(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fcm_tokens')
    fcm_token   = models.TextField()
    device_type = models.CharField(max_length=10, choices=[('ios','iOS'),('android','Android')])
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_fcm_tokens'
        unique_together = ['user', 'fcm_token']


# ── Participant import staging table ───────────────────────────────────────
class ParticipantImport(models.Model):
    class Status(models.TextChoices):
        PENDING  = 'pending',  'Pending'
        IMPORTED = 'imported', 'Imported'   # user record created
        FAILED   = 'failed',   'Failed'     # error during user creation

    # Raw CSV fields (all optional at model level; validation at parse time)
    salutation   = models.CharField(max_length=20, blank=True)
    full_name    = models.CharField(max_length=200)
    email        = models.EmailField()
    gender       = models.CharField(max_length=20, blank=True)
    designation  = models.CharField(max_length=200, blank=True)
    organisation = models.CharField(max_length=200, blank=True)
    mobile       = models.CharField(max_length=30, blank=True)
    address      = models.TextField(blank=True)
    pin_code     = models.CharField(max_length=20, blank=True)

    # Housekeeping
    status       = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    error_note   = models.CharField(max_length=500, blank=True)   # why it failed
    uploaded_at  = models.DateTimeField(auto_now_add=True)
    uploaded_by  = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='participant_imports'
    )

    class Meta:
        db_table = 'participant_imports'
        ordering = ['uploaded_at']

    def __str__(self):
        return f"{self.email} [{self.status}]"