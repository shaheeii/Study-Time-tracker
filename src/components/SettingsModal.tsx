/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, Volume2, Database, Trash2, Sliders, RefreshCw, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div 
        className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-primary stroke-[2px]" />
            <h3 className="font-sans text-md font-bold text-slate-800">
              Settings & Config
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all duration-150 rounded-full cursor-pointer"
            title="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 flex flex-col gap-7 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          {/* Target Daily Minutes */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs font-bold text-slate-600 uppercase tracking-wide">
                Daily Study Target
              </span>
              <span className="font-mono text-sm font-bold text-primary">
                {settings.dailyTargetMinutes} mins
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="240"
              step="15"
              value={settings.dailyTargetMinutes}
              onChange={(e) => updateSettings({ dailyTargetMinutes: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase mt-0.5">
              <span>15m</span>
              <span>1h</span>
              <span>2h</span>
              <span>3h</span>
              <span>4h</span>
            </div>
          </div>

          {/* Audio controls */}
          <div className="flex flex-col gap-3.5">
            <span className="font-sans text-xs font-bold text-slate-600 uppercase tracking-wide">
              Audio Focus Preferences
            </span>
            
            {/* Chime sound */}
            <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
              <div className="flex flex-col gap-1">
                <span className="font-sans text-xs font-bold text-slate-800">
                  Ambient Chime Sound
                </span>
                <span className="font-sans text-[11px] text-slate-400 font-medium">
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
                  settings.soundEnabled ? 'bg-primary' : 'bg-slate-200'
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
                <span className="font-sans text-xs font-bold text-slate-800">
                  Metronome Focus Tick
                </span>
                <span className="font-sans text-[11px] text-slate-400 font-medium">
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
                  settings.tickSoundEnabled ? 'bg-primary' : 'bg-slate-200'
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
          <div className="flex flex-col gap-3 border-t border-slate-50 pt-5">
            <span className="font-sans text-xs font-bold text-slate-600 uppercase tracking-wide">
              App Accent Color
            </span>
            <div className="flex gap-3.5 mt-1.5">
              {(['blue', 'indigo', 'emerald', 'slate'] as const).map((color) => {
                const colorsMap = {
                  blue: 'bg-blue-500 ring-blue-100',
                  indigo: 'bg-indigo-500 ring-indigo-100',
                  emerald: 'bg-emerald-500 ring-emerald-100',
                  slate: 'bg-slate-600 ring-slate-200',
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
          <div className="flex flex-col gap-3.5 border-t border-slate-50 pt-5">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Database size={15} />
              <span className="font-sans text-xs font-bold uppercase tracking-wide">
                Demo & Playground Data
              </span>
            </div>
            <p className="font-sans text-[11px] text-slate-400 leading-relaxed font-medium">
              Want to see what the stats graphs and historical tables look like immediately? Click the button below to seed 15 realistic study sessions.
            </p>
            <button
              onClick={handleSeedData}
              className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 border border-slate-100 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} className="text-primary" />
              <span>Seed Mock Study History</span>
            </button>
          </div>

          {/* Danger zone */}
          <div className="flex flex-col gap-3.5 border-t border-red-50 pt-5">
            <span className="font-sans text-xs font-bold text-red-500 uppercase tracking-wide">
              Danger Zone
            </span>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 bg-red-50/40 hover:bg-red-50 border border-red-100 text-red-600 hover:text-red-700 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
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
