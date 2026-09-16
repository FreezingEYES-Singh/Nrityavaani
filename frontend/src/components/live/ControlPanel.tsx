'use client';

import React from 'react';
import { Camera, CameraOff, Eye, EyeOff, GitBranch, Save, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  isActive: boolean;
  onToggleCamera: () => void;
  showLandmarks: boolean;
  onToggleLandmarks: () => void;
  showSkeleton: boolean;
  onToggleSkeleton: () => void;
}

export default function ControlPanel({
  isActive,
  onToggleCamera,
  showLandmarks,
  onToggleLandmarks,
  showSkeleton,
  onToggleSkeleton
}: ControlPanelProps) {
  return (
    <div className="glass-card p-4 flex items-center justify-between border-foreground/10 shadow-xl">
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleCamera}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition-all",
            isActive ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-primary text-black hover:bg-primary/90"
          )}
        >
          {isActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          <span>{isActive ? 'Stop Camera' : 'Start Camera'}</span>
        </button>
        
        <div className="h-8 w-[1px] bg-foreground/10 mx-2" />
        
        <div className="flex items-center space-x-1">
          <ControlButton 
            active={showLandmarks} 
            onClick={onToggleLandmarks} 
            icon={showLandmarks ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
            label="Landmarks"
          />
          <ControlButton 
            active={showSkeleton} 
            onClick={onToggleSkeleton} 
            icon={<GitBranch className={cn("w-4 h-4", showSkeleton ? "text-primary" : "")} />} 
            label="Skeleton"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all" title="Capture Frame">
          <Save className="w-5 h-5" />
        </button>
        <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all" title="Record Session">
          <Video className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ControlButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all",
        active ? "bg-foreground/10 text-foreground" : "text-foreground/40 hover:bg-foreground/5"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
