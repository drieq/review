from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import PermissionDenied
from django.core.mail import send_mail
from django.http import JsonResponse, HttpResponse, FileResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404, redirect
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.views.decorators.http import require_http_methods

from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.models import SocialAccount
from uuid import uuid4

import json, jwt, zipfile, io, os, requests, uuid

from datetime import timedelta, datetime

from .models import Photo, Album, Favorite, UserProfile, AlbumTag, LoginAttempt, AccessLink, ClientSelection, ClientAccessToken
from .serializers import (
    UserSerializer, PhotoSerializer, AlbumSerializer, AlbumTagSerializer,
    UserRegistrationSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, EmailConfirmationSerializer,
    CustomTokenObtainPairSerializer
)
from .authentication import ClientAccessTokenAuthentication


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

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def register(request):
#     serializer = UserSerializer(data=request.data)
#     if serializer.is_valid():
#         user = serializer.save()
#         user.is_active = True  # Activate user immediately
#         user.save()
        
#         return Response(
#             {'message': 'Registration successful. You can now log in.'}, 
#             status=status.HTTP_201_CREATED
#         )
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """
    Get CSRF token for the current session.
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users should only be able to see their own profile
        if self.action == 'list':
            return User.objects.filter(id=self.request.user.id)
        return super().get_queryset()
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
class AlbumTagViewSet(viewsets.ModelViewSet):
    serializer_class = AlbumTagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AlbumTag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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

# Custom TokenObtainPairView with login attempt tracking
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username', '')
        ip_address = self.get_client_ip(request)
        
        # Check for too many failed attempts
        try:
            recent_failed_attempts = LoginAttempt.objects.filter(
                username=username,
                ip_address=ip_address,
                was_successful=False,
                attempted_at__gte=timezone.now() - timedelta(minutes=15)
            ).count()
            
            if recent_failed_attempts >= 5:
                return Response(
                    {"detail": "Too many failed login attempts. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error checking login attempts: {str(e)}")
        
        # Validate credentials first
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            # Still record the failed attempt
            LoginAttempt.objects.create(
                username=username,
                ip_address=ip_address,
                was_successful=False
            )
            raise

        user = serializer.user

        # Check if email is confirmed
        try:
            if not user.userprofile.email_confirmed:
                return Response(
                    {"detail": "Please confirm your email before logging in."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserProfile.DoesNotExist:
            return Response(
                {"detail": "User profile not found. Contact support."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Generate tokens
        refresh = serializer.validated_data['refresh']
        access = serializer.validated_data['access']

        # Record successful login
        LoginAttempt.objects.create(
            username=username,
            ip_address=ip_address,
            was_successful=True
        )

        response = Response({
            'refresh': str(refresh),
            'access': str(access),
        })

        return response
        
        # Record the login attempt
        try:
            was_successful = response.status_code == 200
            LoginAttempt.objects.create(
                username=username,
                ip_address=ip_address,
                was_successful=was_successful
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error checking login attempts: {str(e)}")
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(
                user=user,
                email_confirmation_token=uuid4(),
                email_confirmation_sent_date=timezone.now()
            )
        
        try:
            profile.send_confirmation_email()
        except Exception as e:
            print(f"Error sending confirmation email: {str(e)}")
        
      # Log the email confirmation attempt to help with debugging
        print(f"Sending confirmation email to {user.email}")
        
        return Response({
            "username": user.username,
            "email": user.email,
            "detail": "User registered successfully. Please check your email to confirm your account.",
            "is_confirmed": False,
            "next_steps": [
                "Check your email for the confirmation link",
                "Click the link to activate your account",
                "Log in with your credentials once activated"
            ]
        }, status=status.HTTP_201_CREATED)

class EmailConfirmationView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmailConfirmationSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            print(f"Looking up token: {serializer.validated_data['token']}")
            profile = UserProfile.objects.get(email_confirmation_token=serializer.validated_data['token'])
            
            # Check if the token is expired (48 hours)
            if profile.email_confirmation_sent_date and timezone.now() > profile.email_confirmation_sent_date + timedelta(hours=48):
                # Generate a new token and send a new email
                profile.email_confirmation_token = uuid.uuid4()
                profile.send_confirmation_email()
                return Response({
                    "detail": "Confirmation link expired. A new confirmation email has been sent.",
                    "email": profile.user.email
                }, status=status.HTTP_400_BAD_REQUEST)
            
            profile.email_confirmed = True
            profile.save()
            
            return Response({
                "detail": "Email confirmed successfully. You can now log in.",
                "email": profile.user.email,
                "username": profile.user.username
            }, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            print(f"No profile found with token: {serializer.validated_data['token']}")
            return Response({"detail": "Invalid confirmation token."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error confirming email: {str(e)}")
            return Response({"detail": f"Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            self.send_password_reset_email(user)
        except User.DoesNotExist:
            # Don't reveal if the email exists or not
            pass
        
        return Response({"detail": "Password reset email has been sent if the email exists in our system."}, status=status.HTTP_200_OK)
    
    def send_password_reset_email(self, user):
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        reset_link = f"{settings.SITE_URL}/reset-password/{uid}/{token}/"
        
        context = {
            'user': user,
            'reset_link': reset_link,
        }
        
        message = render_to_string('emails/password_reset_email.html', context)
        
        send_mail(
            'Reset your password',
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=message,
            fail_silently=False,
        )

class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uidb64']))
            user = User.objects.get(pk=uid)
            
            if not default_token_generator.check_token(user, serializer.validated_data['token']):
                return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['password'])
            user.save()
            
            return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

class ResendConfirmationEmailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        user = request.user
        profile = user.userprofile
        
        if profile.email_confirmed:
            return Response({"detail": "Email is already confirmed."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if we've sent too many emails recently (anti-spam measure)
        if profile.email_confirmation_sent_date and timezone.now() < profile.email_confirmation_sent_date + timedelta(minutes=5):
            return Response({"detail": "Please wait 5 minutes before requesting another confirmation email."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Generate a new token and send a new email
        profile.email_confirmation_token = uuid.uuid4()
        profile.send_confirmation_email()
        
        return Response({"detail": "Confirmation email has been sent."}, status=status.HTTP_200_OK)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def confirm_email_direct(request, token):
    try:
        profile = UserProfile.objects.get(email_confirmation_token=token)

        if profile.email_confirmed:
            return redirect(f'http://localhost:5173/login?confirmed=true&user={profile.user.username}')

        if profile.email_confirmation_sent_date and timezone.now() > profile.email_confirmation_sent_date + timedelta(hours=48):
            profile.email_confirmation_token = uuid.uuid4()
            profile.send_confirmation_email()
            return redirect('http://localhost:5173/login?expired=true')

        profile.email_confirmed = True
        profile.save()
        return redirect(f'http://localhost:5173/login?confirmed=true&user={profile.user.username}')
    
    except UserProfile.DoesNotExist:
        return redirect('http://localhost:5173/login?error=invalid_token')

    except Exception as e:
        return redirect(f'http://localhost:5173/login?error=server_error')
    
class ClientAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        password = request.data.get("password")
        try:
            access_link = AccessLink.objects.get(token=token)
        except AccessLink.DoesNotExist:
            return Response({"error": "Invalid link"}, status=404)

        if not access_link.check_password(password):
            return Response({"error": "Invalid password"}, status=401)

        access_token = str(uuid.uuid4())
        ClientAccessToken.objects.create(
            token=access_token,
            access_link=access_link,
            expires_at=timezone.now() + timedelta(hours=2)
        )

        return Response({"access_token": access_token})


class ClientBaseView(APIView):
    authentication_classes = [ClientAccessTokenAuthentication]
    permission_classes = [AllowAny]


class ClientAlbumAccessView(ClientBaseView):
    def get(self, request, token):
        token_obj = request.auth
        if not token_obj or not token_obj.is_valid():
            return Response({"error": "Invalid or expired token"}, status=403)

        access_link = token_obj.access_link
        serializer = AlbumSerializer(access_link.album, context={"request": request})
        return Response({
            "album": serializer.data,
            "can_download": access_link.can_download,
            "max_selections": access_link.max_selections,
            "welcome_message": access_link.welcome_message,
        })


class ClientGetSelectionsView(ClientBaseView):
    def get(self, request, token):
        token_obj = request.auth
        access_link = token_obj.access_link
        selections = ClientSelection.objects.filter(access_link=access_link)

        data = [
            {
                'id': sel.id,
                'photo_id': sel.photo.id,
                'selected_at': sel.created_at
            } for sel in selections
        ]
        return JsonResponse({'selections': data})


class ClientSelectPhotoView(ClientBaseView):
    def post(self, request, token, photo_id):
        access_link = request.auth.access_link
        photo = get_object_or_404(Photo, id=photo_id, album=access_link.album)

        if access_link.max_selections is not None:
            if ClientSelection.objects.filter(access_link=access_link).count() >= access_link.max_selections:
                return JsonResponse({'error': 'Max selections reached'}, status=403)

        selection, created = ClientSelection.objects.get_or_create(
            access_link=access_link,
            photo=photo,
            defaults={"selected": True}
        )

        if not created:
            return JsonResponse({'message': 'Already selected'})

        return JsonResponse({'message': 'Photo selected'}, status=201)

    def delete(self, request, token, photo_id):
        access_link = request.auth.access_link
        photo = get_object_or_404(Photo, id=photo_id, album=access_link.album)
        try:
            selection = ClientSelection.objects.get(access_link=access_link, photo=photo)
            selection.delete()
            return JsonResponse({'status': 'unselected'})
        except ClientSelection.DoesNotExist:
            return JsonResponse({'error': 'Selection not found'}, status=404)


class ClientDownloadSelectedView(ClientBaseView):
    def post(self, request, token):
        access_link = request.auth.access_link

        if not access_link.can_download:
            return JsonResponse({'error': 'Downloads not allowed'}, status=403)

        photo_ids = request.data.get('photo_ids', [])
        if not photo_ids:
            return JsonResponse({'error': 'No photos selected'}, status=400)

        selections = ClientSelection.objects.filter(access_link=access_link, photo__id__in=photo_ids)
        if not selections.exists():
            return JsonResponse({'error': 'No valid selections found'}, status=404)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for sel in selections:
                path = sel.photo.image.path
                name = f"{sel.photo.id}_{os.path.basename(path)}"
                zip_file.write(path, name)

        zip_buffer.seek(0)
        return FileResponse(zip_buffer, as_attachment=True, filename=f"{access_link.album.title}_selected.zip")


class ClientDownloadAllView(ClientBaseView):
    def get(self, request, token):
        access_link = request.auth.access_link

        if not access_link.can_download:
            return JsonResponse({'error': 'Downloads not allowed'}, status=403)

        photos = Photo.objects.filter(album=access_link.album)
        if not photos.exists():
            return JsonResponse({'error': 'No photos found'}, status=404)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for photo in photos:
                path = photo.image.path
                name = f"{photo.id}_{os.path.basename(path)}"
                zip_file.write(path, name)

        zip_buffer.seek(0)
        return FileResponse(zip_buffer, as_attachment=True, filename=f"{access_link.album.title}_all_photos.zip")
