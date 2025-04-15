from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'photos', views.PhotoViewSet)
router.register(r'albums', views.AlbumViewSet)
router.register(r'tags', views.TagViewSet, basename='tag')

urlpatterns = [
    path('csrf/', views.get_csrf_token, name='get_csrf_token'),
    path('user/', views.UserViewSet.as_view({'get': 'retrieve'}), name='user-detail'),
    path('register/', views.register, name='register'),
    path('albums/<int:album_id>/reorder-photos/', views.reorder_photos, name='reorder-photos'),
    path('favorites/', views.get_favorites, name='get-favorites'),
    path('photos/<int:photo_id>/toggle-favorite/', views.toggle_favorite, name='toggle-favorite'),
    path('user/update-avatar/', views.update_avatar, name='update_avatar'),
]

urlpatterns += router.urls