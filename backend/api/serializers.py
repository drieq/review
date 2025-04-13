# from djoser.serializers import UserCreateSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Photo, Album
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

# class UserCreateSerializer(UserCreateSerializer):
#     class Meta(UserCreateSerializer.Meta):
#         model = User
#         fields = ('id', 'email', 'first_name', 'last_name', 'password')

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'password', 'password2')
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if username already exists
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username is already taken."})
        
        # Check if email already exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email is already registered."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'title', 'description', 'image', 'created_at']
        read_only_fields = ['created_at']

class AlbumSerializer(serializers.ModelSerializer):
    cover_photo = serializers.SerializerMethodField()
    photos = PhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Album
        fields = ['id', 'title', 'description', 'owner', 'cover_photo', 'photos', 'created_at']
        read_only_fields = ['owner', 'created_at']

    def get_cover_photo(self, obj):
        # Get the first photo in the album to use as the cover photo
        first_photo = obj.photos.first()
        if first_photo:
            return first_photo.image.url
        return None

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