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

const getSavedUserState = (): SavedUserState | null => {
  try {
    const saved = localStorage.getItem(USER_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse user state', e);
  }
  return null;
};

export default function App() {
  const initialUserState = getSavedUserState();

  const [activeTab, setActiveTab] = useState<'timer' | 'stats'>(
    initialUserState?.activeTab || 'timer'
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMood, setActiveMood] = useState<AtmosphereMood>(
    initialUserState?.activeMood || 'Deep Focus'
  );

  // Load state from localStorage or initialize with empty array for a fresh dashboard
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('focusflow_sessions_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sessions, using empty list', e);
      }
    }
    return [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('focusflow_settings_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings, using defaults', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

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

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'login' | 'edit' | 'view'>('view');

  // Active Timer States (persisted across site close/reload)
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

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('focusflow_sessions_v1', JSON.stringify(sessions));
  }, [sessions]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('focusflow_settings_v1', JSON.stringify(settings));
  }, [settings]);

  // Save user profile whenever it changes
  useEffect(() => {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
  }, [userProfile]);

  const updateUserProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updated }));
    sound.playChirp();
  };

  const handleLogout = () => {
    setUserProfile((prev) => ({ ...prev, isLoggedIn: false }));
    sound.playChirp();
  };

  const openProfileModal = (mode: 'login' | 'edit' | 'view') => {
    setProfileModalMode(mode);
    setIsProfileModalOpen(true);
  };

  // Auto-save active timer and user selections so running timer and data are never lost when closing the site
  useEffect(() => {
    const stateToSave: SavedUserState = {
      activeMood,
      activeTopic,
      isTimerRunning,
      isTimerPaused,
      accumulatedSeconds,
      currentRunStartTime,
      activeTab,
    };
    localStorage.setItem(USER_STATE_KEY, JSON.stringify(stateToSave));
  }, [activeMood, activeTopic, isTimerRunning, isTimerPaused, accumulatedSeconds, currentRunStartTime, activeTab]);

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
    setSessions([]);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('focusflow_sessions_v1');
    localStorage.removeItem('focusflow_settings_v1');
    localStorage.removeItem(USER_STATE_KEY);
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
