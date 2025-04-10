from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
# from rest_framework.routers import DefaultRouter
from api.views import PhotoViewSet, AlbumUploadView
from api import views

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# router = DefaultRouter()
# router.register(r'photos', PhotoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('api.urls')),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/albums/<int:id>/', views.album_detail, name='album-detail'),
    path('api/albums/<int:pk>/upload/', AlbumUploadView.as_view(), name='album-upload'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
