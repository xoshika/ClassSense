import asyncio
import base64
import json
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .gesture_engine import engine, get_rule
from .models import Alert, ClassSession, GestureLog, StudentRoster

_THROTTLE_SEC = 3.0
_last_gesture: dict[str, float] = {}


class GestureConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        await self.accept()
        await self._send({
            "type": "connected",
            "message": "ClassSense WebSocket ready",
            "detector_ready": engine.ready,
        })

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get("type", "")

        if msg_type == "ping":
            await self._send({"type": "pong"})
        elif msg_type == "frame":
            await self._handle_frame(data)
        elif msg_type == "get_status":
            session = await self._get_active_session()
            await self._send({
                "type": "status",
                "session": session,
                "detector_ready": engine.ready,
            })

    async def _handle_frame(self, data: dict):
        session_id = data.get("session_id")
        frame_b64: str = data.get("frame", "")
        if not session_id or not frame_b64:
            return
        try:
            if "," in frame_b64:
                frame_b64 = frame_b64.split(",", 1)[1]
            frame_bytes = base64.b64decode(frame_b64)
        except Exception:
            return

        loop = asyncio.get_event_loop()
        gestures: list[str] = await loop.run_in_executor(None, engine.process, frame_bytes)

        if not gestures:
            await self._send({"type": "no_gesture"})
            return

        session = await self._get_session_obj(session_id)
        if not session:
            await self._send({"type": "error", "message": "No active session found."})
            return

        results = []
        for gesture in gestures:
            result = await self._save_gesture(session, gesture)
            if result:
                results.append(result)

        if results:
            await self._send({"type": "gesture_detected", "gestures": results})

    @database_sync_to_async
    def _get_active_session(self):
        s = ClassSession.objects.filter(is_active=True).first()
        if not s:
            return None
        return {
            "id": s.id,
            "subject_name": s.subject_name,
            "activity_mode": s.activity_mode,
            "num_chairs": s.num_chairs,
        }

    @database_sync_to_async
    def _get_session_obj(self, session_id):
        try:
            return ClassSession.objects.get(pk=session_id, is_active=True)
        except ClassSession.DoesNotExist:
            return None

    @database_sync_to_async
    def _save_gesture(self, session, gesture: str):
        key = f"{session.id}_{gesture}"
        now_ts = time.monotonic()
        if key in _last_gesture and (now_ts - _last_gesture[key]) < _THROTTLE_SEC:
            return None
        _last_gesture[key] = now_ts

        now  = timezone.now()
        mode = session.activity_mode
        rule = get_rule(gesture, mode)

        chair_rank = 1
        roster = StudentRoster.objects.filter(session=session, chair_rank=chair_rank).first()
        student_name = roster.student_name if roster else f"Student {chair_rank}"

        log = GestureLog.objects.create(
            session=session,
            chair_rank=chair_rank,
            student_name=student_name,
            gesture=gesture,
            activity_mode=mode,
            status=rule["status"],
            color=rule["color"],
            label=rule["label"],
            date_key=now.date(),
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
            alert_data = {
                "id": alert.id,
                "message": alert.message,
                "severity": alert.severity,
                "time": alert.timestamp.strftime("%I:%M %p"),
            }

        return {
            "log_id":        log.id,
            "chair_rank":    chair_rank,
            "student_name":  student_name,
            "gesture":       gesture,
            "activity_mode": mode,
            "status":        rule["status"],
            "color":         rule["color"],
            "label":         rule["label"],
            "time":          now.strftime("%I:%M %p"),
            "date":          now.strftime("%B %d %Y"),
            "date_key":      str(now.date()),
            "alert":         alert_data,
        }

    async def _send(self, data: dict):
        await self.send(text_data=json.dumps(data))