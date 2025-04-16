from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'photos', views.PhotoViewSet)
router.register(r'albums', views.AlbumViewSet)
router.register(r'tags', views.AlbumTagViewSet, basename='tag')

urlpatterns = [
    path('csrf/', views.get_csrf_token, name='get_csrf_token'),
    path('user/', views.UserViewSet.as_view({'get': 'retrieve'}), name='user-detail'),
    # path('register/', views.register, name='register'),
    path('albums/<int:album_id>/reorder-photos/', views.reorder_photos, name='reorder-photos'),
    path('favorites/', views.get_favorites, name='get-favorites'),
    path('photos/<int:photo_id>/toggle-favorite/', views.toggle_favorite, name='toggle-favorite'),
    path('user/update-avatar/', views.update_avatar, name='update_avatar'),

    path('', include(router.urls)),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.UserRegistrationView.as_view(), name='user_register'),
    path('auth/confirm-email/', views.EmailConfirmationView.as_view(), name='confirm_email'),
    path('auth/confirm-email/<uuid:token>/', views.confirm_email_direct, name='confirm_email_direct'),
    path('auth/resend-confirmation/', views.ResendConfirmationEmailView.as_view(), name='resend_confirmation'),
    path('auth/password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('auth/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

]

urlpatterns += router.urls