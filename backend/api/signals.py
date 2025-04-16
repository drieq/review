from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile
import uuid
from datetime import timezone

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        profile = UserProfile.objects.create(user=instance)
        profile.email_confirmation_token = uuid.uuid4()
        profile.email_confirmation_sent_date = timezone.now()

        try:
            profile.send_confirmation_email()
            print(f"Confirmation email sent to {instance.email}")
        except Exception as e:
            print(f"Error sending confirmation email: {str(e)}")

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'userprofile'):
        instance.userprofile.save()
