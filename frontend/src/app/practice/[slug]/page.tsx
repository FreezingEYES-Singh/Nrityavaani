'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, ChevronRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { MUDRAS } from '@/lib/constants/mudras';
import type { Point } from '@/lib/mediapipe/classification';
import CameraFeed from '@/components/live/CameraFeed';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Eyebrow, Rule } from '@/components/ui/editorial';
import { translateFeedback } from '@/lib/utils/translations';

/** What CameraFeed hands back for each hand it reads. */
type DetectedMudra = { name: string; confidence: number; feedback: string };

export default function PracticeModePage() {
  const params = useParams();
  const router = useRouter();
  const mudraSlug = params.slug as string;
  const mudra = MUDRAS.find(m => m.slug === mudraSlug);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [confidence, setConfidence] = useState(0);
  const [bestDetection, setBestDetection] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("Show your hand to the camera to begin.");

  // Voice Assistant Ref
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const lastSpokenRef = useRef<string>("");
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasGreetedRef = useRef(false);
  // Seeded in an effect rather than here: a useRef initialiser runs during
  // render, and Date.now() there makes the render impure.
  const lastHandSeenRef = useRef<number | null>(null);
  const nudgeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices();
      // Priority for Hindi voices
      const targetVoice = voices.find(v => v.lang === 'hi-IN') || 
                          voices.find(v => v.lang.includes('hi')) ||
                          voices.find(v => v.lang.includes('IN'));
      setVoice(targetVoice || null);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Speak feedback function
  const speak = useCallback((text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Don't repeat the same thing immediately
    if (text === lastSpokenRef.current) return;
    
    // Debounce speech but keep it reactive
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    
    speechTimeoutRef.current = setTimeout(() => {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.05; // Slightly higher for a clear 'Guru' tone
      
      window.speechSynthesis.speak(utterance);
      lastSpokenRef.current = text;
    }, 300);
  }, [isVoiceEnabled, language, voice]);

  // Nudge logic: Speak if no hand is seen for 10 seconds
  useEffect(() => {
    if (!isCameraActive || !isVoiceEnabled) return;

    // The clock starts when the camera does, not when the component mounts:
    // otherwise time spent reading the page before switching the camera on
    // counts as time spent not showing a hand, and the first nudge fires
    // immediately.
    lastHandSeenRef.current = Date.now();

    nudgeIntervalRef.current = setInterval(() => {
      const idleTime = Date.now() - (lastHandSeenRef.current ?? Date.now());
      if (idleTime > 12000) { // 12 seconds of silence
        const nudgeMsg = translateFeedback("Adjust your hand position to match the reference image.", language);
        speak(nudgeMsg);
        lastHandSeenRef.current = Date.now(); // Reset timer after nudging
      }
    }, 5000);

    return () => {
      if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
    };
  }, [isCameraActive, isVoiceEnabled, language, speak]);

  // Handle detection updates
  const handleUpdate = useCallback((landmarkData: { landmarks?: Point[][] } | null, mudraData: DetectedMudra[]) => {
    // Freeze logic: If no hands are detected, don't update results state, but update idle timer
    if (!landmarkData || !landmarkData.landmarks || landmarkData.landmarks.length === 0) {
      return;
    }
    
    // Hand is seen!
    lastHandSeenRef.current = Date.now();
    
    // Greet if first time
    if (!hasGreetedRef.current) {
      const greeting = translateFeedback("Show your hand to the camera to begin.", language);
      speak(greeting);
      hasGreetedRef.current = true;
    }
    
    if (!mudra) return;

    // Find the current target mudra in the detections
    const targetDetection = mudraData.find(m => m.name.toLowerCase() === mudra.name.toLowerCase());
    const primaryDetection = mudraData[0]; // The one with highest confidence

    if (targetDetection) {
      setConfidence(targetDetection.confidence);
      setBestDetection(targetDetection.name);
      
      const translatedMsg = translateFeedback(targetDetection.feedback, language);
      setFeedback(translatedMsg);
      
      // Voice feedback for high confidence
      if (targetDetection.confidence > 0.85) {
        const perfectMsg = language === 'hi' ? `Adbhut! Aapne ${mudra.name} mudra sahi banayi.` : `Perfect ${mudra.name} detected! Excellent form.`;
        speak(perfectMsg);
      } else if (targetDetection.confidence > 0.4) {
        speak(translatedMsg);
      }
    } else if (primaryDetection && primaryDetection.name !== "No Mudra Detected") {
      setConfidence(0.1); 
      setBestDetection(primaryDetection.name);
      const wrongMsg = translateFeedback(`Detected ${primaryDetection.name} instead. Try to form ${mudra.name}.`, language);
      setFeedback(wrongMsg);
      speak(wrongMsg);
    } 
  }, [mudra, speak, language]);

  if (!mudra) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-md">
          <Eyebrow>not found</Eyebrow>
          <h1 className="serif text-[2rem] leading-tight mt-4">No mudra by that name.</h1>
          <Link
            href="/library"
            className="mono mt-7 inline-flex rounded-full border border-foreground/25 px-6 py-3 text-[11px] uppercase tracking-[0.16em] text-foreground/80 hover:border-primary/60 hover:text-primary transition-colors"
          >
            Back to the library
          </Link>
        </div>
      </div>
    );
  }

  const reading =
    confidence > 0.8 ? "holding" : confidence > 0.4 ? "close" : isCameraActive ? "searching" : "idle";

  return (
    <div className="min-h-screen px-6 pt-28 pb-20">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/45 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6">
              <Eyebrow tone="primary">practice</Eyebrow>
              <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                {mudra.category}
              </span>
              <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                {mudra.difficulty}
              </span>
            </div>
            <h1 className="serif font-normal tracking-[-0.015em] leading-[1.05] text-[clamp(1.9rem,4.4vw,3rem)] mt-3">
              {mudra.name} <span className="italic text-primary">{mudra.meaning}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/35">
                voice
              </span>
              {(["en", "hi"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  aria-pressed={language === code}
                  className={cn(
                    "mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                    language === code ? "text-primary" : "text-foreground/45 hover:text-foreground",
                  )}
                >
                  {code === "en" ? "English" : "\u0939\u093f\u0902\u0926\u0940"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-foreground/70 hover:text-primary transition-colors"
            >
              {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              Spoken cues {isVoiceEnabled ? "on" : "off"}
            </button>

            {/*
              A real reset. This button used to set the confidence number to zero
              and nothing else — the detection, the feedback line and the
              greeting all carried on from wherever they were.
            */}
            <button
              type="button"
              onClick={() => {
                setConfidence(0);
                setBestDetection(null);
                setFeedback("Show your hand to the camera to begin.");
                hasGreetedRef.current = false;
                lastSpokenRef.current = "";
                if (typeof window !== "undefined") window.speechSynthesis?.cancel();
              }}
              className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-foreground/70 hover:text-primary transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        <Rule className="mt-8 mb-8" />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12">
          <div className="xl:col-span-7 space-y-8">
            <div className="relative aspect-video overflow-hidden rounded-sm border border-foreground/12 bg-black">
              <CameraFeed isActive={isCameraActive} onUpdate={handleUpdate} targetMudra={mudra.name} />

              <AnimatePresence>
                {isCameraActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none grid place-items-center p-16"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mudra.image}
                      alt=""
                      aria-hidden
                      className="h-full w-auto object-contain grayscale invert"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {!isCameraActive && (
                <div className="absolute inset-0 grid place-items-center px-6">
                  <div className="text-center">
                    <Camera className="w-7 h-7 text-foreground/30 mx-auto" />
                    <p className="mono text-[11px] uppercase tracking-[0.16em] text-foreground/60 mt-5">
                      Camera off
                    </p>
                    <p className="mono text-[10px] text-foreground/35 mt-2.5 max-w-[32ch] mx-auto leading-relaxed">
                      The reference is laid over the feed as a guide. Nothing is recorded.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(true)}
                      className="mono mt-7 inline-flex rounded-full bg-primary text-black px-7 py-3 text-[11px] uppercase tracking-[0.16em] hover:bg-primary/85 transition-colors"
                    >
                      Start camera
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <Eyebrow tone="primary">how it is held</Eyebrow>
                <p className="serif text-[1rem] leading-[1.6] text-foreground/70 mt-3">
                  {mudra.instructions}
                </p>
              </section>
              <section className="border-l-2 border-rose-400/40 pl-5">
                <Eyebrow className="text-rose-400/80">where it goes wrong</Eyebrow>
                <p className="serif text-[1rem] leading-[1.6] text-foreground/70 mt-3">
                  {mudra.commonMistakes}
                </p>
              </section>
            </div>
          </div>

          <div className="xl:col-span-5 space-y-10">
            <div className="flex items-start gap-6">
              <div className="relative w-24 h-[7.5rem] shrink-0 overflow-hidden rounded-sm border border-foreground/12 bg-black">
                <Image
                  src={mudra.image}
                  alt={`The ${mudra.name} mudra`}
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </div>
              <div>
                <Eyebrow>you are aiming for</Eyebrow>
                <h2 className="serif text-[1.6rem] leading-tight tracking-tight mt-2">
                  {mudra.name}
                </h2>
                <p className="serif italic text-[1rem] text-foreground/55 mt-1">{mudra.meaning}</p>
              </div>
            </div>

            <div className="border border-foreground/12 rounded-sm p-8 sm:p-10 bg-background/50 backdrop-blur-sm">
              <div className="flex items-baseline gap-3">
                <span className="mono text-[3.4rem] leading-none tabular-nums tracking-tight text-primary">
                  {Math.round(confidence * 100)}
                </span>
                <span className="mono text-[11px] uppercase tracking-[0.16em] text-foreground/45">
                  % match
                </span>
              </div>

              <div className="mt-5 h-px w-full bg-foreground/15">
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${Math.round(confidence * 100)}%` }}
                />
              </div>

              <p
                aria-live="polite"
                className="serif text-[1.08rem] leading-[1.55] text-foreground/80 mt-7"
              >
                {feedback}
              </p>

              <Rule className="my-7" />

              <dl className="space-y-3.5">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                    reading
                  </dt>
                  <dd className="mono text-[11px] uppercase tracking-[0.14em] text-foreground/85">
                    {bestDetection ?? "\u2014"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                    status
                  </dt>
                  {/*
                    Derived from the camera and the score. This row read "Active"
                    with a pulsing dot at all times, including with the camera
                    switched off.
                  */}
                  <dd
                    className={cn(
                      "mono text-[11px] uppercase tracking-[0.14em]",
                      reading === "holding"
                        ? "text-emerald-400"
                        : reading === "close"
                          ? "text-primary"
                          : "text-foreground/50",
                    )}
                  >
                    {reading}
                  </dd>
                </div>
              </dl>
            </div>

            <Link
              href={`/library/${mudra.slug}`}
              className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-primary hover:gap-3 transition-all"
            >
              Read the full entry
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
