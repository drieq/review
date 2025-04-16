from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.urls import reverse
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
import uuid

class Photo(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    album = models.ForeignKey('Album', on_delete=models.CASCADE, related_name='photos')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='photos/')
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.title
    
class AlbumTag(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tags')

    def __str__(self):
        return self.name
    
    class Meta:
        unique_together = ('name', 'user')

class Album(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='albums')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tags = models.ManyToManyField(AlbumTag, related_name='albums', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'photo']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.photo.title}"
    
class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    email_confirmation_token = models.UUIDField(null=True, blank=True)
    email_confirmation_sent_date = models.DateTimeField(null=True, blank=True)
    email_confirmed = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username
    
    def send_confirmation_email(self):
        confirmation_link = f"{settings.SITE_URL}/api/auth/confirm-email/{self.email_confirmation_token}/"
        context = {
            'user': self.user,
            'confirmation_link': confirmation_link,
        }
        message = render_to_string('emails/account_confirmation_email.html', context)

        self.email_confirmation_sent_date = timezone.now()
        self.save()

        send_mail(
            'Confirm your account',
            message,
            settings.DEFAULT_FROM_EMAIL,
            [self.user.email],
            html_message=message,
            fail_silently=False,
        )

class LoginAttempt(models.Model):
    """Track login attempts to prevent brute force attacks"""
    username = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    attempted_at = models.DateTimeField(auto_now_add=True)
    was_successful = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-attempted_at']
    
    def __str__(self):
        return f"{self.username} - {self.ip_address} - {'Success' if self.was_successful else 'Failed'}"