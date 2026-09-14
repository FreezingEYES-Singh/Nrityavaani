'use client';

import React, { useRef, useState, useEffect } from 'react';
import CameraFeed from '@/components/live/CameraFeed';
import PredictionPanel from '@/components/live/PredictionPanel';
import JointsGrid from '@/components/live/JointsGrid';
import ControlPanel from '@/components/live/ControlPanel';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { Eyebrow, Rule } from '@/components/ui/editorial';
import type { FrameLandmarks, HandReading } from '@/lib/mediapipe/types';
import { StatsService } from '@/lib/services/StatsService';
import { format } from 'date-fns';

/** One held mudra, logged while the camera is running. */
type TimelineEntry = { id: string; name: string; confidence: number; time: number };

export default function LiveDetectionPage() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [session, setSession] = useState<{
    landmarks: FrameLandmarks | null,
    detectedMudra: HandReading[] | null
  }>({
    landmarks: null,
    detectedMudra: null
  });

  // Timeline state
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const masteryTimer = useRef<{ name: string, startTime: number } | null>(null);
  const sessionStartTime = useRef<number | null>(null);
  const sessionStats = useRef<{ totalAccuracy: number, count: number }>({ totalAccuracy: 0, count: 0 });
  // Read by the save effect when the camera stops. Held in a ref rather than
  // listed as a dependency: depending on it would re-run the effect on every
  // logged mudra, and that effect's job is to save once, at the end.
  const timelineRef = useRef<TimelineEntry[]>([]);

  // Handle Session End/Start
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  useEffect(() => {
    if (isCameraActive) {
      sessionStartTime.current = Date.now();
      sessionStats.current = { totalAccuracy: 0, count: 0 };
      // Starting a camera session is exactly the external event this state
      // mirrors; there is no render-time value to derive an empty timeline
      // from.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeline([]);
    } else if (sessionStartTime.current) {
      const duration = (Date.now() - sessionStartTime.current) / 1000;
      if (duration > 5 && sessionStats.current.count > 0) {
        // Save session if it lasted more than 5 seconds
        const avgAccuracy = Math.round(sessionStats.current.totalAccuracy / sessionStats.current.count);
        
        // Find most frequent mudra in timeline for the session name
        const finished = timelineRef.current;
        const mostFrequent = finished.length > 0 
          ? finished.reduce((acc, curr) => {
              acc[curr.name] = (acc[curr.name] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          : null;
        
        const topMudra = mostFrequent ? Object.keys(mostFrequent).reduce((a, b) => mostFrequent[a] > mostFrequent[b] ? a : b) : 'Free Practice';

        StatsService.saveSession({
          mudraId: topMudra.toLowerCase().replace(' ', '-'),
          mudraName: topMudra,
          accuracy: avgAccuracy,
          duration: duration
        });
      }
      sessionStartTime.current = null;
    }
  }, [isCameraActive]);

  const lastUpdateTime = React.useRef(0);
  
  // Voice Assistant logic
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const lastSpokenRef = useRef<string>("");
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(v => v.lang === 'hi-IN') || 
                          voices.find(v => v.lang.includes('hi')) ||
                          voices.find(v => v.lang.includes('IN'));
      setVoice(targetVoice || null);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = React.useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (text === lastSpokenRef.current) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.lang = 'hi-IN'; // Default to Hindi for that Guru feel
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = text;
  }, [voice]);

  const handleUpdate = React.useCallback((landmarkData: FrameLandmarks | null, mudraData: HandReading[]) => {
    // Throttle to ~33fps. Date.now rather than performance.now: the difference
    // is irrelevant at a 30ms gate, and performance.now made the React compiler
    // bail out of memoising this component entirely.
    const now = Date.now();
    if (now - lastUpdateTime.current < 30) return;
    lastUpdateTime.current = now;

    // Freeze logic: If no hands are detected, don't update the state.
    // This allows the user to remove their hand to see the result without it disappearing.
    if (!landmarkData || !landmarkData.landmarks || landmarkData.landmarks.length === 0) {
      return;
    }
    
    // Greet if first time
    if (!hasGreetedRef.current) {
      speak("Pranaam! Chaliye mudra ka abhyas prarambh karte hain.");
      hasGreetedRef.current = true;
    }

    setSession(prev => {
      const bestMudra = mudraData && mudraData.length > 0 ? mudraData[0] : null;
      
      // Mastery Detection Logic
      if (bestMudra && bestMudra.confidence > 0.85) {
        if (!masteryTimer.current || masteryTimer.current.name !== bestMudra.name) {
          masteryTimer.current = { name: bestMudra.name, startTime: Date.now() };
        } else if (Date.now() - masteryTimer.current.startTime > 1500) {
          // Mastered! Add to timeline
          setTimeline(t => {
            if (t.length > 0 && t[0].name === bestMudra.name && Date.now() - t[0].time < 5000) return t;
            return [{
              name: bestMudra.name,
              confidence: Math.round(bestMudra.confidence * 100),
              time: Date.now(),
              // A collision here means two rows sharing a React key, which
              // makes the list reorder wrongly. Math.random() collides.
              id: crypto.randomUUID()
            }, ...t].slice(0, 10);
          });
          masteryTimer.current = { name: bestMudra.name, startTime: Date.now() }; 
        }
        
        sessionStats.current.totalAccuracy += (bestMudra.confidence * 100);
        sessionStats.current.count += 1;
      } else {
        masteryTimer.current = null;
      }

      const prevMudrasStr = JSON.stringify(prev.detectedMudra?.map((m: HandReading) => ({ n: m.name, c: Math.round(m.confidence * 10) })) || []);
      const newMudrasStr = JSON.stringify(mudraData?.map((m: HandReading) => ({ n: m.name, c: Math.round(m.confidence * 10) })) || []);
      
      const mudraChanged = prevMudrasStr !== newMudrasStr;

      if (!mudraChanged && !landmarkData) return prev;

      return {
        landmarks: landmarkData,
        detectedMudra: mudraChanged ? mudraData : prev.detectedMudra
      };
    });
  }, [speak]);

  return (
    <div className="min-h-screen px-6 pt-28 pb-16">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow tone="primary">live detection</Eyebrow>
            <h1 className="serif font-normal tracking-[-0.015em] leading-[1.05] text-[clamp(1.7rem,3.6vw,2.6rem)] mt-3">
              Hold a mudra to the camera.
            </h1>
          </div>
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/45 max-w-[34ch] leading-relaxed">
            Runs in this tab · no frame is uploaded ·{" "}
            <Link href="/upload" className="text-primary hover:underline underline-offset-4">
              read a photo instead
            </Link>
          </p>
        </div>

        <Rule className="mt-8 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 items-start">
          {/* ------------------------------------------------------- camera */}
          <div className="lg:col-span-8">
            <div className="relative aspect-video overflow-hidden rounded-sm border border-foreground/12 bg-black">
              <CameraFeed
                isActive={isCameraActive}
                onUpdate={handleUpdate}
                showLandmarks={showLandmarks}
                showSkeleton={showSkeleton}
              />

              {!isCameraActive && (
                <div className="absolute inset-0 grid place-items-center px-6">
                  <div className="text-center">
                    <Camera className="w-7 h-7 text-foreground/30 mx-auto" />
                    <p className="mono text-[11px] uppercase tracking-[0.16em] text-foreground/60 mt-5">
                      Camera off
                    </p>
                    <p className="mono text-[10px] text-foreground/35 mt-2.5 max-w-[30ch] mx-auto leading-relaxed">
                      Your browser will ask permission. The video is never sent anywhere.
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
          </div>

          {/* --------------------------------------------------- predictions */}
          <div className="lg:col-span-4 lg:row-start-1 lg:col-start-9 lg:row-span-3 space-y-6">
            <PredictionPanel detectedMudras={session.detectedMudra || []} />
          </div>

          {/* ------------------------------------------------------ controls */}
          <div className="lg:col-span-8">
            <ControlPanel
              isActive={isCameraActive}
              onToggleCamera={() => setIsCameraActive(!isCameraActive)}
              showLandmarks={showLandmarks}
              onToggleLandmarks={() => setShowLandmarks(!showLandmarks)}
              showSkeleton={showSkeleton}
              onToggleSkeleton={() => setShowSkeleton(!showSkeleton)}
            />
          </div>

          {/* ------------------------------------------ joints and timeline */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <JointsGrid landmarks={session.landmarks} />

            <div className="border border-foreground/12 rounded-sm p-6 min-h-[400px] flex flex-col bg-background/50 backdrop-blur-sm">
              <Eyebrow>this session</Eyebrow>

              <div className="flex-1 mt-6 overflow-y-auto pr-1 no-scrollbar">
                {timeline.length > 0 ? (
                  <ol className="space-y-0">
                    {timeline.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-baseline justify-between gap-4 py-3.5 border-t border-foreground/10"
                      >
                        <div className="min-w-0">
                          <p className="text-[0.95rem] font-medium truncate">{event.name}</p>
                          <p className="mono text-[10px] text-foreground/40 mt-1">
                            {format(event.time, "HH:mm:ss")}
                          </p>
                        </div>
                        {/*
                          The real number. This slot used to read "PERFECT" on
                          every row regardless of what was measured, with the
                          actual score printed underneath it — so a 86% hold and
                          a 99% hold were both labelled perfect.
                        */}
                        <span className="mono text-[0.95rem] tabular-nums text-primary shrink-0">
                          {event.confidence}%
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="serif italic text-[0.98rem] leading-[1.6] text-foreground/40 max-w-[30ch]">
                    {isCameraActive
                      ? "Hold a mudra above 85% for a second and a half and it will be logged here."
                      : "Start the camera and held mudras will be logged here."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
