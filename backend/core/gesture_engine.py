"""
ClassSense Gesture Engine
Python 3.13 + TensorFlow 2.20.0 + MediaPipe 0.10.33
"""

import json
import os
import cv2
import numpy as np

BASE = os.path.dirname(os.path.abspath(__file__))
ML   = os.path.join(BASE, "ml_models")

IMAGE_MODEL_DIR = os.path.join(ML, "tm-my-image-model")
POSE_MODEL_DIR  = os.path.join(ML, "my-pose-model")

IMAGE_LABELS = ["peace_sign", "thumbs_up", "thumbs_down", "ok_sign", "clap", "none"]
POSE_LABELS  = ["walking", "raised_hand", "head_left", "head_right", "none"]

LABEL_DISPLAY = {
    "peace_sign":  "Peace Sign",
    "thumbs_up":   "Thumbs Up",
    "thumbs_down": "Thumbs Down",
    "ok_sign":     "OK Sign",
    "clap":        "Clapping",
    "walking":     "Walking",
    "raised_hand": "Hand Raise",
    "head_left":   "Head Moving",
    "head_right":  "Head Moving",
    "none":        "none",
}

GESTURE_COLORS = {
    "Hand Raise":   "#27AE60",
    "Peace Sign":   "#2980B9",
    "Thumbs Up":    "#F39C12",
    "Thumbs Down":  "#E74C3C",
    "OK Sign":      "#8E44AD",
    "Clapping":     "#E74C3C",
    "Walking":      "#16A085",
    "Head Moving":  "#D35400",
    "Moving Chair": "#7F8C8D",
}

