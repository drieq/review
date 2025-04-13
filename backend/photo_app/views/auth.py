from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required
from django.conf import settings
import requests
from rest_framework_simplejwt.tokens import RefreshToken

@ensure_csrf_cookie
@require_http_methods(["GET"])
def check_auth(request):
    """Check if the user is authenticated"""
    return JsonResponse({
        'is_authenticated': request.user.is_authenticated,
        'username': request.user.username if request.user.is_authenticated else None
    })

@require_http_methods(["POST"])
def google_login(request):
    """Handle Google OAuth2 token exchange and login"""
    token = request.POST.get('token')
    if not token:
        return JsonResponse({'error': 'No token provided'}, status=400)

    try:
        # Verify the token with Google
        response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {token}'}
        )
        user_info = response.json()

        # Get or create user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user, created = User.objects.get_or_create(
            email=user_info['email'],
            defaults={
                'username': user_info['email'],
                'first_name': user_info.get('given_name', ''),
                'last_name': user_info.get('family_name', '')
            }
        )

        # Log the user in
        login(request, user)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return JsonResponse({
            'status': 'success',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip()
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_http_methods(["POST"])
def login_view(request):
    """Handle regular login with username/password"""
    from django.contrib.auth import authenticate
    from rest_framework_simplejwt.tokens import RefreshToken

    username = request.POST.get('username')
    password = request.POST.get('password')

    if not username or not password:
        return JsonResponse({'error': 'Username and password are required'}, status=400)

    user = authenticate(username=username, password=password)
    if user is None:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return JsonResponse({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username
    })

@require_http_methods(["POST"])
def logout_view(request):
    """Handle user logout"""
    logout(request)
    return JsonResponse({'status': 'success'})

@login_required
@require_http_methods(["GET"])
def get_csrf_token(request):
    """Get CSRF token for authenticated requests"""
    return JsonResponse({'csrfToken': get_token(request)}) 