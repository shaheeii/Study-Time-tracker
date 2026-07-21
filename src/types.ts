/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StudySession {
  id: string;
  topic: string;
  duration: number; // in seconds
  timestamp: string; // ISO String
  status: 'Completed' | 'Paused';
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null; // YYYY-MM-DD
}

export type AtmosphereMood = 'Deep Focus' | 'Calm Mind' | 'Creative Flow' | 'Light Study';

export interface AppSettings {
  dailyTargetMinutes: number;
  soundEnabled: boolean;
  tickSoundEnabled: boolean;
  themeColor: 'blue' | 'indigo' | 'slate' | 'emerald';
}

export interface Quote {
  text: string;
  author: string;
}
