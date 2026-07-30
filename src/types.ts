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
  themeMode?: 'light' | 'dark';
}

export interface Quote {
  text: string;
  author: string;
}

export interface UserProfile {
  name: string;
  password?: string;
  avatarUrl: string;
  bio: string;
  isLoggedIn: boolean;
  role?: 'admin' | 'user';
  createdAt?: string;
  lastLoginAt?: string;
  loginCount?: number;
}

export interface LoginLogEvent {
  id: string;
  userId: string;
  username: string;
  timestamp: string; // ISO String
  ipAddress?: string;
  userAgent?: string;
  status: 'Success' | 'Failed';
  failureReason?: string;
}
