from __future__ import annotations
"""
Affective Computing Service - Attention & Fatigue Detection
Uses MediaPipe for real-time analysis of student engagement
"""

import logging
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta
import time

logger = logging.getLogger(__name__)

# Lazy initialization: avoid importing broken/missing C-extensions at startup
np = None
cv2 = None
mp = None
ATTENTION_AVAILABLE = False


class AttentionTracker:
    """Track student attention and fatigue using webcam"""

    def __init__(self):
        self.face_mesh = None
        self.blink_count = 0
        self.last_blink_time = None
        self.blink_timestamps = []
        self.gaze_away_count = 0
        self.start_time = datetime.now()

        # Thresholds
        self.EYE_AR_THRESH = 0.21
        self.BLINK_WINDOW = 60
        self.FATIGUE_BLINK_RATE = 20
        self.ATTENTION_THRESHOLD = 0.7

    def calculate_eye_aspect_ratio(self, eye_landmarks: List) -> float:
        """Calculate Eye Aspect Ratio (EAR) for blink detection"""
        if np is None:
            return 0.0
        vertical1 = float(np.linalg.norm(np.array(eye_landmarks[1]) - np.array(eye_landmarks[5])))
        vertical2 = float(np.linalg.norm(np.array(eye_landmarks[2]) - np.array(eye_landmarks[4])))
        horizontal = float(np.linalg.norm(np.array(eye_landmarks[0]) - np.array(eye_landmarks[3])))
        ear = (vertical1 + vertical2) / (2.0 * horizontal) if horizontal > 0 else 0.0
        return ear

    def detect_blink(self, left_ear: float, right_ear: float) -> bool:
        """Detect if a blink occurred"""
        avg_ear = (left_ear + right_ear) / 2.0
        if avg_ear < self.EYE_AR_THRESH:
            current_time = time.time()
            if self.last_blink_time is None or (current_time - self.last_blink_time) > 0.3:
                self.blink_count += 1
                self.blink_timestamps.append(current_time)
                self.last_blink_time = current_time
                cutoff = current_time - self.BLINK_WINDOW
                self.blink_timestamps = [t for t in self.blink_timestamps if t > cutoff]
                return True
        return False

    def calculate_blink_rate(self) -> float:
        """Calculate blinks per minute"""
        if not self.blink_timestamps:
            return 0.0
        time_window = min(self.BLINK_WINDOW, time.time() - self.blink_timestamps[0])
        if time_window == 0:
            return 0.0
        return (len(self.blink_timestamps) / time_window) * 60

    def detect_gaze_direction(self, face_landmarks) -> Dict[str, float]:
        """Detect if student is looking at screen"""
        nose_tip = face_landmarks.landmark[1]
        gaze_x = nose_tip.x - 0.5
        gaze_y = nose_tip.y - 0.5
        alignment_score = 1.0 - (abs(gaze_x) + abs(gaze_y))
        return {
            "gaze_x": gaze_x,
            "gaze_y": gaze_y,
            "alignment_score": max(0, alignment_score),
            "looking_at_screen": alignment_score > self.ATTENTION_THRESHOLD
        }

    def analyze_frame(self, frame: Any) -> Optional[Dict]:
        """Analyze single frame for attention metrics"""
        if not ATTENTION_AVAILABLE or cv2 is None or self.face_mesh is None:
            return None

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        if not results.multi_face_landmarks:
            return None

        face_landmarks = results.multi_face_landmarks[0]
        landmarks = face_landmarks.landmark
        left_eye = [
            [landmarks[33].x, landmarks[33].y],
            [landmarks[160].x, landmarks[160].y],
            [landmarks[158].x, landmarks[158].y],
            [landmarks[133].x, landmarks[133].y],
            [landmarks[153].x, landmarks[153].y],
            [landmarks[144].x, landmarks[144].y],
        ]
        right_eye = [
            [landmarks[362].x, landmarks[362].y],
            [landmarks[385].x, landmarks[385].y],
            [landmarks[387].x, landmarks[387].y],
            [landmarks[263].x, landmarks[263].y],
            [landmarks[373].x, landmarks[373].y],
            [landmarks[380].x, landmarks[380].y],
        ]

        left_ear = self.calculate_eye_aspect_ratio(left_eye)
        right_ear = self.calculate_eye_aspect_ratio(right_eye)
        blinked = self.detect_blink(left_ear, right_ear)
        blink_rate = self.calculate_blink_rate()
        gaze_info = self.detect_gaze_direction(face_landmarks)

        is_fatigued = blink_rate > self.FATIGUE_BLINK_RATE
        is_attentive = gaze_info["looking_at_screen"]

        return {
            "timestamp": datetime.now().isoformat(),
            "face_detected": True,
            "blink_detected": blinked,
            "blink_count": self.blink_count,
            "blink_rate": round(blink_rate, 2),
            "is_fatigued": is_fatigued,
            "gaze_alignment": round(gaze_info["alignment_score"], 2),
            "looking_at_screen": is_attentive,
            "attention_level": "high" if is_attentive and not is_fatigued else "medium" if is_attentive else "low"
        }

    def get_intervention_recommendation(self, metrics: Dict) -> Optional[str]:
        """Recommend LLM intervention based on attention metrics"""
        if metrics.get("is_fatigued"):
            return "fatigue_detected"
        if not metrics.get("looking_at_screen"):
            return "attention_drift"
        if metrics.get("attention_level") == "low":
            return "low_engagement"
        return None

    def reset(self):
        """Reset tracking state"""
        self.blink_count = 0
        self.last_blink_time = None
        self.blink_timestamps = []
        self.gaze_away_count = 0
        self.start_time = datetime.now()
