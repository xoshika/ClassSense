from django.db import models
from django.utils import timezone


class ClassSession(models.Model):
    subject_name     = models.CharField(max_length=200, default="")
    teacher_name     = models.CharField(max_length=200, default="")
    room_number      = models.CharField(max_length=100, default="")
    activity_mode    = models.CharField(max_length=50, default="Lecture")
    num_chairs       = models.IntegerField(default=20)
    started_at       = models.DateTimeField(default=timezone.now)
    ended_at         = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    is_active        = models.BooleanField(default=True)
    date_key         = models.DateField(default=timezone.now)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.subject_name} ({self.activity_mode}) - {self.started_at.strftime('%Y-%m-%d')}"


class StudentRoster(models.Model):
    session     = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name="students")
    chair_rank  = models.IntegerField()
    student_name = models.CharField(max_length=200, default="")

    class Meta:
        ordering = ["chair_rank"]

    def __str__(self):
        return f"Chair {self.chair_rank} - {self.student_name}"


class GestureLog(models.Model):
    STATUS_CHOICES = [
        ("allowed", "Allowed"),
        ("warning", "Warning"),
        ("neutral", "Neutral"),
    ]

    session       = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name="gesture_logs")
    chair_rank    = models.IntegerField(default=1)
    student_name  = models.CharField(max_length=200, default="")
    gesture       = models.CharField(max_length=50)
    activity_mode = models.CharField(max_length=50, default="Lecture")
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default="neutral")
    color         = models.CharField(max_length=20, default="#888888")
    label         = models.CharField(max_length=200, default="")
    timestamp     = models.DateTimeField(default=timezone.now)
    date_key      = models.DateField(default=timezone.now)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Chair {self.chair_rank} - {self.gesture} ({self.status})"


class Alert(models.Model):
    SEVERITY_CHOICES = [
        ("info",    "Info"),
        ("warning", "Warning"),
        ("danger",  "Danger"),
    ]

    session      = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name="alerts")
    chair_rank   = models.IntegerField(default=1)
    student_name = models.CharField(max_length=200, default="")
    gesture      = models.CharField(max_length=50)
    message      = models.TextField()
    severity     = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="info")
    timestamp    = models.DateTimeField(default=timezone.now)
    responded    = models.BooleanField(default=False)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Alert: {self.gesture} - Chair {self.chair_rank}"