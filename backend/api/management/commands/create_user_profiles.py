from django.core.management.base import BaseCommand
from api.models import UserProfile
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create UserProfile for all existing users'

    def handle(self, *args, **kwargs):
        users = User.objects.all()
        for user in users:
            UserProfile.objects.get_or_create(user=user)
            self.stdout.write(self.style.SUCCESS(f'UserProfile created for {user.username}'))
