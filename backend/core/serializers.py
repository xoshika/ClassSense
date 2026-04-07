from rest_framework import serializers
from .models import ClassSession, GestureLog, Alert, StudentRoster
from .gesture_engine import GESTURE_COLORS


class StudentRosterSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentRoster
        fields = ["id", "chair_rank", "student_name"]


class GestureLogSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = GestureLog
        fields = [
            "id", "chair_rank", "student_name", "gesture",
            "activity_mode", "status", "color", "label",
            "timestamp", "date_key", "time", "date",
        ]

    def get_time(self, obj):
        return obj.timestamp.strftime("%I:%M %p")

    def get_date(self, obj):
        return obj.timestamp.strftime("%B %d %Y")


class AlertSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            "id", "chair_rank", "student_name", "gesture",
            "message", "severity", "timestamp", "responded", "time",
        ]

    def get_time(self, obj):
        return obj.timestamp.strftime("%I:%M %p")


class ClassSessionSerializer(serializers.ModelSerializer):
    students        = StudentRosterSerializer(many=True, read_only=True)
    total_gestures  = serializers.SerializerMethodField()
    unique_students = serializers.SerializerMethodField()
    total_alerts    = serializers.SerializerMethodField()

    class Meta:
        model = ClassSession
        fields = [
            "id", "subject_name", "teacher_name", "room_number",
            "activity_mode", "num_chairs", "started_at", "ended_at",
            "duration_seconds", "is_active", "date_key",
            "students", "total_gestures", "unique_students", "total_alerts",
        ]

    def get_total_gestures(self, obj):
        return obj.gesture_logs.count()

    def get_unique_students(self, obj):
        return obj.gesture_logs.values("chair_rank").distinct().count()

    def get_total_alerts(self, obj):
        return obj.alerts.count()