/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TimerCard from './components/TimerCard';
import StatsDashboard from './components/StatsDashboard';
import SettingsModal from './components/SettingsModal';
import FloatingTimer from './components/FloatingTimer';
import UserProfileModal from './components/UserProfileModal';
import { StudySession, AtmosphereMood, AppSettings, StreakInfo, UserProfile } from './types';
import { calculateStreak, generateInitialMockSessions, sound } from './utils';

const DEFAULT_SETTINGS: AppSettings = {
  dailyTargetMinutes: 60,
  soundEnabled: true,
  tickSoundEnabled: false,
  themeColor: 'blue',
};

const USER_PROFILE_KEY = 'focusflow_user_profile_v1';
const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Focus Scholar',
  avatarUrl: '/shaheem.png',
  bio: 'Chasing digital silence and productivity.',
  isLoggedIn: false,
};

const USER_STATE_KEY = 'focusflow_user_state_v1';

interface SavedUserState {
  activeMood?: AtmosphereMood;
  activeTopic?: string;
  isTimerRunning?: boolean;
  isTimerPaused?: boolean;
  accumulatedSeconds?: number;
  currentRunStartTime?: number | null;
  activeTab?: 'timer' | 'stats';
}

const getUserId = (profile?: UserProfile | null): string => {
  if (!profile || !profile.isLoggedIn || !profile.name || !profile.name.trim()) {
    return 'guest';
  }
  return 'user_' + profile.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
};

