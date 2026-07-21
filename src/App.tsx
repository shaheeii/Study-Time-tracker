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
import { StudySession, AtmosphereMood, AppSettings, StreakInfo } from './types';
import { calculateStreak, generateInitialMockSessions, sound } from './utils';

const DEFAULT_SETTINGS: AppSettings = {
  dailyTargetMinutes: 60,
  soundEnabled: true,
  tickSoundEnabled: false,
  themeColor: 'blue',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'timer' | 'stats'>('timer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMood, setActiveMood] = useState<AtmosphereMood>('Deep Focus');

  // Load state from localStorage or initialize with demo seed data
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('focusflow_sessions_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sessions, seeding default demo data', e);
      }
    }
    // Automatically pre-populate gorgeous, realistic study records on first load!
    const demoData = generateInitialMockSessions();
    localStorage.setItem('focusflow_sessions_v1', JSON.stringify(demoData));
    return demoData;
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

  // Active Timer States
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [currentRunStartTime, setCurrentRunStartTime] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [activeTopic, setActiveTopic] = useState('');

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('focusflow_sessions_v1', JSON.stringify(sessions));
  }, [sessions]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('focusflow_settings_v1', JSON.stringify(settings));
  }, [settings]);

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
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setActiveSeconds(0);
    setAccumulatedSeconds(0);
    setCurrentRunStartTime(null);
    setActiveTopic('');
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
          />
        )}
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
      />
    </div>
  );
}
