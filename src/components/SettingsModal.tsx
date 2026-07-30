/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, Volume2, Database, Trash2, Sliders, RefreshCw, Sparkles, Sun, Moon } from 'lucide-react';
import { AppSettings } from '../types';
import { sound } from '../utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  onPopulateMockData: () => void;
  onClearData: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  updateSettings,
  onPopulateMockData,
  onClearData,
}: SettingsModalProps) {
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSeedData = () => {
    if (window.confirm('This will append mock study logs to demonstrate charts and insights. Continue?')) {
      onPopulateMockData();
      sound.playChirp();
      alert('Mock study history successfully seeded!');
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'WARNING: This will permanently delete all your study history, streaks, and custom settings. This action is irreversible. Continue?'
      )
    ) {
      onClearData();
      sound.playBell();
      alert('FocusFlow has been reset to its default state.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-primary stroke-[2px]" />
            <h3 className="font-sans text-md font-bold text-slate-800 dark:text-slate-100">
              Settings & Config
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all duration-150 rounded-full cursor-pointer"
            title="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 flex flex-col gap-7 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          {/* Theme Mode Toggle (Light / Dark) */}
          <div className="flex flex-col gap-3">
            <span className="font-sans text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Theme Mode Appearance
            </span>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                onClick={() => {
                  updateSettings({ themeMode: 'light' });
                  sound.playChirp();
                }}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs transition-all duration-200 border cursor-pointer ${
                  (settings.themeMode || 'light') === 'light'
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sun size={16} className="text-amber-500" />
                <span>Light Mode</span>
              </button>
              <button
                onClick={() => {
                  updateSettings({ themeMode: 'dark' });
                  sound.playChirp();
                }}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs transition-all duration-200 border cursor-pointer ${
                  settings.themeMode === 'dark'
                    ? 'bg-primary/20 border-primary text-primary shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon size={16} className="text-indigo-400" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Target Daily Minutes / Hours */}
          <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Daily Study Target
              </span>
              <span className="font-mono text-sm font-bold text-primary">
                {settings.dailyTargetMinutes >= 60 
                  ? `${(settings.dailyTargetMinutes / 60).toFixed(settings.dailyTargetMinutes % 60 === 0 ? 0 : 1)} hr` 
                  : `${settings.dailyTargetMinutes} mins`}
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">
                  ({settings.dailyTargetMinutes} mins)
                </span>
              </span>
            </div>

            {/* Quick Target Hours Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '2 hr', minutes: 120 },
                { label: '4 hr', minutes: 240 },
                { label: '8 hr', minutes: 480 },
                { label: '10 hr', minutes: 600 },
              ].map((preset) => {
                const isActive = settings.dailyTargetMinutes === preset.minutes;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => updateSettings({ dailyTargetMinutes: preset.minutes })}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Fine-tune Range Slider */}
            <input
              type="range"
              min="30"
              max="600"
              step="30"
              value={settings.dailyTargetMinutes}
              onChange={(e) => updateSettings({ dailyTargetMinutes: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary mt-1"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase mt-0.5">
              <span>30m</span>
              <span>2h</span>
              <span>4h</span>
              <span>6h</span>
              <span>8h</span>
              <span>10h</span>
            </div>
          </div>

          {/* Audio controls */}
          <div className="flex flex-col gap-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <span className="font-sans text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Audio Focus Preferences
            </span>
            
            {/* Chime sound */}
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex flex-col gap-1">
                <span className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ambient Chime Sound
                </span>
                <span className="font-sans text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Play a soft crystal glass bell on session end
                </span>
              </div>
              <button
                onClick={() => {
                  const val = !settings.soundEnabled;
                  updateSettings({ soundEnabled: val });
                  if (val) sound.playBell();
                }}
                className={`w-11 h-6 rounded-full transition-all duration-200 cursor-pointer relative shrink-0 ${
                  settings.soundEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-sm ${
                    settings.soundEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Metronome focus ticking */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex flex-col gap-1">
                <span className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200">
                  Metronome Focus Tick
                </span>
                <span className="font-sans text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Subtle wood click sound every second when active
                </span>
              </div>
              <button
                onClick={() => {
                  const val = !settings.tickSoundEnabled;
                  updateSettings({ tickSoundEnabled: val });
                  if (val) sound.playTick();
                }}
                className={`w-11 h-6 rounded-full transition-all duration-200 cursor-pointer relative shrink-0 ${
                  settings.tickSoundEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-sm ${
                    settings.tickSoundEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Accent Theme Selection */}
          <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <span className="font-sans text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              App Accent Color
            </span>
            <div className="flex gap-3.5 mt-1.5">
              {(['blue', 'indigo', 'emerald', 'slate'] as const).map((color) => {
                const colorsMap = {
                  blue: 'bg-blue-500 ring-blue-100 dark:ring-blue-900',
                  indigo: 'bg-indigo-500 ring-indigo-100 dark:ring-indigo-900',
                  emerald: 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900',
                  slate: 'bg-slate-600 ring-slate-200 dark:ring-slate-700',
                };
                return (
                  <button
                    key={color}
                    onClick={() => {
                      updateSettings({ themeColor: color });
                      sound.playChirp();
                    }}
                    className={`w-8 h-8 rounded-full transition-all duration-200 cursor-pointer ${colorsMap[color]} ${
                      settings.themeColor === color
                        ? 'scale-110 ring-4'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={`${color} theme`}
                  />
                );
              })}
            </div>
          </div>

          {/* Seed / Demonstration Mode */}
          <div className="flex flex-col gap-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Database size={15} />
              <span className="font-sans text-xs font-bold uppercase tracking-wide">
                Demo & Playground Data
              </span>
            </div>
            <p className="font-sans text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              Want to see what the stats graphs and historical tables look like immediately? Click the button below to seed 15 realistic study sessions.
            </p>
            <button
              onClick={handleSeedData}
              className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-primary/5 hover:text-primary dark:hover:text-primary hover:border-primary/20 border border-slate-100 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} className="text-primary" />
              <span>Seed Mock Study History</span>
            </button>
          </div>

          {/* Danger zone */}
          <div className="flex flex-col gap-3.5 border-t border-red-50 dark:border-red-950/40 pt-5">
            <span className="font-sans text-xs font-bold text-red-500 uppercase tracking-wide">
              Danger Zone
            </span>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Clear History & Reset App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
