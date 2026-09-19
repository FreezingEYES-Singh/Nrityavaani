from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
from pathlib import Path

# Force UTF-8 console output on Windows to safely print Devanagari, Tamil, Telugu, etc.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Ensure backend directory is in sys.path
backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from core.goonj_tts import engine
except ImportError:
    from backend.core.goonj_tts import engine

app = FastAPI(title="NrityaVaani AI API & Goonj 3D Guru Voice")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Landmark(BaseModel):
    x: float
    y: float
    z: float

class PredictionRequest(BaseModel):
    landmarks: List[Landmark]
    handedness: str # "Left" or "Right"

class SpeakRequest(BaseModel):
    text: str
    persona: Optional[str] = "hi_meera"
    lang: Optional[str] = "auto"
    speed: Optional[float] = 1.0

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "NrityaVaani AI API with Goonj 3D Guru TTS is running",
        "tts_personas_count": len(engine.get_personas()),
        "supported_languages_count": len(engine.get_languages())
    }

@app.post("/predict")
def predict_mudra(request: PredictionRequest):
    from core.classification import classify_mudra
    result = classify_mudra(request.landmarks, request.handedness)
    return result

# --- Goonj-1-82M TTS Endpoints ---

@app.get("/api/tts/personas")
def list_personas():
    """Returns the 15 Goonj-1-82M persona voicepacks and teacher profiles."""
    return {
        "personas": engine.get_personas(),
        "default": "hi_meera"
    }

@app.get("/api/tts/languages")
def list_languages():
    """Returns supported classical dance and regional Indian languages."""
    return {
        "languages": engine.get_languages(),
        "default": "en"
    }

@app.post("/api/tts/speak")
def speak_cue(request: SpeakRequest):
    """
    Synthesize classical dance teaching cues using Goonj-1-82M persona.
    Returns MP3 audio with authentic Indian neural voice.
    """
    if not request.text or not request.text.strip():
        print("[TTS API Error] Empty cue text received")
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    persona = request.persona or "hi_meera"
    lang = request.lang or "auto"
    speed = request.speed or 1.0

    print(f"\n>>> [Goonj TTS API] Cue requested:")
    print(f"    - Persona : {persona}")
    print(f"    - Language: {lang}")
    print(f"    - Speed   : {speed}x")
    print(f"    - Cue Text: \"{request.text.strip()}\"")

    audio_bytes = engine.synthesize(request.text, persona=persona, lang=lang, speed=speed)
    if audio_bytes:
        print(f"    - Result  : SUCCESS -> {len(audio_bytes)} bytes sent as audio/mpeg\n")
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f'inline; filename="{persona}_cue.mp3"',
                "X-TTS-Persona": persona,
                "X-TTS-Lang": lang,
                "X-TTS-Engine": "Goonj-Kokoro-Neural",
            }
        )

    print(f"    - Result  : Synthesis failed, returning fallback\n")
    return {
        "status": "fallback_web_speech",
        "message": "Local Goonj weights not ready; using fallback.",
        "text": request.text,
        "persona": persona,
        "lang": request.lang
    }

if __name__ == "__main__":
    import uvicorn
    # Starts cleanly without requiring manual setup
    uvicorn.run(app, host="0.0.0.0", port=8000)
