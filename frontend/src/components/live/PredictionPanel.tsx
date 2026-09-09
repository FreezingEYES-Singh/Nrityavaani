'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { HandReading } from '@/lib/mediapipe/types';

interface PredictionPanelProps {
  detectedMudras: HandReading[];
}

export default function PredictionPanel({ detectedMudras }: PredictionPanelProps) {
  // Keeps the last reading on screen when the hand leaves the frame, so a
  // result does not vanish the moment you look away from the camera.
  //
  // Adjusted during render rather than in an effect. React sanctions this
  // for deriving state from props; doing it in an effect renders once with
  // the stale value, then immediately again — a flicker on every frame the
  // hand is lost.
  const [lastValidMudras, setLastValidMudras] = useState<HandReading[]>([]);
  if (detectedMudras.length > 0 && detectedMudras !== lastValidMudras) {
    setLastValidMudras(detectedMudras);
  }

  const displayMudras = (detectedMudras && detectedMudras.length > 0) ? detectedMudras : lastValidMudras;
  const isStale = (!detectedMudras || detectedMudras.length === 0) && lastValidMudras.length > 0;
  // Use the best single prediction for the Top Predictions card or map all hands
  const predictions = displayMudras;

  return (
    <div className="flex flex-col space-y-6">
      {/* Current Result Card */}
      <div className={cn(
        "glass-card p-6 relative overflow-hidden transition-colors duration-500",
        isStale ? "border-foreground/10 opacity-70" : "border-primary/20",
        displayMudras.length === 0 ? "border-foreground/5 opacity-50" : ""
      )}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap className="w-16 h-16 text-primary" />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground/40 text-[10px] uppercase tracking-widest font-bold flex items-center space-x-2">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              isStale ? "bg-foreground/20" : "bg-primary"
            )} />
            <span>{isStale ? 'Captured Result' : 'Live Detection'}</span>
          </h3>
          {isStale && (
            <button 
              onClick={() => setLastValidMudras([])}
              className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-6">
          {displayMudras.length > 0 ? displayMudras.map((displayMudra, index) => (
            <div key={`${displayMudra.name}-${index}`} className="relative">
              <div className="mb-4">
                <p className="text-xs text-primary font-bold tracking-widest uppercase mb-1">
                  {displayMudra.handedness} Hand
                </p>
                <h2 className={cn(
                  "text-3xl font-black mb-2 transition-all",
                  isStale ? "text-foreground/40" : "text-foreground"
                )}>
                  {displayMudra.name}
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn("h-full", isStale ? "bg-foreground/20" : "bg-primary")}
                      initial={{ width: 0 }}
                      animate={{ width: `${displayMudra.confidence * 100}%` }}
                    />
                  </div>
                  <span className={cn("font-mono text-sm", isStale ? "text-foreground/20" : "text-primary")}>
                    {`${(displayMudra.confidence * 100).toFixed(1)}%`}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-foreground/5 rounded-xl border border-foreground/5">
                <ShieldCheck className={cn("w-5 h-5 mt-0.5", isStale ? "text-foreground/20" : "text-green-400")} />
                <div>
                  <p className={cn("text-[10px] font-bold uppercase mb-1", isStale ? "text-foreground/20" : "text-green-400")}>
                    Feedback
                  </p>
                  <p className={cn("text-sm leading-relaxed", isStale ? "text-foreground/30" : "text-foreground/70")}>
                    {displayMudra.feedback}
                  </p>
                </div>
              </div>
              {index < displayMudras.length - 1 && <div className="my-6 border-t border-foreground/10" />}
            </div>
          )) : (
            <div className="space-y-4">
              <h2 className="text-3xl font-black mb-2 text-foreground/40">Searching...</h2>
              <div className="flex items-start space-x-3 p-3 bg-foreground/5 rounded-xl border border-foreground/5 opacity-50">
                <AlertCircle className="w-5 h-5 text-foreground/40 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase mb-1 text-foreground/40">Waiting for data</p>
                  <p className="text-sm text-foreground/30">Adjust your hands within the frame for analysis.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Top Predictions Card */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-accent-cyan" />
          <span>Top Predictions</span>
        </h3>
        
        <div className="space-y-4">
          {predictions.length > 0 ? predictions.map((p, i) => (
            <div key={`${p.name}-${p.handedness || ''}-${i}`} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground/80">{p.handedness ? `${p.handedness}: ` : ''}{p.name}</span>
                <span className="text-foreground/40">{Math.round(p.confidence * 100)}%</span>
              </div>
              <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-accent-violet' : 'bg-accent-pink'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${p.confidence * 100}%` }}
                />
              </div>
            </div>
          )) : (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="flex justify-between">
                    <div className="w-24 h-4 bg-foreground/5 rounded" />
                    <div className="w-8 h-4 bg-foreground/5 rounded" />
                  </div>
                  <div className="h-1 bg-foreground/5 rounded-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
