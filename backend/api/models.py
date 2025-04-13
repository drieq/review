from django.db import models
from django.contrib.auth.models import User

# class UserAccountManager(BaseUserManager):
#     def create_user(self, email, password=None, **extra_fields):
#         if not email:
#             raise ValueError('Users must have an email address')
        
#         email = self.normalize_email(email)
#         user = self.model(email=email, **extra_fields)

#         user.set_password(password)
#         user.save()

#         return user
    
# class UserAccount(AbstractBaseUser, PermissionsMixin):
#     email = models.EmailField(max_length=255, unique=True)
#     first_name = models.CharField(max_length=30)
#     last_name = models.CharField(max_length=30)
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)

#     objects = UserAccountManager()

#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['first_name', 'last_name']

#     def get_full_name(self):
#         return self.first_name + ' ' + self.last_name
    
#     def get_short_name(self):
#         return self.first_name

#     def __str__(self):
#         return self.email

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

class Album(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='albums')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    
