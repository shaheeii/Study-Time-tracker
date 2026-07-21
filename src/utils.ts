/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudySession, StreakInfo } from './types';

// Convert seconds to HH:MM:SS
export function formatSecondsToHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => (v < 10 ? `0${v}` : `${v}`)).join(':');
}

// Convert seconds to Xh Ym
export function formatSecondsToHM(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// Get dates for last 7 days (including today)
export function getLast7Days(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toDateString());
  }
  return dates;
}

// Group sessions by day of week for last 7 days
export function get7DayActivity(sessions: StudySession[]): { day: string; seconds: number; height: string }[] {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sunday to Saturday or match layout (M, T, W, T, F, S, S)
  // Let's use Monday to Sunday as in the HTML/image: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Calculate date objects for Monday to Sunday of the current week (or last 7 days)
  // To make it super simple, let's get the last 7 days and group by their short day names
  const last7 = getLast7Days(); // Array of 7 date strings, ending today
  
  const activity = last7.map((dateStr) => {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString([], { weekday: 'short' }).substring(0, 1);
    
    // Sum duration of completed sessions on this date
    const daySessions = sessions.filter(
      (s) => new Date(s.timestamp).toDateString() === dateStr && s.status === 'Completed'
    );
    const totalSeconds = daySessions.reduce((sum, s) => sum + s.duration, 0);
    
    return {
      day: dayName,
      seconds: totalSeconds,
      dateString: dateStr,
    };
  });
  
  const maxSeconds = Math.max(...activity.map((a) => a.seconds), 3600); // at least 1hr scale to avoid division by 0
  
  return activity.map((a) => {
    const pct = Math.min(Math.round((a.seconds / maxSeconds) * 100), 100);
    return {
      day: a.day,
      seconds: a.seconds,
      height: `${Math.max(pct, 5)}%`, // at least 5% visual bar height
    };
  });
}

// Calculate streak info from study sessions
export function calculateStreak(sessions: StudySession[]): StreakInfo {
  const completedSessions = sessions.filter((s) => s.status === 'Completed');
  if (completedSessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
  }

  // Get unique local dates (YYYY-MM-DD)
  const uniqueDates = Array.from(
    new Set(
      completedSessions.map((s) => {
        const d = new Date(s.timestamp);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
  }

  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));

  let currentStreak = 0;
  let longestStreak = 0;

  // Verify if they studied today or yesterday to continue streak
  const hasStudiedToday = uniqueDates.includes(todayStr);
  const hasStudiedYesterday = uniqueDates.includes(yesterdayStr);

  if (hasStudiedToday || hasStudiedYesterday) {
    let checkDate = hasStudiedToday ? new Date() : new Date(Date.now() - 86400000);
    let checkStr = getLocalDateString(checkDate);

    while (uniqueDates.includes(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = getLocalDateString(checkDate);
    }
  }

  // Calculate longest streak historically
  let tempStreak = 0;
  let prevDate: Date | null = null;

  // Sort uniqueDates ascending for chronological check
  const chronologicalDates = [...uniqueDates].reverse();

  for (const dateStr of chronologicalDates) {
    const currentDate = new Date(dateStr + 'T12:00:00'); // Use mid-day to avoid TZ shifts
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = currentDate;
  }

  // Make sure longest is at least current
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastStudyDate: uniqueDates[0] || null,
  };
}

function getLocalDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Generate realistic mock study sessions for initial demo state
export function generateInitialMockSessions(): StudySession[] {
  const sessions: StudySession[] = [];
  const topics = [
    'Advanced Calculus',
    'UI Design Systems',
    'Deep Work Reading',
    'Quantum Physics Intro',
    'JavaScript - Promises',
    'Data Structures & Algorithms',
    'Aesthetic Typography Pairing',
  ];

  const now = Date.now();
  // We want to create around 15 mock sessions spanning the last 10 days
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 9); // 0 to 8 days ago
    const topic = topics[i % topics.length];
    
    // Duration between 15 mins (900s) and 90 mins (5400s)
    const duration = Math.floor(Math.random() * (5400 - 900) + 900);
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 4 * 60 * 60 * 1000);
    
    sessions.push({
      id: `mock-${i}-${Date.now()}-${Math.random()}`,
      topic,
      duration,
      timestamp: date.toISOString(),
      status: 'Completed',
    });
  }

  // Sort sessions: newest first
  return sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// Web Audio API Sound Synthesizer
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a soft, beautiful ambient chime (crystal glass bell)
  playBell() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      // Soft Sine wave mixed with subtle triangle for crystal overtone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5 Note

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 1.3);

      // Play a second overtone slightly delayed for a richer chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.05); // G5 (Perfect fifth)
      gain2.gain.setValueAtTime(0, this.ctx.currentTime + 0.05);
      gain2.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);
      osc2.start(this.ctx.currentTime + 0.05);
      osc2.stop(this.ctx.currentTime + 1.0);

    } catch (e) {
      console.warn('Audio synthesis failed or blocked by browser policy', e);
    }
  }

  // Play a gentle wood click (tick-tock)
  playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      // Squelch audio errors
    }
  }

  // Play a soft digital success chirp
  playChirp() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, this.ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.15); // E5

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      // Squelch
    }
  }
}

export const sound = new SoundSynthesizer();
