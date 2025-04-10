# from djoser.serializers import UserCreateSerializer
from django.contrib.auth.models import User

from rest_framework import serializers
from .models import Photo, Album

# User = get_user_model()

# class UserCreateSerializer(UserCreateSerializer):
#     class Meta(UserCreateSerializer.Meta):
#         model = User
#         fields = ('id', 'email', 'first_name', 'last_name', 'password')

class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'title', 'description', 'image']

class AlbumSerializer(serializers.ModelSerializer):
    cover_photo = serializers.SerializerMethodField()
    photos = PhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Album
        fields = ['id', 'title', 'description', 'owner', 'cover_photo', 'photos']

    def get_cover_photo(self, obj):
        # Get the first photo in the album to use as the cover photo
        first_photo = obj.photos.first()
        if first_photo:
            return first_photo.image.url
        return None