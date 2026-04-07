from django.contrib import admin
from .models import ClassSession, StudentRoster, GestureLog, Alert

@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ["id", "subject_name", "teacher_name", "activity_mode", "is_active", "started_at"]
    list_filter  = ["activity_mode", "is_active"]

@admin.register(StudentRoster)
class StudentRosterAdmin(admin.ModelAdmin):
    list_display = ["id", "session", "chair_rank", "student_name"]

@admin.register(GestureLog)
class GestureLogAdmin(admin.ModelAdmin):
    list_display = ["id", "session", "chair_rank", "student_name", "gesture", "status", "timestamp"]
    list_filter  = ["status", "gesture", "activity_mode"]

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ["id", "session", "chair_rank", "gesture", "severity", "responded", "timestamp"]
    list_filter  = ["severity", "responded"]