import asyncio
import base64
import json
import time

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .gesture_engine import engine, get_rule
from .models import Alert, ClassSession, GestureLog, StudentRoster

_THROTTLE_SEC = 2.0
_last_gesture: dict[str, float] = {}


class GestureConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self._pinned_chair = None
        self._num_chairs   = 1
        self._locked       = False
        await self.accept()
        try:
            ready = await sync_to_async(lambda: engine.ready)()
        except Exception:
            ready = False
        await self._send({
            "type": "connected",
            "message": "ClassSense WebSocket ready",
            "detector_ready": ready,
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

        elif msg_type == "config":
            self._num_chairs   = int(data.get("num_seats", 1))
            self._pinned_chair = data.get("pinned_chair", None)
            if self._pinned_chair is not None:
                self._pinned_chair = int(self._pinned_chair)

        elif msg_type == "pin_chair":
            chair = data.get("chair_rank")
            self._pinned_chair = int(chair) if chair is not None else None
            await self._send({"type": "pin_ack", "pinned_chair": self._pinned_chair})

        elif msg_type == "lock_detection":
            self._locked = bool(data.get("locked", False))
            await self._send({"type": "lock_ack", "locked": self._locked})

        elif msg_type == "frame":
            if not self._locked:
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

        if not frame_b64:
            return

        try:
            if "," in frame_b64:
                frame_b64 = frame_b64.split(",", 1)[1]
            frame_bytes = base64.b64decode(frame_b64)
        except Exception:
            return

        loop = asyncio.get_event_loop()
        gesture_results: list[dict] = await loop.run_in_executor(
            None,
            lambda: engine.process(
                frame_bytes,
                num_chairs=self._num_chairs,
                pinned_chair=self._pinned_chair,
                session_id=session_id,
            )
        )
        print(f"[ClassSense] Gestures found: {gesture_results}")

        if not gesture_results:
            await self._send({"type": "no_gesture"})
            return

        session_id_int = int(session_id) if session_id else 0
        session = None
        if session_id_int > 0:
            session = await self._get_session_obj(session_id_int)

        if session is None:
            session = await self._get_active_session_obj()

        if session is None:
            await self._send({"type": "gesture_detected", "gestures": [
                {
                    "log_id": None,
                    "chair_rank": item.get("chair_rank", 1),
                    "student_name": f"Student {item.get('chair_rank', 1)}",
                    "gesture": item["gesture"],
                    "confidence": round(item.get("confidence", 0) * 100, 1),
                    "activity_mode": "Lecture",
                    "status": "neutral",
                    "color": "#7F8C8D",
                    "label": "Detected",
                    "time": timezone.now().strftime("%I:%M %p"),
                    "date": timezone.now().strftime("%B %d %Y"),
                    "date_key": str(timezone.now().date()),
                    "is_alert": False,
                    "alert": None,
                }
                for item in gesture_results
            ]})
            return

        results = []
        for item in gesture_results:
            result = await self._save_gesture(
                session,
                item["gesture"],
                item["chair_rank"],
                item.get("confidence", 0.0),
            )
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
    def _get_active_session_obj(self):
        return ClassSession.objects.filter(is_active=True).first()

    @database_sync_to_async
    def _get_session_obj(self, session_id):
        try:
            return ClassSession.objects.get(pk=session_id)
        except ClassSession.DoesNotExist:
            return None

    @database_sync_to_async
    def _save_gesture(self, session, gesture: str, chair_rank: int, confidence: float = 0.0):
        key = f"{session.id}_{gesture}_{chair_rank}"
        now_ts = time.monotonic()
        if key in _last_gesture and (now_ts - _last_gesture[key]) < _THROTTLE_SEC:
            return None
        _last_gesture[key] = now_ts

        now  = timezone.now()
        mode = session.activity_mode
        rule = get_rule(gesture, mode)

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
            "confidence":    round(confidence * 100, 1),
            "activity_mode": mode,
            "status":        rule["status"],
            "color":         rule["color"],
            "label":         rule["label"],
            "time":          now.strftime("%I:%M %p"),
            "date":          now.strftime("%B %d %Y"),
            "date_key":      str(now.date()),
            "is_alert":      rule["status"] == "warning",
            "alert":         alert_data,
        }

    async def _send(self, data: dict):
        await self.send(text_data=json.dumps(data))