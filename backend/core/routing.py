from django.urls import re_path
from .consumers import GestureConsumer

websocket_urlpatterns = [
    re_path(r'ws/gesture/(?P<session_id>[^/]+)/$', GestureConsumer.as_asgi()),
]