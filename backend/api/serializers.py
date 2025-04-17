# from djoser.serializers import UserCreateSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Photo, Album, AlbumTag, UserProfile, LoginAttempt, AccessLink, ClientSelection
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from django.core.exceptions import ValidationError


User = get_user_model()

# class UserCreateSerializer(UserCreateSerializer):
#     class Meta(UserCreateSerializer.Meta):
#         model = User
#         fields = ('id', 'email', 'first_name', 'last_name', 'password')

class AccessLinkSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = AccessLink
        fields = [
            "id", "album", "client_name", "email", "token", "can_download",
            "max_selections", "expires_at", "welcome_message",
            "notify_on_selection", "password", "get_share_url"
        ]
        read_only_fields = ["id", "token", "get_share_url"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        instance = super().create(validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e)})
        
        # Check if email already exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email address already in use."})
            
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=True  # User can login but certain features will be limited until email is confirmed
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='userprofile.avatar', required=False)
    email_confirmed = serializers.BooleanField(source='userprofile.email_confirmed', read_only=True)


    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'email_confirmed']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }

    # def validate(self, attrs):
    #     # Remove password validation since it's not needed for GET requests
    #     return attrs

    def update(self, instance, validated_data):
        userprofile_data = validated_data.pop('userprofile', {})
        # Update the user instance with the validated data
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.save()

        # Update avatar if provided
        if 'avatar' in userprofile_data:
            instance.userprofile.avatar = userprofile_data['avatar']
            instance.userprofile.save()

        return instance

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            # Don't reveal if the email exists or not (security best practice)
            pass
        return value
    
class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    token = serializers.CharField(required=True)
    uidb64 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e)})
            
        return attrs
    
class EmailConfirmationSerializer(serializers.Serializer):
    token = serializers.UUIDField(required=True)

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
        
        # Check if the user's email is confirmed
        try:
            # Get the user first to check if it exists
            if '@' in username_or_email:
                user = User.objects.get(email=username_or_email)
            else:
                user = User.objects.get(username=username_or_email)
                
            # Check if email is confirmed for certain actions
            if not user.userprofile.email_confirmed:
                # You can either prevent login completely or just warn the user
                # For now, we'll allow login but include a flag in the response
                pass
                
        except User.DoesNotExist:
            # We'll handle this in the parent validate method
            pass
        
        # Call the parent class's validate method
        data = super().validate(attrs)
        
        # Add user information to the response
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['email_confirmed'] = self.user.userprofile.email_confirmed
        
        return data

class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'title', 'description', 'image', 'created_at']
        read_only_fields = ['created_at']

class AlbumTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlbumTag
        fields = ['id', 'name']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class AlbumSerializer(serializers.ModelSerializer):
    cover_photo = serializers.SerializerMethodField()
    photos = PhotoSerializer(many=True, read_only=True)
    tags = AlbumTagSerializer(many=True)
    owner = serializers.StringRelatedField()
    client_selections = serializers.SerializerMethodField()
    access_links = AccessLinkSerializer(many=True, read_only=True)

    class Meta:
        model = Album
        fields = ['id', 'title', 'description', 'owner', 'cover_photo', 'photos', 'created_at', 'tags', 'client_selections', 'access_links']
        read_only_fields = ['owner', 'created_at']

    def get_cover_photo(self, obj):
        # Get the first photo in the album to use as the cover photo
        first_photo = obj.photos.first()
        if first_photo:
            return first_photo.image.url
        return None
    
    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        album = Album.objects.create(**validated_data)
        
        for tag_data in tags_data:
            # Use get_or_create to ensure the tag is unique per user
            tag, created = AlbumTag.objects.get_or_create(
                name=tag_data['name'],
                user=self.context['request'].user  # Ensure the tag is unique per user
            )
            album.tags.add(tag)  # Add the tag to the album's tags
        
        return album
    
    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', [])
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        instance.tags.clear()  # Clear existing tags
        for tag_data in tags_data:
            tag, created = AlbumTag.objects.get_or_create(name=tag_data['name'], user=self.context['request'].user)
            instance.tags.add(tag)  # Add the new tags

        return instance
    
    def get_client_selections(self, album):
        access_links = AccessLink.objects.filter(album=album)
        data = {}
        for link in access_links:
            selections = ClientSelection.objects.filter(access_link=link).values_list('photo_id', flat=True)
            data[link.client_name] = list(selections)
        return data

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Get the username or email from the request
        username_or_email = attrs.get('username')
        
        # Try to find user by email if the input contains @
        if '@' in username_or_email:
            try:
                data = super().validate(attrs)

                if not self.user.userprofile.email_confirmed:
                    data['email_confirmed'] = False
                    data['message'] = "Your email is not yet confirmed. Please check your email."
                else:
                    data['email_confirmed'] = True

                # Add user information to the response
                data['username'] = self.user.username
                data['email'] = self.user.email
                
                return data
            
            except serializers.ValidationError as e:
                # Re-raise the original exception
                raise e