import { type Language, type SpokenLine, lineText } from "@/lib/lesson/manifest";
import { type GuruPersona, getPersona } from "./guruPersonas";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export interface GuruAudioEngineOptions {
  volume?: number;
  muted?: boolean;
  rate?: number;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export class GuruAudioEngine {
  private persona: GuruPersona;
  private lang: Language;
  private volume: number;
  private muted: boolean;
  private rate: number;
  private onSpeakingChange?: (isSpeaking: boolean) => void;
  private onLoadingChange?: (isLoading: boolean) => void;

  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeAbortController: AbortController | null = null;

  private activeLineStart = -1;
  private isSpeaking = false;
  private isLoading = false;
  private audioCache = new Map<string, string>(); // cacheKey -> objectUrl

  constructor(
    personaId = "hi_meera",
    lang: Language = "en",
    options: GuruAudioEngineOptions = {}
  ) {
    this.persona = getPersona(personaId);
    this.lang = lang;
    this.volume = options.volume ?? 0.8;
    this.muted = options.muted ?? false;
    this.rate = options.rate ?? 1.0;
    this.onSpeakingChange = options.onSpeakingChange;
    this.onLoadingChange = options.onLoadingChange;
  }

  public setPersona(personaId: string) {
    if (this.persona.id !== personaId) {
      this.persona = getPersona(personaId);
      this.stop();
    }
  }

  public setLanguage(lang: Language) {
    if (this.lang !== lang) {
      this.lang = lang;
      this.stop();
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.muted ? 0 : this.volume;
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.currentAudio) {
      this.currentAudio.volume = this.muted ? 0 : this.volume;
    }
    if (this.muted) {
      this.stop();
    }
  }

  public setRate(rate: number) {
    this.rate = rate;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
  }

  public stop() {
    this.activeLineStart = -1;

    // Abort any in-flight backend fetch immediately
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }

    // Stop HTML Audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.src = "";
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.onloadedmetadata = null;
      this.currentAudio = null;
    }

    // Stop SpeechSynthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.setLoading(false);
    this.setSpeaking(false);
  }

  private setSpeaking(val: boolean) {
    if (this.isSpeaking !== val) {
      this.isSpeaking = val;
      this.onSpeakingChange?.(val);
    }
  }

  private setLoading(val: boolean) {
    if (this.isLoading !== val) {
      this.isLoading = val;
      this.onLoadingChange?.(val);
    }
  }

  /**
   * Sync playback for current line.
   * If line is already playing or loading, keeps going smoothly without restarting or cracking.
   */
  public async syncLine(
    lineStart: number,
    lineDuration: number,
    text: string,
    currentPlaybackTime: number
  ) {
    if (this.muted || !text.trim()) {
      if (this.activeLineStart !== -1) {
        this.stop();
      }
      return;
    }

    // Already handling this line!
    if (this.activeLineStart === lineStart) {
      if (this.currentAudio) {
        this.currentAudio.volume = this.muted ? 0 : this.volume;
      }
      return;
    }

    // New line: Stop prior audio and fetch/play single authentic source
    this.stop();
    this.activeLineStart = lineStart;
    const offsetSeconds = Math.max(0, currentPlaybackTime - lineStart);

    const cacheKey = `${this.persona.id}:${this.lang}:${text.trim()}`;

    // 1. Instant Playback from in-memory cache (0ms latency)
    if (this.audioCache.has(cacheKey)) {
      const url = this.audioCache.get(cacheKey)!;
      this.playAudioUrl(url, offsetSeconds, lineStart, lineDuration);
      return;
    }

    // 2. Fetch Neural Voice from Goonj Backend API
    const controller = new AbortController();
    this.activeAbortController = controller;
    this.setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/tts/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          persona: this.persona.id,
          lang: this.lang,
          speed: this.rate,
        }),
        signal: controller.signal,
      });

      if (this.activeAbortController !== controller || this.activeLineStart !== lineStart) {
        // Line changed or stopped while fetch was in-flight; ignore response
        return;
      }

      this.activeAbortController = null;
      this.setLoading(false);

      if (res.ok && res.headers.get("content-type")?.includes("audio")) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        this.audioCache.set(cacheKey, objectUrl);
        this.playAudioUrl(objectUrl, offsetSeconds, lineStart, lineDuration);
        return;
      } else {
        const errText = await res.text();
        console.warn(`[GuruAudioEngine] Backend returned non-audio response:`, errText);
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || this.activeLineStart !== lineStart) {
        return;
      }
      this.activeAbortController = null;
      this.setLoading(false);
    }

    // 3. Fallback to Web Speech only if backend server is completely unavailable
    this.speakWithWebSpeech(text, lineStart);
  }

  private playAudioUrl(url: string, offsetSeconds: number, lineStart: number, lineDuration: number) {
    if (this.activeLineStart !== lineStart || this.muted) return;

    // Ensure any previously active audio element is cleanly paused and detached
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.onloadedmetadata = null;
      this.currentAudio = null;
    }

    const audio = new Audio(url);
    this.currentAudio = audio;
    audio.volume = this.muted ? 0 : this.volume;

    let hasStarted = false;
    const startAudio = () => {
      if (hasStarted) return;
      hasStarted = true;
      if (this.activeLineStart !== lineStart || this.muted) return;

      // Smart tempo calibration: ensure cue completes naturally within the dancer's movement slot
      if (Number.isFinite(audio.duration) && lineDuration > 1.0) {
        const remainingSlot = Math.max(0.5, lineDuration - offsetSeconds);
        const remainingAudio = Math.max(0.5, audio.duration - offsetSeconds);
        if (remainingAudio > remainingSlot + 0.15) {
          const syncRate = Math.min(1.25, Math.max(0.9, (remainingAudio / remainingSlot) * this.rate));
          audio.playbackRate = syncRate;
        } else {
          audio.playbackRate = this.rate;
        }
      } else {
        audio.playbackRate = this.rate;
      }

      if (offsetSeconds > 0 && Number.isFinite(audio.duration) && offsetSeconds < audio.duration - 0.05) {
        try {
          audio.currentTime = offsetSeconds;
        } catch {}
      }

      this.setSpeaking(true);
      audio.play().catch((e) => {
        console.warn("[GuruAudioEngine] audio.play() caught:", e);
        this.setSpeaking(false);
      });
    };

    audio.onloadedmetadata = () => startAudio();
    if (audio.readyState >= 1) {
      startAudio();
    }

    audio.onended = () => {
      if (this.activeLineStart === lineStart) {
        this.setSpeaking(false);
        this.currentAudio = null;
      }
    };
    audio.onerror = (e) => {
      console.warn("[GuruAudioEngine] audio error:", e);
      if (this.activeLineStart === lineStart) {
        this.setSpeaking(false);
        this.currentAudio = null;
      }
    };
  }

  /**
   * Pre-fetches all cues for the current language into in-memory cache
   * so line transitions and scrubs have zero network or decoding lag.
   */
  public preloadLanguage(lines: SpokenLine[]) {
    const lang = this.lang;
    const personaId = this.persona.id;
    for (const l of lines) {
      const text = lineText(l, lang);
      if (!text || !text.trim()) continue;
      const cacheKey = `${personaId}:${lang}:${text.trim()}`;
      if (this.audioCache.has(cacheKey)) continue;

      fetch(`${API_BASE}/api/tts/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          persona: personaId,
          lang,
          speed: this.rate,
        }),
      })
        .then((res) => {
          if (res.ok && res.headers.get("content-type")?.includes("audio")) {
            return res.blob();
          }
          return null;
        })
        .then((blob) => {
          if (blob) {
            this.audioCache.set(cacheKey, URL.createObjectURL(blob));
          }
        })
        .catch(() => {});
    }
  }

  private speakWithWebSpeech(text: string, lineStart: number) {
    if (typeof window === "undefined" || !window.speechSynthesis || this.muted) return;
    if (this.activeLineStart !== lineStart) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const langMap: Record<Language, string> = {
      en: "en-IN",
      hi: "hi-IN",
      hing: "hi-IN",
      ta: "ta-IN",
      te: "te-IN",
      ml: "ml-IN",
      sa: "hi-IN",
      kn: "kn-IN",
      bn: "bn-IN",
    };

    utterance.lang = langMap[this.lang] || "en-IN";
    utterance.pitch = this.persona.voicePitch;
    utterance.rate = this.persona.voiceRate * this.rate;
    utterance.volume = this.volume;

    const voices = window.speechSynthesis.getVoices();
    const desired = utterance.lang;
    const matchedVoice =
      voices.find((v) => v.lang === desired) ||
      voices.find((v) => v.lang.startsWith(desired.split("-")[0])) ||
      voices.find((v) => v.lang.includes("IN"));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      if (this.activeLineStart === lineStart) {
        this.setSpeaking(true);
      }
    };
    utterance.onend = () => {
      if (this.activeLineStart === lineStart) {
        this.setSpeaking(false);
      }
    };
    utterance.onerror = () => {
      if (this.activeLineStart === lineStart) {
        this.setSpeaking(false);
      }
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }
}
