from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, permissions

from .models import Photo, Album
from .serializers import PhotoSerializer, AlbumSerializer 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({'username': request.user.username})

def album_detail(request, id):
    try:
        album = Album.objects.get(id=id)
        return JsonResponse({'id': album.id, 'name': album.name, 'description': album.description, 'photos': album.photos})
    except Album.DoesNotExist:
        return JsonResponse({'error': 'Album not found'}, status=404)

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
    
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
class AlbumUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        album = get_object_or_404(Album, pk=pk)
        images = request.FILES.getlist('images')

        photos = []
        for image in images:
            photo = Photo.objects.create(album=album, image=image, owner=request.user, title=image.name)
            photos.append(photo)

        serializer = PhotoSerializer(photos, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)