from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Photo, Album
from .serializers import PhotoSerializer, AlbumSerializer 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({'username': request.user.username})

class PhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Photo.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class AlbumViewSet(viewsets.ModelViewSet):
    serializer_class = AlbumSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Album.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)