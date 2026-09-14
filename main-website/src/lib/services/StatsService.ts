'use client';

export interface PracticeSession {
  id: string;
  mudraId: string;
  mudraName: string;
  accuracy: number;
  duration: number; // in seconds
  timestamp: number;
  energyLevel?: number;
}

export interface UserStats {
  totalPracticeTime: number; // in seconds
  totalSessions: number;
  averageAccuracy: number;
  longestStreak: number;
  masteredMudras: string[]; // slug list
}

const STORAGE_KEYS = {
  SESSIONS: 'nv_sessions',
  STATS: 'nv_user_stats'
};

export class StatsService {
  static saveSession(session: Omit<PracticeSession, 'id' | 'timestamp'>) {
    if (typeof window === 'undefined') return;

    const newSession: PracticeSession = {
      ...session,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now()
    };

    const existingSessions = this.getSessions();
    const updatedSessions = [newSession, ...existingSessions];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updatedSessions));

    // Update global stats
    this.updateGlobalStats(newSession);
    return newSession;
  }

  static getSessions(): PracticeSession[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : [];
  }

  static getStats(): UserStats {
    if (typeof window === 'undefined') return this.getInitialStats();
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    return saved ? JSON.parse(saved) : this.getInitialStats();
  }

  private static updateGlobalStats(newSession: PracticeSession) {
    const stats = this.getStats();
    const sessions = this.getSessions();

    const totalPracticeTime = stats.totalPracticeTime + newSession.duration;
    const totalSessions = stats.totalSessions + 1;
    const averageAccuracy = Math.round(
      sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length
    );

    const masteredMudras = new Set(stats.masteredMudras);
    if (newSession.accuracy >= 90) {
      masteredMudras.add(newSession.mudraId);
    }

    const updatedStats: UserStats = {
      ...stats,
      totalPracticeTime,
      totalSessions,
      averageAccuracy,
      masteredMudras: Array.from(masteredMudras)
    };

    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updatedStats));
  }

  private static getInitialStats(): UserStats {
    return {
      totalPracticeTime: 0,
      totalSessions: 0,
      averageAccuracy: 0,
      longestStreak: 0,
      masteredMudras: []
    };
  }

  static clearAll() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.STATS);
  }
}
