'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Point } from '@/lib/mediapipe/classification';
import type { FrameLandmarks } from '@/lib/mediapipe/types';

interface JointsGridProps {
  landmarks: FrameLandmarks | null;
}

const JOINT_LABELS = [
  "WRIST", "THUMB_CMC", "THUMB_MCP", "THUMB_IP", "THUMB_TIP",
  "INDEX_MCP", "INDEX_PIP", "INDEX_DIP", "INDEX_TIP",
  "MIDDLE_MCP", "MIDDLE_PIP", "MIDDLE_DIP", "MIDDLE_TIP",
  "RING_MCP", "RING_PIP", "RING_DIP", "RING_TIP",
  "PINKY_MCP", "PINKY_PIP", "PINKY_DIP", "PINKY_TIP"
];

export default function JointsGrid({ landmarks }: JointsGridProps) {
  // One expression, so the narrowing survives: the previous pair let
  // TypeScript forget that `landmarks.landmarks` had already been checked.
  const hand = landmarks?.landmarks?.[0] ?? null;
  const hasLandmarks = hand !== null;

  return (
    <div className="glass-card p-6 overflow-hidden flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span>Joints Data Grid</span>
        </h3>
        {hasLandmarks && (
          <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-bold uppercase tracking-tighter">
            Live Feed
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {hand ? (
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-foreground/30 uppercase mb-2 px-2">
              <span>Joint</span>
              <span className="text-right">X</span>
              <span className="text-right">Y</span>
              <span className="text-right">Z</span>
            </div>
            {hand.map((land: Point, i: number) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`grid grid-cols-4 gap-2 px-2 py-1.5 rounded-md text-[11px] font-mono transition-colors ${i === 4 || i === 8 || i === 12 || i === 16 || i === 20 ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-foreground/5'}`}
              >
                <span className="text-foreground/60 truncate" title={JOINT_LABELS[i]}>
                  {i}. {JOINT_LABELS[i]}
                </span>
                <span className="text-right text-foreground/40">{land.x.toFixed(3)}</span>
                <span className="text-right text-foreground/40">{land.y.toFixed(3)}</span>
                <span className="text-right text-foreground/40">{land.z.toFixed(3)}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-foreground/10 rounded-lg animate-pulse" />
              ))}
            </div>
            <p className="text-xs font-medium">Capture starting...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
