/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Trash2, Zap, Flame, Clock, RefreshCw, BookOpen, ChevronRight } from 'lucide-react';
import { StudySession, AtmosphereMood, StreakInfo } from '../types';
import { formatSecondsToHMS, formatSecondsToHM, sound } from '../utils';

interface TimerCardProps {
  activeSeconds: number;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  activeTopic: string;
  setActiveTopic: (topic: string) => void;
  startTimer: () => boolean; // Returns true if started, false if validation failed
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndSaveTimer: () => void;
  resetTimer: () => void;
  sessions: StudySession[];
  deleteSession: (id: string) => void;
  streakInfo: StreakInfo;
  activeMood: AtmosphereMood;
  setActiveMood: (mood: AtmosphereMood) => void;
  onViewAllStats: () => void;
}

const MOODS_CONFIG: Record<
  AtmosphereMood,
  {
    name: string;
    bgGradient: string;
    textPrimary: string;
    glowColor: string;
    quote: string;
    author: string;
  }
> = {
  'Deep Focus': {
    name: 'Deep Focus',
    bgGradient: 'from-blue-900/40 via-slate-900/60 to-slate-950/80',
    textPrimary: 'text-blue-500',
    glowColor: 'shadow-blue-500/10',
    quote: 'Concentrate all your thoughts upon the work in hand. The sun\'s rays do not burn until brought to a focus.',
    author: 'Alexander Graham Bell',
  },
  'Calm Mind': {
    name: 'Calm Mind',
    bgGradient: 'from-emerald-900/40 via-slate-900/60 to-slate-950/80',
    textPrimary: 'text-emerald-500',
    glowColor: 'shadow-emerald-500/10',
    quote: 'Rule your mind or it will rule you. Focus on the present moment with tranquil intensity.',
    author: 'Horace',
  },
  'Creative Flow': {
    name: 'Creative Flow',
    bgGradient: 'from-indigo-900/40 via-slate-900/60 to-slate-950/80',
    textPrimary: 'text-indigo-500',
    glowColor: 'shadow-indigo-500/10',
    quote: 'The desire to create is one of the deepest yearnings of the human soul. Let your thoughts flow.',
    author: 'Dieter F. Uchtdorf',
  },
  'Light Study': {
    name: 'Light Study',
    bgGradient: 'from-amber-950/30 via-slate-900/60 to-slate-950/80',
    textPrimary: 'text-amber-500',
    glowColor: 'shadow-amber-500/10',
    quote: 'Learning is the only thing the mind never exhausts, never fears, and never regrets.',
    author: 'Leonardo da Vinci',
  },
};

const RANDOM_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It is not that I am so smart, it is just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "Focus is a matter of deciding what things you are not going to do.", author: "John Carmack" },
  { text: "Your focus determines your reality.", author: "Qui-Gon Jinn" },
  { text: "Continuous effort - not strength or intelligence - is the key to unlocking our potential.", author: "Winston Churchill" },
];

