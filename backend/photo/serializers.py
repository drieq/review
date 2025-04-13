from rest_framework import serializers
from .models import Album, Photo

class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'title', 'image', 'uploaded_at', 'album', 'order']
        read_only_fields = ['uploaded_at', 'order']

class AlbumSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Album
        fields = ['id', 'title', 'description', 'created_at', 'photos']
        read_only_fields = ['created_at'] 