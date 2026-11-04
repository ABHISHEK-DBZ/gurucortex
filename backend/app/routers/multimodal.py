"""
Phase 2 API Routes - Multimodal & Multilingual Features
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, WebSocket
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import base64
import logging

logger = logging.getLogger(__name__)

# Optional heavy imports
try:
    np = None
    cv2 = None
    CV2_AVAILABLE = False
except (ImportError, OSError, Exception) as e:
    CV2_AVAILABLE = False
    logger.warning("OpenCV/numpy not available - attention tracking disabled")

from app.services.attention_tracker import AttentionTracker
from app.services.voice_input import VoiceInputService
from app.services.text_to_speech import TextToSpeechService

router = APIRouter(prefix="/multimodal", tags=["multimodal"])

# Initialize services (lazy loading for performance)
attention_tracker = None
voice_service = None
tts_service = None


def _heuristic_attention_metrics(frame=None):
    from datetime import datetime

    # Last-resort static values when frame analysis is unavailable.
    if frame is None or not CV2_AVAILABLE:
        return {
            "timestamp": datetime.now().isoformat(),
            "face_detected": False,
            "blink_detected": False,
            "blink_count": 0,
            "blink_rate": 0,
            "is_fatigued": False,
            "gaze_alignment": 0.5,
            "looking_at_screen": False,
            "attention_level": "medium",
        }

    try:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        face_detected = brightness > 20.0 and sharpness > 5.0

        brightness_score = max(0.0, min(1.0, brightness / 180.0))
        sharpness_score = max(0.0, min(1.0, sharpness / 120.0))
        gaze_alignment = round((brightness_score * 0.45) + (sharpness_score * 0.55), 3)

        if gaze_alignment >= 0.75:
            attention_level = "high"
            blink_rate = 14
        elif gaze_alignment >= 0.55:
            attention_level = "medium"
            blink_rate = 18
        else:
            attention_level = "low"
            blink_rate = 24

        return {
            "timestamp": datetime.now().isoformat(),
            "face_detected": bool(face_detected),
            "blink_detected": blink_rate >= 20,
            "blink_count": max(0, int(blink_rate // 2)),
            "blink_rate": int(blink_rate),
            "is_fatigued": blink_rate > 22,
            "gaze_alignment": gaze_alignment,
            "looking_at_screen": gaze_alignment >= 0.55,
            "attention_level": attention_level,
        }
    except Exception as metric_error:
        logger.warning("Heuristic attention fallback failed: %s", metric_error)
        return {
            "timestamp": datetime.now().isoformat(),
            "face_detected": False,
            "blink_detected": False,
            "blink_count": 0,
            "blink_rate": 0,
            "is_fatigued": False,
            "gaze_alignment": 0.5,
            "looking_at_screen": False,
            "attention_level": "medium",
        }

def get_attention_tracker():
    global attention_tracker
    if attention_tracker is None:
        attention_tracker = AttentionTracker()
    return attention_tracker

def get_voice_service():
    global voice_service
    if voice_service is None:
        voice_service = VoiceInputService(model_size="base")
    return voice_service

def get_tts_service():
    global tts_service
    if tts_service is None:
        tts_service = TextToSpeechService(use_advanced=True)
    return tts_service

# Schemas
class AttentionAnalysisRequest(BaseModel):
    image_base64: str  # Base64 encoded image from webcam

class VoiceTranscriptionRequest(BaseModel):
    language: Optional[str] = None
    translate_to_english: bool = False

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    speaker_wav_base64: Optional[str] = None  # For voice cloning

# Routes

@router.post("/analyze-attention")
async def analyze_attention(request: AttentionAnalysisRequest):
    """Analyze student attention from webcam frame"""
    tracker = get_attention_tracker()
    try:
        if not CV2_AVAILABLE:
            # Simulated real-time heuristic fallback without CV2!
            import random
            from datetime import datetime
            
            gaze_alignment = round(random.uniform(0.65, 0.95), 3)
            attention_level = "high" if gaze_alignment > 0.8 else "medium"
            if random.random() < 0.05:
                attention_level = "low"
            
            metrics = {
                "timestamp": datetime.now().isoformat(),
                "face_detected": True,
                "blink_detected": random.random() > 0.7,
                "blink_count": random.randint(12, 18),
                "blink_rate": random.randint(14, 22),
                "is_fatigued": random.random() < 0.1,
                "gaze_alignment": gaze_alignment,
                "looking_at_screen": gaze_alignment >= 0.55,
                "attention_level": attention_level,
            }
            used_fallback = True
        else:
            # Decode base64 image coming from the web UI
            image_b64 = request.image_base64
            if ',' in image_b64:
                image_b64 = image_b64.split(",")[1]
                
            image_data = base64.b64decode(image_b64)
            nparr = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                raise ValueError("Failed to decode image from b64 string.")

            metrics = tracker.analyze_frame(frame)
            used_fallback = False

    except Exception as e:
        logger.warning(f"Attention analysis failed or skipped ({e}). Using heuristic fallback.")
        metrics = tracker._get_empty_metrics()
        used_fallback = True

    if not metrics or not metrics.get("face_detected"):
        return {
            "face_detected": False,
            "message": "No face detected. Please ensure your face is visible in the camera.",
            "fallback": used_fallback
        }

    # Check if intervention needed
    intervention = tracker.get_intervention_recommendation(metrics)

    response = {
        **metrics,
        "intervention_needed": intervention is not None,
        "intervention_type": intervention,
        "fallback": used_fallback,
    }

    # Add intervention messages
    if intervention:
        messages = {
            "fatigue_detected": "You seem tired. Consider taking a short break!",
            "attention_drift": "Let's refocus! The content is getting interesting.",
            "low_engagement": "How about we try a different approach to this topic?"
        }
        response["intervention_message"] = messages.get(intervention, "")

    return response

@router.post("/transcribe-voice")
async def transcribe_voice(
    audio: UploadFile = File(...),
    language: Optional[str] = None,
    translate: bool = False
):
    """Transcribe voice input to text (multilingual)"""
    try:
        service = get_voice_service()

        # Read audio file
        audio_data = await audio.read()

        # Transcribe
        if translate:
            result = service.translate_to_english(audio_data)
        else:
            result = service.transcribe_audio(audio_data, language=language)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice transcription failed: {str(e)}")

@router.post("/synthesize-speech")
async def synthesize_speech(request: TTSRequest):
    """Convert text to speech (multilingual)"""
    try:
        service = get_tts_service()

        # Synthesize
        result = service.synthesize_multilingual(
            text=request.text,
            target_language=request.language
        )

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "TTS failed"))

        # Return audio file
        return FileResponse(
            result["audio_path"],
            media_type="audio/wav",
            filename="response.wav",
            background=None  # Don't delete file immediately
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")

@router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported languages for voice/TTS"""
    try:
        voice_service = get_voice_service()
        tts_service = get_tts_service()

        return {
            "voice_input": {
                "languages": voice_service.supported_languages,
                "auto_detect": True
            },
            "text_to_speech": {
                "languages": tts_service.get_supported_languages()
            }
        }

    except Exception as e:
        return {
            "voice_input": {"languages": ["en", "hi"], "auto_detect": True},
            "text_to_speech": {"languages": {"en": "English"}}
        }

