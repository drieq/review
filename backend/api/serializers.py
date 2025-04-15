# from djoser.serializers import UserCreateSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Photo, Album, AlbumTag
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings

User = get_user_model()

# class UserCreateSerializer(UserCreateSerializer):
#     class Meta(UserCreateSerializer.Meta):
#         model = User
#         fields = ('id', 'email', 'first_name', 'last_name', 'password')

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='userprofile.avatar', required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'avatar']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }

    def validate(self, attrs):
        # Remove password validation since it's not needed for GET requests
        return attrs

    def update(self, instance, validated_data):
        # Update the user instance with the validated data
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)

        # Update avatar if provided
        if 'avatar' in validated_data:
            instance.avatar = validated_data['avatar']

        instance.save()
        return instance

class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'title', 'description', 'image', 'created_at']
        read_only_fields = ['created_at']

class AlbumTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlbumTag
        fields = ['id', 'name']

class AlbumSerializer(serializers.ModelSerializer):
    cover_photo = serializers.SerializerMethodField()
    photos = PhotoSerializer(many=True, read_only=True)
    tags = AlbumTagSerializer(many=True)

    class Meta:
        model = Album
        fields = ['id', 'title', 'description', 'owner', 'cover_photo', 'photos', 'created_at', 'tags']
        read_only_fields = ['owner', 'created_at']

    def get_cover_photo(self, obj):
        # Get the first photo in the album to use as the cover photo
        first_photo = obj.photos.first()
        if first_photo:
            return first_photo.image.url
        return None
    
    def create(self, validated_data):
        tags_data = validated_data.pop('tags')
        album = Album.objects.create(**validated_data)
        for tag_data in tags_data:
            tag, created = AlbumTag.objects.get_or_create(name=tag_data['name'])
            album.tags.add(tag)
        return album
    
    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags')
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        instance.tags.clear()
        for tag_data in tags_data:
            tag, created = AlbumTag.objects.get_or_create(name=tag_data['name'])
            instance.tags.add(tag)

        return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Get the username or email from the request
        username_or_email = attrs.get('username')
        
        # Try to find user by email if the input contains @
        if '@' in username_or_email:
            try:
                user = User.objects.get(email=username_or_email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError('No active account found with the given credentials')
        
        # Call the parent class's validate method
        data = super().validate(attrs)
        
        # Add username to the response
        data['username'] = self.user.username
        
        return data