MODE_RULES = {
    "Lecture": {
        "Hand Raise":   {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "Peace Sign":   {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "Thumbs Up":    {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "Thumbs Down":  {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "OK Sign":      {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "Clapping":     {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed during Lecture"},
        "Walking":      {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed during Lecture"},
        "Head Moving":  {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed during Lecture"},
        "Moving Chair": {"status": "neutral", "color": "#F39C12", "label": "⚠ Noted"},
    },
    "Quiz": {
        "Hand Raise":   {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "Peace Sign":   {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "Thumbs Up":    {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "Thumbs Down":  {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "OK Sign":      {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed"},
        "Clapping":     {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Disruption during Quiz"},
        "Walking":      {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Not allowed during Quiz"},
        "Head Moving":  {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Suspicious during Quiz"},
        "Moving Chair": {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Disruption during Quiz"},
    },
    "Exam": {
        "Hand Raise":   {"status": "allowed", "color": "#27AE60", "label": "✅ Allowed - May need help"},
        "Peace Sign":   {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Suspicious during Exam"},
        "Thumbs Up":    {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Suspicious during Exam"},
        "Thumbs Down":  {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Suspicious during Exam"},
        "OK Sign":      {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Suspicious during Exam"},
        "Clapping":     {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Cheating risk"},
        "Walking":      {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Not allowed during Exam"},
        "Head Moving":  {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Cheating risk"},
        "Moving Chair": {"status": "warning", "color": "#E74C3C", "label": "🚨 Warning - Disruption during Exam"},
    },
}


def get_rule(gesture: str, mode: str) -> dict:
    rules = MODE_RULES.get(mode, MODE_RULES["Lecture"])
    return rules.get(gesture, {"status": "neutral", "color": "#7F8C8D", "label": "📋 Noted"})


def _read_weights(weight_data: bytes, weights_manifest: list) -> list:
    """Parse weights.bin → list of numpy arrays in manifest order."""
    all_weights = []
    offset = 0
    for manifest in weights_manifest:
        for w in manifest.get("weights", []):
            shape = w.get("shape", [])
            size  = int(np.prod(shape)) if shape else 1
            chunk = np.frombuffer(
                weight_data[offset: offset + size * 4],
                dtype=np.float32,
            ).copy()
            if shape:
                chunk = chunk.reshape(shape)
            all_weights.append(chunk)
            offset += size * 4
    return all_weights


def load_tfjs_image_model(model_dir: str):
    """
    Load Teachable Machine image model.
    Strategy: build model to match weight count, then assign weights
    by matching shapes rather than position.
    """
    import tensorflow as tf

    model_json_path = os.path.join(model_dir, "model.json")
    weights_path    = os.path.join(model_dir, "weights.bin")

    if not os.path.exists(model_json_path):
        raise FileNotFoundError(f"model.json not found in {model_dir}")
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"weights.bin not found in {model_dir}")

    with open(model_json_path, "r") as f:
        model_json = json.load(f)
    with open(weights_path, "rb") as f:
        weight_data = f.read()

    bin_weights = _read_weights(weight_data, model_json.get("weightsManifest", []))
    n_classes   = len(IMAGE_LABELS)
    n_bin       = len(bin_weights)
    print(f"[ClassSense] Image model bin has {n_bin} weight tensors")

    # Try each alpha until weight count matches
    for alpha in [0.35, 0.25, 0.5, 0.75, 1.0]:
        base = tf.keras.applications.MobileNetV2(
            input_shape=(224, 224, 3),
            alpha=alpha,
            include_top=False,
            pooling="avg",
            weights=None,
        )
        x       = base.output
        x       = tf.keras.layers.Dense(100, activation="relu",
                                        use_bias=True, name="head_dense")(x)
        outputs = tf.keras.layers.Dense(n_classes, activation="softmax",
                                        use_bias=False, name="head_out")(x)
        model   = tf.keras.Model(inputs=base.input, outputs=outputs)

        model_shapes = [w.shape for w in model.get_weights()]
        bin_shapes   = [w.shape for w in bin_weights]
        n_model      = len(model_shapes)

        print(f"[ClassSense] alpha={alpha}: model={n_model}, bin={n_bin}")

        if n_bin < n_model:
            continue

        # Try direct assignment (bin order matches model order)
        try:
            model.set_weights(bin_weights[:n_model])
            print(f"[ClassSense] ✓ Image model loaded (alpha={alpha}, direct)")
            return model
        except Exception:
            pass

        # Try shape-matched assignment: assign each model weight from the
        # first bin weight with matching shape
        try:
            assigned   = []
            used       = [False] * n_bin
            success    = True
            for ms in model_shapes:
                found = False
                for i, bw in enumerate(bin_weights):
                    if not used[i] and bw.shape == ms:
                        assigned.append(bw)
                        used[i] = True
                        found = True
                        break
                if not found:
                    success = False
                    break
            if success and len(assigned) == n_model:
                model.set_weights(assigned)
                print(f"[ClassSense] ✓ Image model loaded (alpha={alpha}, shape-matched)")
                return model
        except Exception as e:
            print(f"[ClassSense] alpha={alpha} shape-match failed: {e}")

    raise RuntimeError("Could not load image model with any alpha.")


def load_tfjs_pose_model(model_dir: str):
    import tensorflow as tf

    model_json_path = os.path.join(model_dir, "model.json")
    weights_path    = os.path.join(model_dir, "weights.bin")

    if not os.path.exists(model_json_path):
        raise FileNotFoundError(f"model.json not found in {model_dir}")
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"weights.bin not found in {model_dir}")

    with open(model_json_path, "r") as f:
        model_json = json.load(f)
    with open(weights_path, "rb") as f:
        weight_data = f.read()

    bin_weights = _read_weights(weight_data, model_json.get("weightsManifest", []))

    # Detect input size from first weight shape or batch_input_shape
    input_size = 14739
    if bin_weights and len(bin_weights[0].shape) == 2:
        input_size = bin_weights[0].shape[0]

    print(f"[ClassSense] Pose model: {len(bin_weights)} weights, input={input_size}")

    n_classes = len(POSE_LABELS)
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(input_size,)),
        tf.keras.layers.Dense(100, activation="relu",  use_bias=True,  name="d1"),
        tf.keras.layers.Dropout(0.5,                                    name="drop"),
        tf.keras.layers.Dense(n_classes, activation="softmax",
                              use_bias=False,                            name="dout"),
    ])

    needed = len(model.get_weights())
    if len(bin_weights) >= needed:
        model.set_weights(bin_weights[:needed])
        print(f"[ClassSense] ✓ Pose model loaded")
        return model
    raise ValueError(f"Pose model weight mismatch: need {needed}, got {len(bin_weights)}")


def _load_pose_landmarker():
    import urllib.request
    import mediapipe as mp

    model_path = os.path.join(ML, "pose_landmarker_lite.task")
    if not os.path.exists(model_path):
        os.makedirs(ML, exist_ok=True)
        print("[ClassSense] Downloading pose_landmarker_lite.task ...")
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            model_path,
        )

    BaseOptions           = mp.tasks.BaseOptions
    PoseLandmarker        = mp.tasks.vision.PoseLandmarker
    PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
    VisionRunningMode     = mp.tasks.vision.RunningMode

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=VisionRunningMode.IMAGE,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    return PoseLandmarker.create_from_options(options)


class GestureEngine:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, confidence_threshold: float = 0.65):
        if self._initialized:
            return

        self.confidence_threshold = confidence_threshold
        self.image_model = None
        self.pose_model  = None
        self._pose_lm    = None

        try:
            self.image_model = load_tfjs_image_model(IMAGE_MODEL_DIR)
        except Exception as e:
            print(f"[ClassSense] Image model load failed: {e}")

        try:
            self.pose_model = load_tfjs_pose_model(POSE_MODEL_DIR)
        except Exception as e:
            print(f"[ClassSense] Pose model load failed: {e}")

        try:
            self._pose_lm = _load_pose_landmarker()
            print("[ClassSense] MediaPipe PoseLandmarker loaded ✓")
        except Exception as e:
            print(f"[ClassSense] MediaPipe pose landmarker failed: {e}")

        self._initialized = True
        ok = self.image_model is not None or self.pose_model is not None
        print(f"[ClassSense] GestureEngine {'✓ ready' if ok else '✗ no models loaded'}")

    @property
    def ready(self) -> bool:
        return self._initialized and (
            self.image_model is not None or self.pose_model is not None
        )

    def process(self, frame_bytes: bytes) -> list[str]:
        if not self._initialized:
            return []
        try:
            arr   = np.frombuffer(frame_bytes, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                return []
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        except Exception as e:
            print(f"[ClassSense] Frame decode error: {e}")
            return []

        found: list[str] = []

        if self.image_model is not None:
            try:
                img = cv2.resize(frame, (224, 224))
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img = (img.astype(np.float32) / 127.5) - 1.0
                img = np.expand_dims(img, axis=0)
                preds     = self.image_model.predict(img, verbose=0)[0]
                best_idx  = int(np.argmax(preds))
                conf      = float(preds[best_idx])
                raw_label = IMAGE_LABELS[best_idx] if best_idx < len(IMAGE_LABELS) else "none"
                if conf >= self.confidence_threshold and raw_label != "none":
                    display = LABEL_DISPLAY.get(raw_label, raw_label)
                    if display != "none" and display not in found:
                        found.append(display)
            except Exception as e:
                print(f"[ClassSense] Image predict error: {e}")

        if self.pose_model is not None and self._pose_lm is not None:
            try:
                import mediapipe as mp
                mp_img      = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                pose_result = self._pose_lm.detect(mp_img)
                if pose_result and pose_result.pose_landmarks:
                    lm = pose_result.pose_landmarks[0]
                    keypoints = []
                    for point in lm:
                        keypoints.extend([point.x, point.y, point.z, point.visibility])
                    kp       = np.array(keypoints, dtype=np.float32)
                    expected = self.pose_model.input_shape[-1]
                    kp = kp[:expected] if len(kp) >= expected else np.pad(kp, (0, expected - len(kp)))
                    preds     = self.pose_model.predict(np.expand_dims(kp, 0), verbose=0)[0]
                    best_idx  = int(np.argmax(preds))
                    conf      = float(preds[best_idx])
                    raw_label = POSE_LABELS[best_idx] if best_idx < len(POSE_LABELS) else "none"
                    if conf >= self.confidence_threshold and raw_label != "none":
                        display = LABEL_DISPLAY.get(raw_label, raw_label)
                        if display != "none" and display not in found:
                            found.append(display)
            except Exception as e:
                print(f"[ClassSense] Pose predict error: {e}")

        return found

    def release(self):
        try:
            if self._pose_lm:
                self._pose_lm.close()
        except Exception:
            pass


engine = GestureEngine()