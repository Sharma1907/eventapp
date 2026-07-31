from django.db import models


class ConferenceSetting(models.Model):
    """Singleton — always pk=1."""
    name        = models.CharField(max_length=200, default='ETD 2026')
    tagline     = models.CharField(max_length=300, blank=True, default='IIT Delhi')
    website_url = models.URLField(blank=True, default='https://etd2026.iitd.ac.in')
    logo        = models.ImageField(upload_to='conference/', blank=True, null=True)
    start_date  = models.DateField(null=True, blank=True)
    end_date    = models.DateField(null=True, blank=True)
    venue       = models.CharField(max_length=300, blank=True, default='IIT Delhi, New Delhi')
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Conference Setting'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return self.name
