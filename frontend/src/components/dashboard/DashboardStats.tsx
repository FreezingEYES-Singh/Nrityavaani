'use client';

import React from 'react';
import { Activity, Target, Clock, Trophy } from 'lucide-react';

import { StatsService, UserStats } from '@/lib/services/StatsService';
import { MUDRAS } from '@/lib/constants/mudras';

export default function DashboardStats() {
  const [stats, setStats] = React.useState<UserStats | null>(null);

  React.useEffect(() => {
    setStats(StatsService.getStats());
  }, []);

  if (!stats) return null;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Activity className="text-primary" />}
          label="Total Sessions"
          value={stats.totalSessions.toString()}
          trend={stats.totalSessions > 0 ? "Real-time activity" : "No sessions yet"}
        />
        <StatCard 
          icon={<Target className="text-accent-violet" />}
          label="Avg. Accuracy"
          value={`${stats.averageAccuracy}%`}
          trend={stats.totalSessions > 0 ? "Lifetime performance" : "Start practicing"}
        />
        <StatCard 
          icon={<Clock className="text-accent-cyan" />}
          label="Practice Time"
          value={formatTime(stats.totalPracticeTime)}
          trend="Total duration"
        />
        <StatCard 
          icon={<Trophy className="text-accent-gold" />}
          label="Mudras Mastered"
          value={`${stats.masteredMudras.length}/${MUDRAS.length}`}
          trend="90%+ required"
        />
      </div>

      {stats.totalSessions > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progress Chart Placeholder - In a real app we'd map history here */}
          <div className="glass-card p-6 min-h-[400px]">
            <h3 className="text-lg font-bold mb-8 flex items-center space-x-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <span>Weekly Accuracy Trend</span>
            </h3>
            <div className="h-[300px] w-full flex items-center justify-center text-foreground/20 italic">
               Interactive trend chart will populate as you practice daily.
            </div>
          </div>

          <div className="glass-card p-6 min-h-[400px]">
            <h3 className="text-lg font-bold mb-8 flex items-center space-x-2">
              <span className="w-2 h-2 bg-accent-cyan rounded-full" />
              <span>Session Frequency</span>
            </h3>
            <div className="h-[300px] w-full flex items-center justify-center text-foreground/20 italic">
               Session data being tracked locally.
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-20 text-center border-dashed border-foreground/10">
           <Trophy className="w-16 h-16 text-foreground/10 mx-auto mb-6" />
           <h3 className="text-2xl font-black mb-2 italic">Begin Your Journey</h3>
           <p className="text-foreground/30 max-w-md mx-auto mb-8">You haven&rsquo;t recorded any practice sessions yet. Start your first live detection session to see your progress here.</p>
           <button 
             onClick={() => window.location.href = '/live'}
             className="premium-button px-10"
           >
             Go to Live Detection
           </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="glass-card p-6 border-foreground/5 hover:border-foreground/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-foreground/40 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-foreground mb-2">{value}</h4>
      <p className="text-[10px] text-primary/60 font-medium">{trend}</p>
    </div>
  );
}
