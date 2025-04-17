from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import ClientAccessToken

class ClientAccessTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = (
            request.query_params.get('access_token')
            or request.headers.get('Authorization', '').replace('Bearer ', '')
        )

        if not token:
            return None

        try:
            access_token = ClientAccessToken.objects.select_related("access_link").get(token=token)
        except ClientAccessToken.DoesNotExist:
            raise AuthenticationFailed('Invalid access token')

        if not access_token.is_valid():
            raise AuthenticationFailed('Token expired')

        # Return None for user, and the actual token object for request.auth
        return (None, access_token)