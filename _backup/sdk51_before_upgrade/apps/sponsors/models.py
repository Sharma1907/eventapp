from django.db import models


class Sponsor(models.Model):
    TIER_CHOICES = [
        ('national_funding', 'National Funding Agency'),
        ('platinum',         'Platinum Sponsor'),
        ('silver',           'Silver Sponsor'),
        ('bronze',           'Bronze Sponsor'),
    ]

    name        = models.CharField(max_length=200)
    tier        = models.CharField(max_length=32, choices=TIER_CHOICES, db_index=True)
    logo        = models.ImageField(upload_to='sponsors/logos/', blank=True, null=True)

    # Detail-page fields (mainly used for Platinum, but available for all)
    description         = models.TextField(blank=True, default='')
    website_url         = models.URLField(blank=True, default='')
    contact_email       = models.EmailField(blank=True, default='')
    contact_phone       = models.CharField(max_length=40, blank=True, default='')
    address             = models.CharField(max_length=400, blank=True, default='')

    linkedin_url        = models.URLField(blank=True, default='')
    twitter_url         = models.URLField(blank=True, default='')
    facebook_url        = models.URLField(blank=True, default='')
    instagram_url       = models.URLField(blank=True, default='')
    youtube_url         = models.URLField(blank=True, default='')

    partnership_details = models.TextField(blank=True, default='',
        help_text='Benefits / partnership description shown on detail page.')

    display_order       = models.PositiveIntegerField(default=0,
        help_text='Lower numbers show first within a tier.')
    is_active           = models.BooleanField(default=True)

    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['tier', 'display_order', 'name']
        verbose_name = 'Sponsor'
        verbose_name_plural = 'Sponsors'

    def __str__(self):
        return f'{self.name} ({self.get_tier_display()})'
