'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera } from 'lucide-react';
import { classifyMudra, classifySamyuktaMudra, getSpecificMudraScore, type Point } from '@/lib/mediapipe/classification';
import type { FrameHandler, HandReading } from '@/lib/mediapipe/types';

interface CameraFeedProps {
  isActive: boolean;
  onUpdate: FrameHandler;
  targetMudra?: string;
  showLandmarks?: boolean;
  showSkeleton?: boolean;
}

const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [17, 18], [18, 19], [19, 20],
  // Palm
  [0, 17]
];

const CameraFeed = ({ 
  isActive, 
  onUpdate, 
  targetMudra,
  showLandmarks = true,
  showSkeleton = true
}: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          // Pinned, not `@latest`: this URL is a script this page executes, and
          // resolving it to whatever is newest at load time means the code
          // running here can change without anything in this repo changing.
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
      } catch (err) {
        console.error("Failed to initialize Hand Landmarker:", err);
        setError("Failed to load AI model. Please check your connection.");
      }
    };

    initDetector();

    return () => {
      isMountedRef.current = false;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: "user" } 
      });
      
      // If component unmounted while waiting for permissions
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          predictLoopRef.current();
          if (videoRef.current) videoRef.current.onloadeddata = null;
        };
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      if (isMountedRef.current) {
        setError("Webcam access denied. Please enable camera permissions.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isActive && videoRef.current) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  // Clean up on tab visibility change as well
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (isActive && isMountedRef.current) {
        startCamera();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, startCamera, stopCamera]);

  /**
   * Holds the current predictLoop so callers do not depend on where it is
   * declared. Written in an effect, never during render.
   */
  const predictLoopRef = useRef<() => void>(() => {});

  const predictLoop = useCallback(() => {
    if (!videoRef.current || !handLandmarkerRef.current || !isActive) return;

    const startTimeMs = performance.now();
    const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
    
    const detectedMudras: HandReading[] = [];
    if (results.landmarks && results.landmarks.length > 0) {
      results.landmarks.forEach((hand: Point[], index: number) => {
        const handedness = results.handednesses?.[index]?.[0]?.categoryName || 'Unknown';
        
        if (targetMudra) {
          // Specific evaluation for target mudra in practice mode
          const specificMudra = getSpecificMudraScore(hand, targetMudra, handedness);
          detectedMudras.push({ handedness, ...specificMudra, isTarget: true });
          
          // Also get the best current match for context
          const bestMudra = classifyMudra(hand, handedness);
          if (bestMudra && bestMudra.name !== specificMudra.name) {
             detectedMudras.push({ handedness, ...bestMudra, isTarget: false });
          }
        } else {
          const mudra = classifyMudra(hand, handedness);
          if (mudra) {
            detectedMudras.push({ handedness, ...mudra });
          }
        }
      });

      // Double-hand (Samyukta) mudra evaluation
      if (results.landmarks.length >= 2) {
        const samyukta = classifySamyuktaMudra(results.landmarks[0], results.landmarks[1]);
        if (samyukta) {
          const isTargetMatch = targetMudra ? samyukta.name.toLowerCase() === targetMudra.toLowerCase() : false;
          detectedMudras.unshift({
            handedness: 'Both Hands',
            name: samyukta.name,
            confidence: samyukta.confidence,
            feedback: samyukta.feedback,
            isTarget: isTargetMatch || undefined,
          });
        }
      }
    }

    if (results.landmarks) {
      drawLandmarks(results.landmarks);
    }

    onUpdate(results, detectedMudras);
    animationFrameRef.current = requestAnimationFrame(() => predictLoopRef.current());
    // drawLandmarks reads only refs and props that are already listed; it is
    // declared below purely for readability.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, targetMudra, onUpdate]);

  useEffect(() => {
    predictLoopRef.current = predictLoop;
  }, [predictLoop]);

  const drawLandmarks = (landmarks: Point[][]) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!landmarks || landmarks.length === 0) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (const hand of landmarks) {
      // 1. Draw Skeleton (Connections)
      if (showSkeleton) {
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(6, 182, 212, 0.8)";
        
        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
          const start = hand[startIdx];
          const end = hand[endIdx];
          
          const startX = start.x * canvas.width;
          const startY = start.y * canvas.height;
          const endX = end.x * canvas.width;
          const endY = end.y * canvas.height;
          
          const grad = ctx.createLinearGradient(startX, startY, endX, endY);
          grad.addColorStop(0, "rgba(6, 182, 212, 0.9)");
          grad.addColorStop(1, "rgba(168, 85, 247, 0.9)");
          
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
      
      // 2. Draw Landmarks (Points)
      if (showLandmarks) {
        const fingerTips = [4, 8, 12, 16, 20];
        hand.forEach((lm: Point, idx: number) => {
          const isTip = fingerTips.includes(idx);
          const cw = lm.x * canvas.width;
          const ch = lm.y * canvas.height;
          
          ctx.beginPath();
          ctx.arc(cw, ch, isTip ? 6 : 4, 0, 2 * Math.PI);
          ctx.fillStyle = isTip ? "rgba(236, 72, 153, 0.9)" : "rgba(168, 85, 247, 0.8)";
          ctx.shadowBlur = isTip ? 18 : 10;
          ctx.shadowColor = isTip ? "rgba(236, 72, 153, 1)" : "rgba(168, 85, 247, 1)";
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(cw, ch, isTip ? 2.5 : 1.5, 0, 2 * Math.PI);
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowBlur = 0;
          ctx.fill();
        });
      }
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black rounded-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover mirror-x opacity-100"
        style={{ display: isActive ? 'block' : 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none mirror-x opacity-100"
        style={{ display: isActive ? 'block' : 'none' }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 px-6 text-center z-10">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}
      <style jsx>{`
        .mirror-x {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

CameraFeed.Icon = Camera;

export default CameraFeed;
