'use client';

import React, { useRef, useEffect } from 'react';
import type { Point } from '@/lib/mediapipe/classification';
import type { FrameLandmarks } from '@/lib/mediapipe/types';

interface HandOverlayProps {
  landmarks: FrameLandmarks | null;
  showDots: boolean;
  showLines: boolean;
}

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17]             // Palm
];

export default function HandOverlay({ landmarks, showDots, showLines }: HandOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothedLandmarks = useRef<Point[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Smooth interpolation factor (0.1 = very smooth, 0.5 = responsive)
  const LERP_FACTOR = 0.35;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || !landmarks.landmarks || landmarks.landmarks.length === 0) {
      smoothedLandmarks.current = [];
      animationFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const rawHand = landmarks.landmarks[0];
    
    // Initialize or update smoothed points
    if (smoothedLandmarks.current.length !== rawHand.length) {
      smoothedLandmarks.current = rawHand.map((p: Point) => ({ ...p }));
    } else {
      for (let i = 0; i < rawHand.length; i++) {
        smoothedLandmarks.current[i].x += (rawHand[i].x - smoothedLandmarks.current[i].x) * LERP_FACTOR;
        smoothedLandmarks.current[i].y += (rawHand[i].y - smoothedLandmarks.current[i].y) * LERP_FACTOR;
        smoothedLandmarks.current[i].z += (rawHand[i].z - smoothedLandmarks.current[i].z) * LERP_FACTOR;
      }
    }

    const hand = smoothedLandmarks.current;

    // Draw Connections
    if (showLines) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      CONNECTIONS.forEach(([start, end]) => {
        const pt1 = hand[start];
        const pt2 = hand[end];
        if (pt1 && pt2) {
          const x1 = pt1.x * canvas.width;
          const y1 = pt1.y * canvas.height;
          const x2 = pt2.x * canvas.width;
          const y2 = pt2.y * canvas.height;

          // Outer Glow Line
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 153, 51, 0.15)';
          ctx.lineWidth = 12;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Middle Bright Line
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 153, 51, 0.4)';
          ctx.lineWidth = 4;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Core Beam
          ctx.beginPath();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });
    }

    // Draw Landmarks
    if (showDots) {
      hand.forEach((land, idx) => {
        const x = land.x * canvas.width;
        const y = land.y * canvas.height;
        
        const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
        const color = isTip ? '#FFD700' : '#FF9933';
        
        // Soft Radial Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, isTip ? 15 : 10);
        gradient.addColorStop(0, isTip ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 153, 51, 0.4)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, isTip ? 15 : 10, 0, 2 * Math.PI);
        ctx.fill();

        // Main Point
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, isTip ? 5 : 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Inner Bright Core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, isTip ? 2 : 1.2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // `draw` is redefined every render by design — it closes over the latest
    // landmarks — and is only ever called through the animation frame this
    // effect owns, so listing it would restart the loop on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landmarks, showDots, showLines]);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      className="absolute inset-0 w-full h-full pointer-events-none mirror-x mix-blend-screen opacity-90"
    />
  );
}
