from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'photos', views.PhotoViewSet)
router.register(r'albums', views.AlbumViewSet)

urlpatterns = [
    path('csrf/', views.get_csrf_token, name='get_csrf_token'),
    path('user/', views.UserViewSet.as_view({'get': 'retrieve'}), name='user-detail'),
    path('register/', views.register, name='register'),
    path('albums/<int:album_id>/reorder-photos/', views.reorder_photos, name='reorder-photos'),
]

urlpatterns += router.urls