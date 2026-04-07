from collections import defaultdict
from datetime import datetime

from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .gesture_engine import GESTURE_COLORS, get_rule
from .models import Alert, ClassSession, GestureLog, StudentRoster
from .serializers import (
    AlertSerializer,
    ClassSessionSerializer,
    GestureLogSerializer,
    StudentRosterSerializer,
)


# ── AUTH ──────────────────────────────────────────────────────

@api_view(["POST"])
def login_view(request):
    email = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "").strip()
    if email == "admin@classsense.com" and password == "admin123":
        return Response({"success": True, "name": "Admin", "email": email})
    return Response({"success": False, "error": "Invalid email or password."}, status=400)


@api_view(["POST"])
def register_view(request):
    name = request.data.get("name", "").strip()
    email = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "").strip()
    if not name or not email or not password:
        return Response({"success": False, "error": "All fields are required."}, status=400)
    if "@" not in email:
        return Response({"success": False, "error": "Invalid email address."}, status=400)
    if len(password) < 4:
        return Response({"success": False, "error": "Password must be at least 4 characters."}, status=400)
    return Response({"success": True, "name": name, "email": email})


# ── DASHBOARD ─────────────────────────────────────────────────

@api_view(["GET"])
def dashboard_stats(request):
    date_str = request.query_params.get("date")

    logs_qs = GestureLog.objects.all()
    alerts_qs = Alert.objects.all()

    if date_str:
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
            logs_qs = logs_qs.filter(date_key=d)
            alerts_qs = alerts_qs.filter(timestamp__date=d)
        except ValueError:
            pass

    total_gestures = logs_qs.count()
    unique_students = logs_qs.values("chair_rank").distinct().count()
    total_alerts = alerts_qs.count()

    student_map: dict = defaultdict(int)
    for log in logs_qs.values("student_name", "chair_rank"):
        key = log["student_name"] or f"Chair {log['chair_rank']}"
        student_map[key] += 1
    gesture_per_student = [
        {"name": k, "gestures": v}
        for k, v in sorted(student_map.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    gesture_map: dict = defaultdict(int)
    for log in logs_qs.values("gesture"):
        gesture_map[log["gesture"]] += 1
    gesture_type_distribution = [
        {"name": k, "value": v, "color": GESTURE_COLORS.get(k, "#95A5A6")}
        for k, v in gesture_map.items()
    ]

    time_map: dict = defaultdict(int)
    for log in logs_qs.values("timestamp"):
        minute = log["timestamp"].strftime("%I:%M %p")
        time_map[minute] += 1
    engagement_over_time = [
        {"time": k, "gestures": v}
        for k, v in sorted(time_map.items())
    ]

    mode_map: dict = defaultdict(int)
    for log in logs_qs.values("activity_mode"):
        mode_map[log["activity_mode"]] += 1
    activity_mode_usage = [
        {"mode": k, "count": v}
        for k, v in mode_map.items()
    ]

    return Response({
        "total_gestures": total_gestures,
        "unique_students": unique_students,
        "total_alerts": total_alerts,
        "avg_response": "N/A",
        "gesture_per_student": gesture_per_student,
        "gesture_type_distribution": gesture_type_distribution,
        "engagement_over_time": engagement_over_time,
        "activity_mode_usage": activity_mode_usage,
        "recent_gesture_log": GestureLogSerializer(logs_qs[:20], many=True).data,
        "recent_alerts": AlertSerializer(alerts_qs[:10], many=True).data,
    })


@api_view(["GET"])
def available_dates(request):
    dates = GestureLog.objects.values_list("date_key", flat=True).distinct()
    return Response({"dates": [str(d) for d in dates]})


# ── CLASS SESSIONS ────────────────────────────────────────────

@api_view(["GET", "POST"])
def sessions_list(request):
    if request.method == "GET":
        sessions = ClassSession.objects.all()
        return Response(ClassSessionSerializer(sessions, many=True).data)

    ClassSession.objects.filter(is_active=True).update(
        is_active=False, ended_at=timezone.now()
    )

    student_names = request.data.get("student_names", {})
    session = ClassSession.objects.create(
        subject_name=request.data.get("subject_name", ""),
        teacher_name=request.data.get("teacher_name", ""),
        room_number=request.data.get("room_number", ""),
        activity_mode=request.data.get("activity_mode", "Lecture"),
        num_chairs=int(request.data.get("num_chairs", 20)),
        date_key=timezone.now().date(),
    )

    for key, name in student_names.items():
        try:
            idx = int(key.replace("student_", ""))
            rank = idx + 1
        except ValueError:
            continue
        if name.strip():
            StudentRoster.objects.create(
                session=session, chair_rank=rank, student_name=name.strip()
            )

    return Response(ClassSessionSerializer(session).data, status=201)


@api_view(["GET", "PATCH", "DELETE"])
def session_detail(request, pk):
    try:
        session = ClassSession.objects.get(pk=pk)
    except ClassSession.DoesNotExist:
        return Response({"error": "Session not found."}, status=404)

    if request.method == "GET":
        return Response(ClassSessionSerializer(session).data)

    if request.method == "PATCH":
        if request.data.get("action") == "end":
            session.is_active = False
            session.ended_at = timezone.now()
            if session.started_at:
                diff = (session.ended_at - session.started_at).total_seconds()
                session.duration_seconds = int(diff)
            session.save()
        return Response(ClassSessionSerializer(session).data)

    if request.method == "DELETE":
        session.delete()
        return Response(status=204)


@api_view(["GET"])
def active_session(request):
    session = ClassSession.objects.filter(is_active=True).first()
    if session:
        return Response(ClassSessionSerializer(session).data)
    return Response(None)


# ── GESTURE LOGS ──────────────────────────────────────────────

@api_view(["GET", "POST"])
def gesture_logs(request):
    if request.method == "GET":
        qs = GestureLog.objects.all()
        session_id = request.query_params.get("session_id")
        date_str = request.query_params.get("date")
        gesture_filter = request.query_params.get("gesture", "All")
        sort = request.query_params.get("sort", "Newest")

        if session_id:
            qs = qs.filter(session_id=session_id)
        if date_str:
            try:
                d = datetime.strptime(date_str, "%Y-%m-%d").date()
                qs = qs.filter(date_key=d)
            except ValueError:
                pass
        if gesture_filter and gesture_filter != "All":
            qs = qs.filter(gesture=gesture_filter)
        if sort == "Newest":
            qs = qs.order_by("-timestamp")
        elif sort == "Oldest":
            qs = qs.order_by("timestamp")
        elif sort in ("By Rank", "By Student"):
            qs = qs.order_by("chair_rank", "-timestamp")
        elif sort == "By Gesture":
            qs = qs.order_by("gesture", "-timestamp")

        return Response(GestureLogSerializer(qs, many=True).data)

    session_id = request.data.get("session_id")
    try:
        session = ClassSession.objects.get(pk=session_id, is_active=True)
    except ClassSession.DoesNotExist:
        return Response({"error": "No active session found."}, status=400)

    chair_rank = int(request.data.get("chair_rank", 1))
    gesture = request.data.get("gesture", "")
    mode = session.activity_mode

    roster = StudentRoster.objects.filter(session=session, chair_rank=chair_rank).first()
    student_name = roster.student_name if roster else f"Student {chair_rank}"

    rule = get_rule(gesture, mode)

    log = GestureLog.objects.create(
        session=session,
        chair_rank=chair_rank,
        student_name=student_name,
        gesture=gesture,
        activity_mode=mode,
        status=rule["status"],
        color=rule["color"],
        label=rule["label"],
        date_key=timezone.now().date(),
    )

    alert_data = None
    if rule["status"] == "warning":
        alert = Alert.objects.create(
            session=session,
            chair_rank=chair_rank,
            student_name=student_name,
            gesture=gesture,
            message=f"{student_name} (Chair {chair_rank}) — {gesture}: {rule['label']}",
            severity="warning",
        )
        alert_data = AlertSerializer(alert).data

    return Response(
        {**GestureLogSerializer(log).data, "alert": alert_data},
        status=201,
    )


# ── ALERTS ────────────────────────────────────────────────────

@api_view(["GET"])
def alerts_list(request):
    qs = Alert.objects.all()
    session_id = request.query_params.get("session_id")
    if session_id:
        qs = qs.filter(session_id=session_id)
    return Response(AlertSerializer(qs, many=True).data)


@api_view(["PATCH"])
def alert_respond(request, pk):
    try:
        alert = Alert.objects.get(pk=pk)
    except Alert.DoesNotExist:
        return Response({"error": "Alert not found."}, status=404)
    alert.responded = True
    alert.save()
    return Response(AlertSerializer(alert).data)


# ── CLASS ACTIVITY ────────────────────────────────────────────

@api_view(["GET"])
def class_activity(request):
    qs = GestureLog.objects.all()
    gesture_filter = request.query_params.get("gesture", "All")
    sort = request.query_params.get("sort", "Newest")
    date_str = request.query_params.get("date")

    if date_str:
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
            qs = qs.filter(date_key=d)
        except ValueError:
            pass
    if gesture_filter and gesture_filter != "All":
        qs = qs.filter(gesture=gesture_filter)
    if sort == "Newest":
        qs = qs.order_by("-timestamp")
    elif sort == "Oldest":
        qs = qs.order_by("timestamp")
    elif sort in ("By Rank", "By Student"):
        qs = qs.order_by("chair_rank", "-timestamp")
    elif sort == "By Gesture":
        qs = qs.order_by("gesture", "-timestamp")

    roster_map: dict = {}
    for log in GestureLog.objects.values("chair_rank", "student_name"):
        r = log["chair_rank"]
        if r not in roster_map:
            roster_map[r] = {
                "rank": r,
                "name": log["student_name"] or f"Student {r}",
                "count": 0,
            }
        roster_map[r]["count"] += 1
    roster = sorted(roster_map.values(), key=lambda x: x["rank"])

    return Response({
        "logs": GestureLogSerializer(qs, many=True).data,
        "roster": roster,
    })