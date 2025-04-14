from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
# from rest_framework.routers import DefaultRouter
from api.views import PhotoViewSet, AlbumUploadView, CustomTokenObtainPairView, google_login, update_user, current_user
from api import views

from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

from django_email_verification import urls as email_urls

# router = DefaultRouter()
# router.register(r'photos', PhotoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('api.urls')),

    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/google/login/', google_login, name='google_login'),

    path('api/user/update/', update_user, name='update_user'),

    path('accounts/', include('allauth.urls')),
    path('email/', include(email_urls)),

    path('api/albums/<int:id>/', views.album_detail, name='album-detail'),
    path('api/albums/<int:pk>/upload/', AlbumUploadView.as_view(), name='album-upload'),

    path('api/current_user/', current_user, name='current_user'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
