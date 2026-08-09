from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_add_warning_suspension_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='participantimport',
            name='registration_id',
            field=models.CharField(max_length=50, blank=True, default=''),
        ),
    ]
