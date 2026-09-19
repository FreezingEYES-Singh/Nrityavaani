import asyncio
import hashlib
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
import io
import edge_tts

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache" / "audio"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# 15 Goonj Persona Voicepacks & Configurations
GOONJ_PERSONAS = [
    {
        "id": "hi_meera",
        "name": "Guru Meera",
        "gender": "female",
        "primaryLang": "hi",
        "voice": "hi-IN-SwaraNeural",
        "pitch": "+4Hz",
        "rate": "-4%",
        "tone": "Warm, Compassionate & Emotive",
        "description": "Vocal classical guru with deep traditional expression and gentle guidance.",
        "badge": "Classical Hindi"
    },
    {
        "id": "en_priya",
        "name": "Guru Priya",
        "gender": "female",
        "primaryLang": "en",
        "voice": "en-IN-NeerjaNeural",
        "pitch": "+2Hz",
        "rate": "-2%",
        "tone": "Articulate, Graceful & Encouraging",
        "description": "Contemporary classical instructress with polished Indian English phonetics.",
        "badge": "Indian English"
    },
    {
        "id": "en_arjun",
        "name": "Guru Arjun",
        "gender": "male",
        "primaryLang": "en",
        "voice": "en-IN-PrabhatNeural",
        "pitch": "-3Hz",
        "rate": "+3%",
        "tone": "Commanding, Focused & Rhythmic",
        "description": "Energetic Natyacharya leading rhythmic footwork and precision adavus.",
        "badge": "Male Natyacharya"
    },
    {
        "id": "hi_atul",
        "name": "Guru Atul",
        "gender": "male",
        "primaryLang": "hi",
        "voice": "hi-IN-MadhurNeural",
        "pitch": "-6Hz",
        "rate": "-8%",
        "tone": "Deep, Dignified & Resonant Baritone",
        "description": "Traditional temple scholar and master of Natyashastra shlokas and mudras.",
        "badge": "Shastri / Baritone"
    },
    {
        "id": "en_ananya",
        "name": "Guru Ananya",
        "gender": "female",
        "primaryLang": "en",
        "voice": "en-IN-NeerjaNeural",
        "pitch": "+8Hz",
        "rate": "-6%",
        "tone": "Gentle, Melodic & Patient",
        "description": "Nurturing dance teacher ideal for foundational posture and delicate abhinaya.",
        "badge": "Gentle Mentor"
    },
    {
        "id": "en_kabir",
        "name": "Guru Kabir",
        "gender": "male",
        "primaryLang": "en",
        "voice": "en-IN-PrabhatNeural",
        "pitch": "-4Hz",
        "rate": "0%",
        "tone": "Firm, Authoritative & Precise",
        "description": "Disciplined master of tala, laya, and stamina-building practice sequences.",
        "badge": "Laya Master"
    },
    {
        "id": "hi_shivani",
        "name": "Guru Shivani",
        "gender": "female",
        "primaryLang": "hi",
        "voice": "hi-IN-SwaraNeural",
        "pitch": "+10Hz",
        "rate": "+2%",
        "tone": "Bright, Clear & Vibrant",
        "description": "Expressive mentor celebrating hastas, eye glances, and mudras.",
        "badge": "Abhinaya Guide"
    },
    {
        "id": "hi_ravi",
        "name": "Guru Ravi",
        "gender": "male",
        "primaryLang": "hi",
        "voice": "hi-IN-MadhurNeural",
        "pitch": "+3Hz",
        "rate": "+4%",
        "tone": "Enthusiastic & Inspiring",
        "description": "Dynamic preceptor motivating students through intense adavu repetitions.",
        "badge": "Dynamic Hindi"
    },
    {
        "id": "en_divya",
        "name": "Guru Divya",
        "gender": "female",
        "primaryLang": "en",
        "voice": "en-IN-NeerjaNeural",
        "pitch": "0Hz",
        "rate": "-3%",
        "tone": "Poised, Scholarly & Meticulous",
        "description": "Detailed anatomical breakdown of Aramandi, posture lines, and balance.",
        "badge": "Precision Posture"
    },
    {
        "id": "en_dev",
        "name": "Guru Dev",
        "gender": "male",
        "primaryLang": "en",
        "voice": "en-IN-PrabhatNeural",
        "pitch": "-8Hz",
        "rate": "-8%",
        "tone": "Calm, Steady & Measured",
        "description": "Reflective teacher keeping pace during slow (prathama kala) exploration.",
        "badge": "Steady Guide"
    },
    {
        "id": "en_nisha",
        "name": "Guru Nisha",
        "gender": "female",
        "primaryLang": "en",
        "voice": "en-IN-NeerjaNeural",
        "pitch": "+4Hz",
        "rate": "+2%",
        "tone": "Direct, Modern & Crisp",
        "description": "Crisp corrections for young practitioners and international learners.",
        "badge": "Modern English"
    },
    {
        "id": "en_sameer",
        "name": "Guru Sameer",
        "gender": "male",
        "primaryLang": "en",
        "voice": "en-IN-PrabhatNeural",
        "pitch": "0Hz",
        "rate": "-2%",
        "tone": "Friendly, Encouraging & Relatable",
        "description": "Supportive peer-guru easing beginner tension and body stiffness.",
        "badge": "Beginner Friendly"
    },
    {
        "id": "en_tara",
        "name": "Guru Tara",
        "gender": "female",
        "primaryLang": "en",
        "voice": "en-IN-NeerjaNeural",
        "pitch": "+14Hz",
        "rate": "+2%",
        "tone": "Youthful, Cheerful & Radiant",
        "description": "Joyful coaching bringing the spirit of Ananda to every practice session.",
        "badge": "Youthful Guide"
    },
    {
        "id": "en_aman",
        "name": "Guru Aman",
        "gender": "male",
        "primaryLang": "en",
        "voice": "en-IN-PrabhatNeural",
        "pitch": "-2Hz",
        "rate": "-4%",
        "tone": "Patient & Step-by-Step",
        "description": "Methodical instructor breaking intricate bols into learnable steps.",
        "badge": "Step-by-Step"
    },
    {
        "id": "bed_hindi",
        "name": "Guru Parampara",
        "gender": "female",
        "primaryLang": "hi",
        "voice": "hi-IN-SwaraNeural",
        "pitch": "-2Hz",
        "rate": "-8%",
        "tone": "Classical Archival Bed",
        "description": "Pure foundational Hindi reference voice calibrated for ritual namaskaram.",
        "badge": "Archival Bed"
    }
]

