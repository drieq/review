from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Album, Photo
from .serializers import AlbumSerializer, PhotoSerializer
from django.db import transaction

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder_photos(request, album_id):
    try:
        album = get_object_or_404(Album, id=album_id, user=request.user)
        photo_ids = request.data.get('photo_ids', [])
        
        if not photo_ids:
            return Response({'error': 'No photo IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Verify all photos belong to the album
        photos = Photo.objects.filter(id__in=photo_ids, album=album)
        if len(photos) != len(photo_ids):
            return Response({'error': 'Invalid photo IDs'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update the order of each photo
        with transaction.atomic():
            for index, photo_id in enumerate(photo_ids):
                photo = Photo.objects.get(id=photo_id)
                photo.order = index
                photo.save()
                
        return Response({'message': 'Photos reordered successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST) 