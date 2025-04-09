from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import current_user, PhotoViewSet, AlbumViewSet

router = DefaultRouter();
router.register(r'photos', PhotoViewSet, basename='photo')
router.register(r'albums', AlbumViewSet, basename='album')

urlpatterns = [
    path('', include(router.urls)),
    path('user/', current_user),
]