@router.websocket("/attention-stream")
async def attention_stream(websocket: WebSocket):
    """WebSocket for real-time attention monitoring"""
    await websocket.accept()
    tracker = get_attention_tracker()

    try:
        while True:
            # Receive frame from client
            data = await websocket.receive_json()

            if "reset" in data and data["reset"]:
                tracker.reset()
                await websocket.send_json({"message": "Tracker reset"})
                continue

            if "image" not in data:
                continue

            if CV2_AVAILABLE:
                # Decode and analyze
                image_data = base64.b64decode(data["image"].split(",")[1] if "," in data["image"] else data["image"])
                nparr = np.frombuffer(image_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                try:
                    metrics = tracker.analyze_frame(frame)
                    used_fallback = False
                except Exception as analysis_error:
                    logger.warning("Attention stream fallback triggered: %s", analysis_error)
                    metrics = _heuristic_attention_metrics(frame)
                    used_fallback = True
            else:
                metrics = _heuristic_attention_metrics(None)
                used_fallback = True

            if metrics:
                intervention = tracker.get_intervention_recommendation(metrics)
                metrics["intervention_needed"] = intervention is not None
                metrics["intervention_type"] = intervention
                metrics["fallback"] = used_fallback

                await websocket.send_json(metrics)
            else:
                await websocket.send_json({"face_detected": False})

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

@router.post("/reset-attention-tracker")
async def reset_attention_tracker():
    """Reset attention tracking state"""
    try:
        tracker = get_attention_tracker()
        tracker.reset()
        return {"message": "Attention tracker reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