export default function TimerCard({
  activeSeconds,
  isTimerRunning,
  isTimerPaused,
  activeTopic,
  setActiveTopic,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopAndSaveTimer,
  resetTimer,
  sessions,
  deleteSession,
  streakInfo,
  activeMood,
  setActiveMood,
  onViewAllStats,
}: TimerCardProps) {
  const [topicError, setTopicError] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Rotate a dynamic motivational quote every time the timer starts or resets
  useEffect(() => {
    if (!isTimerRunning) {
      setQuoteIndex(Math.floor(Math.random() * RANDOM_QUOTES.length));
    }
  }, [isTimerRunning]);

  const handleStartStop = () => {
    if (!isTimerRunning) {
      const success = startTimer();
      if (!success) {
        setTopicError(true);
        // Clear error after a short bounce duration
        setTimeout(() => setTopicError(false), 1200);
      }
    } else {
      stopAndSaveTimer();
    }
  };

  // Calculate today's study minutes
  const todayStr = new Date().toDateString();
  const todaySessions = sessions.filter(
    (s) => new Date(s.timestamp).toDateString() === todayStr && s.status === 'Completed'
  );
  const todaySeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  // Compare with yesterday's study time
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
  const yesterdaySessions = sessions.filter(
    (s) => new Date(s.timestamp).toDateString() === yesterdayStr && s.status === 'Completed'
  );
  const yesterdaySeconds = yesterdaySessions.reduce((sum, s) => sum + s.duration, 0);

  let percentageComparison = '';
  if (yesterdaySeconds > 0) {
    const diff = ((todaySeconds - yesterdaySeconds) / yesterdaySeconds) * 100;
    percentageComparison = diff >= 0 
      ? `+${Math.round(diff)}% vs yesterday` 
      : `${Math.round(diff)}% vs yesterday`;
  } else if (todaySeconds > 0) {
    percentageComparison = '+100% vs yesterday';
  } else {
    percentageComparison = 'No study yesterday';
  }

  const currentMoodConfig = MOODS_CONFIG[activeMood];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-[1100px] mx-auto pb-10">
      {/* Left Column: Timer & History */}
      <section className="lg:col-span-8 flex flex-col gap-10">
        
        {/* Main Focus Timer Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col items-center gap-8 relative overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          {/* Subtle Ambient Glow behind Timer */}
          <div className={`absolute -top-24 w-72 h-72 rounded-full blur-3xl opacity-[0.06] transition-all duration-700 pointer-events-none ${
            isTimerRunning && !isTimerPaused ? 'bg-primary scale-125' : 'bg-slate-400'
          }`} />

          {/* Topic Input Row */}
          <div className="w-full max-w-md flex flex-col gap-2 relative z-10">
            <label
              htmlFor="topic-input"
              className="text-slate-400 font-sans text-xs font-semibold tracking-wide uppercase px-1"
            >
              What are you studying?
            </label>
            <div className="relative">
              <input
                id="topic-input"
                type="text"
                placeholder="e.g., JavaScript - Promises"
                value={activeTopic}
                onChange={(e) => {
                  setActiveTopic(e.target.value);
                  if (e.target.value.trim()) setTopicError(false);
                }}
                disabled={isTimerRunning}
                className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-slate-800 font-sans font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 placeholder:text-slate-300 ${
                  topicError
                    ? 'border-red-500 animate-shake bg-red-50/10'
                    : 'border-slate-100 focus:border-primary'
                } ${isTimerRunning ? 'opacity-70 cursor-not-allowed bg-slate-100/50' : ''}`}
              />
              {topicError && (
                <span className="text-red-500 text-xs font-semibold mt-1.5 absolute -bottom-5 left-1 animate-pulse">
                  Please enter a topic to focus on!
                </span>
              )}
            </div>
          </div>

          {/* Large Clock Display */}
          <div className="flex flex-col items-center justify-center my-4 relative z-10 select-none">
            <span
              className={`font-mono text-7xl md:text-8xl tracking-tight leading-none transition-all duration-500 tabular-nums ${
                isTimerRunning && !isTimerPaused
                  ? `${currentMoodConfig.textPrimary} font-semibold timer-active-glow`
                  : 'text-slate-300 timer-glow'
              }`}
            >
              {formatSecondsToHMS(activeSeconds)}
            </span>
            {isTimerRunning && isTimerPaused && (
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-3.5 animate-pulse">
                Paused
              </span>
            )}
          </div>

          {/* Main Controls Section */}
          <div className="flex gap-4 items-center justify-center w-full relative z-10">
            {/* Reset Button */}
            <button
              onClick={() => {
                if (window.confirm('Reset timer and discard current progress?')) {
                  resetTimer();
                }
              }}
              disabled={activeSeconds === 0}
              className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 ${
                activeSeconds > 0
                  ? 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-90 cursor-pointer'
                  : 'bg-slate-50/50 border-slate-50 text-slate-200 cursor-not-allowed'
              }`}
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            {/* Start / Stop Button */}
            <button
              onClick={handleStartStop}
              className={`h-16 px-9 rounded-full font-semibold font-sans text-md flex items-center justify-center gap-3.5 shadow-lg shadow-primary/10 transition-all duration-300 active:scale-95 cursor-pointer ${
                isTimerRunning
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-primary text-on-primary hover:bg-primary-container'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Square size={16} fill="white" className="stroke-none" />
                  <span>End Session</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="white" className="stroke-none" />
                  <span>Start Session</span>
                </>
              )}
            </button>

            {/* Pause Button (appears only when running) */}
            {isTimerRunning && (
              <button
                onClick={isTimerPaused ? resumeTimer : pauseTimer}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 active:scale-90 shrink-0 cursor-pointer"
                title={isTimerPaused ? 'Resume Session' : 'Pause Session'}
              >
                {isTimerPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end px-2">
            <h2 className="font-sans text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Recent Sessions
              {sessions.length > 0 && (
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                  {sessions.length}
                </span>
              )}
            </h2>
            <button
              onClick={onViewAllStats}
              className="font-sans text-xs font-semibold text-primary hover:text-primary-container hover:underline flex items-center gap-0.5 transition-all cursor-pointer"
            >
              View all insights
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
            {sessions.length === 0 ? (
              <div className="text-slate-400 font-sans text-sm italic py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                <BookOpen size={24} className="text-slate-300 stroke-[1.5px]" />
                <span>Your study history will appear here...</span>
              </div>
            ) : (
              sessions.slice(0, 5).map((s) => {
                const date = new Date(s.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const durMin = Math.round(s.duration / 60);

                return (
                  <div
                    key={s.id}
                    className="bg-white p-4.5 rounded-2xl border border-slate-100/80 flex justify-between items-center group transition-all duration-200 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/40"
                  >
                    <div className="flex flex-col gap-1.5 min-w-0 pr-4">
                      <span className="font-sans font-bold text-sm text-slate-800 truncate">
                        {s.topic}
                      </span>
                      <span className="font-sans text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                        {dateStr} • {timeStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-primary font-semibold bg-primary/5 px-3 py-1.5 rounded-full border border-primary/5">
                        {durMin || '< 1'}m
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${s.topic}" from study history?`)) {
                            deleteSession(s.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200 cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Right Column: Mood Selector & Personal Stats Sidebar */}
      <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
        
        {/* Dynamic Atmosphere Mood Selector Widget */}
        <div className={`relative h-56 rounded-3xl overflow-hidden shadow-sm group border border-slate-100/50 bg-gradient-to-br ${currentMoodConfig.bgGradient} transition-all duration-700 p-6 flex flex-col justify-between`}>
          {/* Subtle moving particles/glow */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/20 opacity-30 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">
                Atmosphere Mood
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-white/40'}`} />
            </div>
            
            {/* Horizontal Mood Selector Tab Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {(Object.keys(MOODS_CONFIG) as AtmosphereMood[]).map((moodKey) => (
                <button
                  key={moodKey}
                  onClick={() => {
                    setActiveMood(moodKey);
                    sound.playChirp();
                  }}
                  disabled={isTimerRunning}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                    activeMood === moodKey
                      ? 'bg-white text-slate-900 shadow-md scale-105'
                      : 'bg-white/10 text-white/75 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {moodKey}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-1 mt-4">
            <p className="text-white/50 font-sans text-[10px] font-semibold tracking-wide">
              Active Focus Vibe
            </p>
            <h3 className="font-sans text-xl font-bold text-white tracking-tight">
              {currentMoodConfig.name}
            </h3>
          </div>
        </div>

        {/* Dynamic Stats Card: Today's Study Time */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-300 hover:scale-[1.01] hover:border-slate-200 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
              <Clock size={18} className="stroke-[2.2px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                Today's Focus
              </span>
              <span className="font-sans text-[10px] text-slate-300 font-medium mt-1">
                Target: 1 hr
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="font-mono text-3xl font-bold text-slate-800">
              {formatSecondsToHM(todaySeconds)}
            </span>
            <span className="text-[11px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/5">
              {percentageComparison}
            </span>
          </div>
        </div>

        {/* Dynamic Stats Card: Streak Tracker */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-300 hover:scale-[1.01] hover:border-slate-200 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/5">
              <Flame size={18} fill="currentColor" className="stroke-none" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                Daily Streak
              </span>
              <span className="font-sans text-[10px] text-slate-300 font-medium mt-1">
                Keep the flame alive
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="font-mono text-3xl font-bold text-secondary">
              {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? 'Day' : 'Days'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
              Personal Best: {streakInfo.longestStreak}
            </span>
          </div>
        </div>

        {/* Inspirative Tip Card */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col gap-3 transition-colors duration-300">
          <p className="font-sans text-xs font-semibold text-primary uppercase tracking-wider">
            Daily Study Tip
          </p>
          <p className="font-sans text-sm text-slate-600 leading-relaxed italic">
            "{isTimerRunning ? currentMoodConfig.quote : RANDOM_QUOTES[quoteIndex].text}"
          </p>
          <p className="font-sans text-[11px] font-bold text-primary mt-1">
            — {isTimerRunning ? currentMoodConfig.author : RANDOM_QUOTES[quoteIndex].author}
          </p>
        </div>
      </aside>
    </div>
  );
}
