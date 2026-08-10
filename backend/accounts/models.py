from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    phone = models.CharField(max_length=15, blank=True)
    college = models.CharField(max_length=255, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    target_role = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.username