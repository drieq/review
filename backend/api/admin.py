from django.contrib import admin

from .models import Photo, Album, UserProfile, AlbumTag

admin.site.register(Photo)
admin.site.register(Album)
admin.site.register(UserProfile)
admin.site.register(AlbumTag)