const getSavedUserState = (userId: string): SavedUserState | null => {
  try {
    const saved = localStorage.getItem(`${USER_STATE_KEY}_${userId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    const legacy = localStorage.getItem(USER_STATE_KEY);
    if (legacy) {
      localStorage.setItem(`${USER_STATE_KEY}_${userId}`, legacy);
      localStorage.removeItem(USER_STATE_KEY);
      return JSON.parse(legacy);
    }
  } catch (e) {
    console.error('Failed to parse user state', e);
  }
  return null;
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(USER_PROFILE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }
    return DEFAULT_USER_PROFILE;
  });

  const initialUserId = getUserId(userProfile);
  const initialUserState = getSavedUserState(initialUserId);

  const [activeTab, setActiveTab] = useState<'timer' | 'stats'>(
    initialUserState?.activeTab || 'timer'
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMood, setActiveMood] = useState<AtmosphereMood>(
    initialUserState?.activeMood || 'Deep Focus'
  );

  // Load state from isolated localStorage or migrate legacy data without merging
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem(`focusflow_sessions_v1_${initialUserId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sessions, using empty list', e);
      }
    } else {
      const legacy = localStorage.getItem('focusflow_sessions_v1');
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          localStorage.setItem(`focusflow_sessions_v1_${initialUserId}`, legacy);
          localStorage.removeItem('focusflow_sessions_v1');
          return parsed;
        } catch (e) {
          console.error('Failed to migrate legacy sessions', e);
        }
      }
    }
    return [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(`focusflow_settings_v1_${initialUserId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings, using defaults', e);
      }
    } else {
      const legacy = localStorage.getItem('focusflow_settings_v1');
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          localStorage.setItem(`focusflow_settings_v1_${initialUserId}`, legacy);
          localStorage.removeItem('focusflow_settings_v1');
          return parsed;
        } catch (e) {
          console.error('Failed to migrate legacy settings', e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'login' | 'edit' | 'view'>('view');

  // Active Timer States (persisted across site close/reload per user)
  const [activeTopic, setActiveTopic] = useState(initialUserState?.activeTopic || '');
  const [isTimerRunning, setIsTimerRunning] = useState(Boolean(initialUserState?.isTimerRunning));
  const [isTimerPaused, setIsTimerPaused] = useState(Boolean(initialUserState?.isTimerPaused));
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(initialUserState?.accumulatedSeconds || 0);
  const [currentRunStartTime, setCurrentRunStartTime] = useState<number | null>(
    initialUserState?.currentRunStartTime ?? null
  );
  const [activeSeconds, setActiveSeconds] = useState(() => {
    if (initialUserState?.isTimerRunning) {
      if (initialUserState?.isTimerPaused || !initialUserState?.currentRunStartTime) {
        return initialUserState.accumulatedSeconds || 0;
      }
      const elapsed = Math.floor((Date.now() - initialUserState.currentRunStartTime) / 1000);
      return (initialUserState.accumulatedSeconds || 0) + Math.max(0, elapsed);
    }
    return 0;
  });
  const [pipTrigger, setPipTrigger] = useState(0);

  // Save sessions to isolated localStorage whenever they change
  useEffect(() => {
    const userId = getUserId(userProfile);
    localStorage.setItem(`focusflow_sessions_v1_${userId}`, JSON.stringify(sessions));
  }, [sessions, userProfile]);

  // Save settings to isolated localStorage whenever they change
  useEffect(() => {
    const userId = getUserId(userProfile);
    localStorage.setItem(`focusflow_settings_v1_${userId}`, JSON.stringify(settings));
  }, [settings, userProfile]);

  // Save user profile whenever it changes
  useEffect(() => {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
  }, [userProfile]);

  const switchUser = (newProfile: UserProfile) => {
    const oldUserId = getUserId(userProfile);
    const newUserId = getUserId(newProfile);

    // 1. Save current user's active timer & data before switching
    const stateToSave: SavedUserState = {
      activeMood,
      activeTopic,
      isTimerRunning,
      isTimerPaused,
      accumulatedSeconds,
      currentRunStartTime,
      activeTab,
    };
    localStorage.setItem(`${USER_STATE_KEY}_${oldUserId}`, JSON.stringify(stateToSave));
    localStorage.setItem(`focusflow_sessions_v1_${oldUserId}`, JSON.stringify(sessions));
    localStorage.setItem(`focusflow_settings_v1_${oldUserId}`, JSON.stringify(settings));

    // 2. If switching to a different user, load their isolated sessions without merging
    if (oldUserId !== newUserId) {
      let targetSessions: StudySession[] = [];
      const savedSessions = localStorage.getItem(`focusflow_sessions_v1_${newUserId}`);
      if (savedSessions) {
        try { targetSessions = JSON.parse(savedSessions); } catch (e) {}
      }

      let targetSettings: AppSettings = DEFAULT_SETTINGS;
      const savedSettings = localStorage.getItem(`focusflow_settings_v1_${newUserId}`);
      if (savedSettings) {
        try { targetSettings = JSON.parse(savedSettings); } catch (e) {}
      }

      let targetState: SavedUserState | null = null;
      const savedState = localStorage.getItem(`${USER_STATE_KEY}_${newUserId}`);
      if (savedState) {
        try { targetState = JSON.parse(savedState); } catch (e) {}
      }

      setSessions(targetSessions);
      setSettings(targetSettings);
      setActiveMood(targetState?.activeMood || 'Deep Focus');
      setActiveTopic(targetState?.activeTopic || '');
      setIsTimerRunning(Boolean(targetState?.isTimerRunning));
      setIsTimerPaused(Boolean(targetState?.isTimerPaused));
      setAccumulatedSeconds(targetState?.accumulatedSeconds || 0);
      setCurrentRunStartTime(targetState?.currentRunStartTime ?? null);

      if (targetState?.isTimerRunning) {
        if (targetState?.isTimerPaused || !targetState?.currentRunStartTime) {
          setActiveSeconds(targetState.accumulatedSeconds || 0);
        } else {
          const elapsed = Math.floor((Date.now() - targetState.currentRunStartTime) / 1000);
          setActiveSeconds((targetState.accumulatedSeconds || 0) + Math.max(0, elapsed));
        }
      } else {
        setActiveSeconds(targetState?.accumulatedSeconds || 0);
      }
    }

    // 3. Update active profile and register in users database if logged in
    setUserProfile(newProfile);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
    if (newProfile.isLoggedIn && newProfile.name) {
      const dbKey = 'focusflow_users_db_v1';
      let usersDb: Record<string, UserProfile> = {};
      try {
        usersDb = JSON.parse(localStorage.getItem(dbKey) || '{}');
      } catch (e) {}
      usersDb[newUserId] = newProfile;
      localStorage.setItem(dbKey, JSON.stringify(usersDb));
    }

    sound.playChirp();
  };

  const updateUserProfile = (updated: Partial<UserProfile>) => {
    const newProfile = { ...userProfile, ...updated };
    switchUser(newProfile);
  };

  const handleLogout = () => {
    const guestProfile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      isLoggedIn: false,
    };
    switchUser(guestProfile);
  };

  const openProfileModal = (mode: 'login' | 'edit' | 'view') => {
    setProfileModalMode(mode);
    setIsProfileModalOpen(true);
  };

  // Auto-save active timer and user selections strictly isolated by user ID
  useEffect(() => {
    const userId = getUserId(userProfile);
    const stateToSave: SavedUserState = {
      activeMood,
      activeTopic,
      isTimerRunning,
      isTimerPaused,
      accumulatedSeconds,
      currentRunStartTime,
      activeTab,
    };
    localStorage.setItem(`${USER_STATE_KEY}_${userId}`, JSON.stringify(stateToSave));
  }, [activeMood, activeTopic, isTimerRunning, isTimerPaused, accumulatedSeconds, currentRunStartTime, activeTab, userProfile]);

  // Central Timer Interval engine
  useEffect(() => {
    let intervalId: any = null;
    if (isTimerRunning && !isTimerPaused && currentRunStartTime !== null) {
      const updateTimerValue = () => {
        const elapsedSinceStart = Math.floor((Date.now() - currentRunStartTime) / 1000);
        setActiveSeconds(accumulatedSeconds + elapsedSinceStart);
        // Metronome tick sound if enabled
        if (settings.tickSoundEnabled) {
          sound.playTick();
        }
      };

      updateTimerValue(); // Run immediately

      // Poll frequently (every 200ms) to bypass browser background tab throttling
      // while guaranteeing that the time is computed from the system clock
      intervalId = setInterval(updateTimerValue, 200);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTimerRunning, isTimerPaused, currentRunStartTime, accumulatedSeconds, settings.tickSoundEnabled]);

  // Calculate Streak Info dynamically from sessions
  const streakInfo = calculateStreak(sessions);

  // Timer callbacks
  const startTimer = (): boolean => {
    if (!activeTopic.trim()) {
      return false;
    }
    setActiveSeconds(0);
    setAccumulatedSeconds(0);
    setCurrentRunStartTime(Date.now());
    setIsTimerRunning(true);
    setIsTimerPaused(false);
    if (settings.soundEnabled) {
      sound.playBell();
    }
    setPipTrigger(Date.now());
    return true;
  };

  const pauseTimer = () => {
    if (currentRunStartTime !== null) {
      const elapsed = Math.floor((Date.now() - currentRunStartTime) / 1000);
      const newAccumulated = accumulatedSeconds + elapsed;
      setAccumulatedSeconds(newAccumulated);
      setActiveSeconds(newAccumulated);
    }
    setCurrentRunStartTime(null);
    setIsTimerPaused(true);
    sound.playChirp();
  };

  const resumeTimer = () => {
    setCurrentRunStartTime(Date.now());
    setIsTimerPaused(false);
    sound.playChirp();
  };

  const stopAndSaveTimer = () => {
    let finalSeconds = activeSeconds;
    if (currentRunStartTime !== null) {
      const elapsed = Math.floor((Date.now() - currentRunStartTime) / 1000);
      finalSeconds = accumulatedSeconds + elapsed;
    }

    if (finalSeconds >= 3) {
      // Save session if at least 3 seconds
      const newSession: StudySession = {
        id: `session-${Date.now()}-${Math.random()}`,
        topic: activeTopic.trim() || 'Untitled Focus Session',
        duration: finalSeconds,
        timestamp: new Date().toISOString(),
        status: 'Completed',
      };
      setSessions((prev) => [newSession, ...prev]);
      if (settings.soundEnabled) {
        sound.playBell();
      }
    } else {
      // Reset without saving if too short
      sound.playChirp();
    }

    // Reset state
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setActiveSeconds(0);
    setAccumulatedSeconds(0);
    setCurrentRunStartTime(null);
    setActiveTopic('');
    setPipTrigger(0);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setActiveSeconds(0);
    setAccumulatedSeconds(0);
    setCurrentRunStartTime(null);
    setActiveTopic('');
    setPipTrigger(0);
    sound.playChirp();
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePopulateMockData = () => {
    const mockData = generateInitialMockSessions();
    setSessions((prev) => [...mockData, ...prev].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
  };

  const handleClearData = () => {
    const userId = getUserId(userProfile);
    setSessions([]);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(`focusflow_sessions_v1_${userId}`);
    localStorage.removeItem(`focusflow_settings_v1_${userId}`);
    localStorage.removeItem(`${USER_STATE_KEY}_${userId}`);
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setActiveSeconds(0);
    setAccumulatedSeconds(0);
    setCurrentRunStartTime(null);
    setActiveTopic('');
    setPipTrigger(0);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Map dynamic accent class values
  const themeClasses: Record<'blue' | 'indigo' | 'emerald' | 'slate', string> = {
    blue: '[--color-primary:#0058be] [--color-primary-container:#2170e4]',
    indigo: '[--color-primary:#4f46e5] [--color-primary-container:#6366f1]',
    emerald: '[--color-primary:#059669] [--color-primary-container:#10b981]',
    slate: '[--color-primary:#475569] [--color-primary-container:#64748b]',
  };

  return (
    <div className={`min-h-screen bg-background text-slate-800 font-sans antialiased pb-20 md:pb-6 ${themeClasses[settings.themeColor]}`}>
      
      {/* Responsive Header & Navigation rail */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        userProfile={userProfile}
        onOpenProfileModal={openProfileModal}
      />

      {/* Main Container Stage */}
      <main className="md:ml-64 px-6 md:px-12 py-6 md:py-10 max-w-[1100px] mx-auto min-h-screen flex flex-col">
        {activeTab === 'timer' ? (
          <TimerCard
            activeSeconds={activeSeconds}
            isTimerRunning={isTimerRunning}
            isTimerPaused={isTimerPaused}
            activeTopic={activeTopic}
            setActiveTopic={setActiveTopic}
            startTimer={startTimer}
            pauseTimer={pauseTimer}
            resumeTimer={resumeTimer}
            stopAndSaveTimer={stopAndSaveTimer}
            resetTimer={resetTimer}
            sessions={sessions}
            deleteSession={deleteSession}
            streakInfo={streakInfo}
            activeMood={activeMood}
            setActiveMood={setActiveMood}
            onViewAllStats={() => setActiveTab('stats')}
          />
        ) : (
          <StatsDashboard
            sessions={sessions}
            streakInfo={streakInfo}
            deleteSession={deleteSession}
            userProfile={userProfile}
            onOpenProfileModal={openProfileModal}
          />
        )}

        {/* Copyright Footer */}
        <footer className="w-full pt-12 pb-4 mt-auto text-center text-xs font-medium text-slate-400">
          Shaheem - All right reserved 2026
        </footer>
      </main>

      {/* Settings Panel Backdrop Slider */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
        onPopulateMockData={handlePopulateMockData}
        onClearData={handleClearData}
      />

      {/* User Profile Login / Edit Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={updateUserProfile}
        onLogout={handleLogout}
        initialMode={profileModalMode}
      />

      {/* Floating Mini-Timer Controller Capsule Widget */}
      <FloatingTimer
        activeSeconds={activeSeconds}
        isTimerRunning={isTimerRunning}
        isTimerPaused={isTimerPaused}
        activeTopic={activeTopic}
        pauseTimer={pauseTimer}
        resumeTimer={resumeTimer}
        stopAndSaveTimer={stopAndSaveTimer}
        activeMood={activeMood}
        themeColor={settings.themeColor}
        maximizeToTimerTab={() => setActiveTab('timer')}
        pipTrigger={pipTrigger}
      />
    </div>
  );
}
