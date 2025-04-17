from django import forms
from django.contrib import admin
from django.contrib.auth.hashers import make_password

from .models import Photo, Album, UserProfile, AlbumTag, AccessLink, ClientSelection

admin.site.register(Photo)
admin.site.register(Album)
admin.site.register(UserProfile)
admin.site.register(AlbumTag)
admin.site.register(ClientSelection)

class AccessLinkForm(forms.ModelForm):
    class Meta:
        model = AccessLink
        fields = "__all__"

    def clean_password(self):
        password = self.cleaned_data["password"]
        if password and not password.startswith("pbkdf2_"):  # naive check to skip already-hashed
            return make_password(password)
        return password

@admin.register(AccessLink)
class AccessLinkAdmin(admin.ModelAdmin):
    list_display = ("album", "token", "client_name", "email", "expires_at", "can_download")
    readonly_fields = ("token", "get_share_url")
