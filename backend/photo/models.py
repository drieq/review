from django.db import models
from django.contrib.auth.models import User
from api.models import Photo, Album

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'photo']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} favorited {self.photo.title}" 