# Language mappings to authentic regional neural voices
LANGUAGE_VOICE_MAP = {
    "ta": {"female": "ta-IN-PallaviNeural", "male": "ta-IN-ValluvarNeural"},
    "te": {"female": "te-IN-ShrutiNeural", "male": "te-IN-MohanNeural"},
    "ml": {"female": "ml-IN-SobhanaNeural", "male": "ml-IN-MidhunNeural"},
    "bn": {"female": "bn-IN-TanishaaNeural", "male": "bn-IN-BashkarNeural"},
    "kn": {"female": "kn-IN-SapnaNeural", "male": "kn-IN-GaganNeural"},
    "mr": {"female": "mr-IN-AarohiNeural", "male": "mr-IN-ManoharNeural"},
    "gu": {"female": "gu-IN-DhwaniNeural", "male": "gu-IN-NiranjanNeural"},
    "sa": {"female": "hi-IN-SwaraNeural", "male": "hi-IN-MadhurNeural"},
    "hi": {"female": "hi-IN-SwaraNeural", "male": "hi-IN-MadhurNeural"},
    "hing": {"female": "hi-IN-SwaraNeural", "male": "hi-IN-MadhurNeural"},
    "en": {"female": "en-IN-NeerjaNeural", "male": "en-IN-PrabhatNeural"},
}

