from django.urls import path
from . import views
from .views import auth

urlpatterns = [
    # ... existing code ...
    path('api/auth/check/', auth.check_auth, name='check_auth'),
    path('api/auth/login/', auth.google_login, name='google_login'),
    path('api/auth/logout/', auth.logout_view, name='logout'),
    path('api/auth/csrf/', auth.get_csrf_token, name='get_csrf_token'),
    # ... existing code ...
] 