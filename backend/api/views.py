from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.middleware.csrf import get_token

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.models import SocialAccount
import requests

from .models import Photo, Album, Favorite, UserProfile, AlbumTag
from .serializers import PhotoSerializer, AlbumSerializer, UserSerializer, CustomTokenObtainPairSerializer, AlbumTagSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request):
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'User updated successfully.'}, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.is_active = True  # Activate user immediately
        user.save()
        
        return Response(
            {'message': 'Registration successful. You can now log in.'}, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    try:
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'Access token is required'}, status=400)

        # Get user info from Google
        user_info_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            params={'access_token': access_token}
        )

        # Check if the request to Google was successful
        if user_info_response.status_code != 200:
            return Response({'error': 'Failed to retrieve user info from Google'}, status=400)

        user_info = user_info_response.json()

        if 'error' in user_info:
            return Response({'error': 'Invalid access token'}, status=400)

        email = user_info.get('email')
        if not email:
            return Response({'error': 'Email not found in user info'}, status=400)

        # Check if a user with this email already exists
        user = User.objects.filter(email=email).first()
        if user:
            # User exists, log them in
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            response = Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': user.username
            })
            
            # Set CSRF cookie
            response.set_cookie(
                'csrftoken',
                get_token(request),
                httponly=True,
                samesite='Lax',
                secure=False  # Set to True in production
            )
            return response
        else:
            # Create new user if they don't exist
            user = User.objects.create_user(
                username=email.split('@')[0],  # Use email prefix as username
                email=email,
                first_name=user_info.get('given_name', ''),
                last_name=user_info.get('family_name', '')
            )
            # Create social account
            SocialAccount.objects.create(
                user=user,
                provider='google',
                uid=user_info['sub'],
                extra_data=user_info
            )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            response = Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': user.username
            })
            
            # Set CSRF cookie
            response.set_cookie(
                'csrftoken',
                get_token(request),
                httponly=True,
                samesite='Lax',
                secure=False  # Set to True in production
            )
            return response

    except Exception as e:
        print(f"Error in google_login: {str(e)}")  # Log the error
        return Response({'error': 'An unexpected error occurred. Please try again.'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder_photos(request, album_id):
    try:
        album = Album.objects.get(id=album_id, owner=request.user)
        photo_orders = request.data.get('photo_orders', [])
        
        if not photo_orders:
            return Response({'error': 'No photo orders provided'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Update the order of each photo
        for photo_data in photo_orders:
            photo_id = photo_data.get('id')
            new_order = photo_data.get('order')
            
            if photo_id is None or new_order is None:
                return Response({'error': 'Invalid photo order data'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            try:
                photo = Photo.objects.get(id=photo_id, album=album)
                photo.order = new_order
                photo.save()
            except Photo.DoesNotExist:
                return Response({'error': f'Photo with id {photo_id} not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        return Response({'message': 'Photos reordered successfully'})
    except Album.DoesNotExist:
        return Response({'error': 'Album not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

def album_detail(request, id):
    try:
        album = Album.objects.get(id=id)
        return JsonResponse({'id': album.id, 'name': album.name, 'description': album.description, 'photos': album.photos})
    except Album.DoesNotExist:
        return JsonResponse({'error': 'Album not found'}, status=404)

class PhotoViewSet(viewsets.ModelViewSet):
    queryset = Photo.objects.all()
    serializer_class = PhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Photo.objects.filter(album__owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.all()
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

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """
    Get CSRF token for the current session.
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

class UserViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
class TagViewSet(viewsets.ModelViewSet):
    queryset = AlbumTag.objects.all()
    serializer_class = AlbumTagSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_favorites(request):
    favorites = Favorite.objects.filter(user=request.user)
    photos = [favorite.photo for favorite in favorites]
    serializer = PhotoSerializer(photos, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, photo_id):
    photo = get_object_or_404(Photo, id=photo_id)
    favorite, created = Favorite.objects.get_or_create(user=request.user, photo=photo)
    
    if not created:
        favorite.delete()
        return Response({'status': 'removed'})
    
    return Response({'status': 'added'})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_avatar(request):
    try:
        user_profile = UserProfile.objects.get(user=request.user)  # Get the user's profile
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile does not exist.'}, status=404)

    avatar = request.FILES.get('avatar')  # Get the uploaded avatar file

    if avatar:
        user_profile.avatar = avatar  # Update the avatar field
        user_profile.save()  # Save the profile
        return Response({'message': 'Avatar updated successfully.'})

    return Response({'error': 'No avatar provided.'}, status=400)