SUPPORTED_LANGUAGES = [
    {"code": "en", "name": "English (Indian)", "native": "English", "region": "Pan-India"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी", "region": "North India / Kathak"},
    {"code": "hing", "name": "Hinglish", "native": "Hinglish / हिंग्लिश", "region": "Urban Classical"},
    {"code": "ta", "name": "Tamil", "native": "தமிழ்", "region": "Tamil Nadu / Bharatanatyam"},
    {"code": "te", "name": "Telugu", "native": "తెలుగు", "region": "Andhra / Kuchipudi"},
    {"code": "ml", "name": "Malayalam", "native": "മലയാളം", "region": "Kerala / Kathakali & Mohiniyattam"},
    {"code": "sa", "name": "Sanskrit", "native": "संस्कृतम्", "region": "Natyashastra / Shlokas"},
    {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ", "region": "Karnataka / Classical"},
    {"code": "bn", "name": "Bengali", "native": "বাংলা", "region": "Bengal / Classical"},
    {"code": "or", "name": "Odia", "native": "ଓଡ଼ିଆ", "region": "Odisha / Odissi"},
    {"code": "mr", "name": "Marathi", "native": "मराठी", "region": "Maharashtra / Classical"},
    {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી", "region": "Gujarat / Folk & Classical"},
]

class GoonjTTSEngine:
    """
    High-fidelity Neural TTS Engine for Goonj Personas and Indian Classical Dance Vernaculars.
    Generates authentic neural audio on demand with zero robot/default sounds and automatic caching.
    """
    def __init__(self):
        self._persona_map = {p["id"]: p for p in GOONJ_PERSONAS}

    def get_personas(self) -> List[Dict]:
        return GOONJ_PERSONAS

    def get_languages(self) -> List[Dict]:
        return SUPPORTED_LANGUAGES

    def _get_cache_path(self, text: str, persona: str, lang: str, speed: float) -> Path:
        key = f"{persona}:{lang}:{speed:.2f}:{text.strip()}"
        hashed = hashlib.sha256(key.encode("utf-8")).hexdigest()
        return CACHE_DIR / f"{persona}_{lang}_{hashed[:16]}.mp3"

    def synthesize(self, text: str, persona: str = "hi_meera", lang: str = "auto", speed: float = 1.0) -> Optional[bytes]:
        """
        Synthesizes classical teaching cue into neural MP3 audio.
        Checks persistent disk cache first for instant playback.
        """
        clean_text = text.strip()
        if not clean_text:
            return None

        cache_path = self._get_cache_path(clean_text, persona, lang, speed)
        if cache_path.exists():
            data = cache_path.read_bytes()
            print(f"    [GoonjTTS Engine] Disk Cache HIT: {cache_path.name} ({len(data)} bytes)")
            return data

        # Pick voice config
        persona_info = self._persona_map.get(persona, self._persona_map["hi_meera"])
        voice_id = persona_info["voice"]
        pitch = persona_info.get("pitch", "0Hz")
        rate_offset = persona_info.get("rate", "0%")

        # If specific regional language requested, use native regional voice
        if lang in LANGUAGE_VOICE_MAP and lang not in ("en", "hi", "hing"):
            gender = persona_info.get("gender", "female")
            voice_id = LANGUAGE_VOICE_MAP[lang].get(gender, voice_id)

        # Adjust rate by user speed multiplier
        pct = int(round((speed - 1.0) * 100))
        rate_str = f"{pct:+d}%" if pct != 0 else rate_offset

        print(f"    [GoonjTTS Engine] Neural Synthesis starting: voice='{voice_id}', pitch='{pitch}', rate='{rate_str}'")

        try:
            audio_bytes = asyncio.run(self._generate_neural_audio(clean_text, voice_id, pitch, rate_str))
            if audio_bytes:
                cache_path.write_bytes(audio_bytes)
                print(f"    [GoonjTTS Engine] Neural Synthesis complete: {len(audio_bytes)} bytes written to {cache_path.name}")
                return audio_bytes
        except Exception as e:
            print(f"    [GoonjTTS Error] Synthesis exception: {e}")

        return None

    async def _generate_neural_audio(self, text: str, voice: str, pitch: str, rate: str) -> bytes:
        communicate = edge_tts.Communicate(text, voice, pitch=pitch, rate=rate)
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])
        return buf.getvalue()

engine = GoonjTTSEngine()
