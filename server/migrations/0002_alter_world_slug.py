# Generated by Django 4.2.11 on 2024-04-05 03:50

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='world',
            name='slug',
            field=models.CharField(max_length=255, unique=True, validators=[django.core.validators.RegexValidator('^[a-z]+-[a-z]+-[a-z]+$', message='Only 3 lowercase words without special characters joined with dashes is allowed, i.e. turkey-bacon-sandwich.')]),
        ),
    ]
