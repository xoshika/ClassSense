from django.urls import path
from . import views

urlpatterns = [
    path("auth/login/", views.login_view),
    path("auth/register/", views.register_view),
    path("dashboard/stats/", views.dashboard_stats),
    path("dashboard/dates/", views.available_dates),
    path("sessions/", views.sessions_list),
    path("sessions/active/", views.active_session),
    path("sessions/<int:pk>/", views.session_detail),
    path("gestures/", views.gesture_logs),
    path("alerts/", views.alerts_list),
    path("alerts/<int:pk>/respond/", views.alert_respond),
    path("activity/", views.class_activity),
]