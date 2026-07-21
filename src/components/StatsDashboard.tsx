/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Search, Award, TrendingUp, Calendar, Zap, Flame, BarChart2, BookOpen, Trash2 } from 'lucide-react';
import { StudySession, StreakInfo } from '../types';
import { get7DayActivity, formatSecondsToHM, formatSecondsToHMS } from '../utils';

interface StatsDashboardProps {
  sessions: StudySession[];
  streakInfo: StreakInfo;
  deleteSession: (id: string) => void;
}

export default function StatsDashboard({ sessions, streakInfo, deleteSession }: StatsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const completedSessions = sessions.filter((s) => s.status === 'Completed');

  // Dynamic Statistics Calculations
  const totalSeconds = completedSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10; // e.g. 12.4 hrs

  const totalCompletedSessionsCount = completedSessions.length;

  // Average sessions per day (simplified calculation over the last 30 days or unique days)
  const uniqueStudyDates = Array.from(
    new Set(completedSessions.map((s) => new Date(s.timestamp).toDateString()))
  );
  const avgSessionsPerDay = uniqueStudyDates.length > 0 
    ? Math.round((totalCompletedSessionsCount / uniqueStudyDates.length) * 10) / 10
    : 0;

  // Study Activity data (Monday to Sunday)
  const weeklyActivity = get7DayActivity(sessions);

  // Search filtered sessions
  const filteredSessions = completedSessions.filter((s) =>
    s.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Download logs as CSV
  const handleDownloadCSV = () => {
    if (completedSessions.length === 0) {
      alert('No study logs available to export.');
      return;
    }

    const headers = ['Topic', 'Date', 'Time', 'Duration (Seconds)', 'Duration (Formatted)', 'Status'];
    const rows = completedSessions.map((s) => {
      const date = new Date(s.timestamp);
      const dateStr = date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      return [
        `"${s.topic.replace(/"/g, '""')}"`,
        dateStr,
        timeStr,
        s.duration,
        formatSecondsToHMS(s.duration),
        s.status,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FocusFlow_Study_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Streak Milestones Progress calculations
  const tenDayProgress = Math.min((streakInfo.currentStreak / 10) * 100, 100);
  const thirtyDayProgress = Math.min((streakInfo.currentStreak / 30) * 100, 100);

  return (
    <div className="flex flex-col gap-10 w-full max-w-[1100px] mx-auto pb-16">
      {/* Header section */}
      <section className="flex flex-col gap-2">
        <h2 className="font-sans text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Stats & Insights
        </h2>
        <p className="font-sans text-sm text-slate-400">
          Your progress towards digital clarity.
        </p>
      </section>

      {/* Bento Summary Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* All-Time Study Hours Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between h-48 transition-all duration-300 hover:shadow-[0_8px_35px_rgba(0,0,0,0.03)] hover:scale-[1.01]">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">
            All-Time Study Hours
          </span>
          <div className="flex items-baseline gap-1.5 my-3">
            <span className="font-mono text-5xl font-bold text-primary tracking-tight">
              {totalHours}
            </span>
            <span className="font-sans text-slate-400 text-sm font-semibold">hrs</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50/50 border border-emerald-100/55 px-3 py-1.5 rounded-full w-fit">
            <TrendingUp size={14} />
            <span>+12% from last month</span>
          </div>
        </div>

        {/* Sessions Completed Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between h-48 transition-all duration-300 hover:shadow-[0_8px_35px_rgba(0,0,0,0.03)] hover:scale-[1.01]">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">
            Total Sessions
          </span>
          <div className="flex items-baseline gap-1.5 my-3">
            <span className="font-mono text-5xl font-bold text-slate-800 tracking-tight">
              {totalCompletedSessionsCount}
            </span>
            <span className="font-sans text-slate-400 text-sm font-semibold">sessions</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full w-fit">
            <Calendar size={14} className="text-slate-400" />
            <span>{avgSessionsPerDay || '0'} daily average</span>
          </div>
        </div>

        {/* Longest Streak Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] border-l-4 border-l-secondary flex flex-col justify-between h-48 transition-all duration-300 hover:shadow-[0_8px_35px_rgba(0,0,0,0.03)] hover:scale-[1.01]">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">
            Longest Streak
          </span>
          <div className="flex items-baseline gap-1.5 my-3">
            <span className="font-mono text-5xl font-bold text-secondary tracking-tight">
              {streakInfo.longestStreak}
            </span>
            <span className="font-sans text-slate-400 text-sm font-semibold">days</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary text-xs font-bold bg-secondary/5 border border-secondary/10 px-3 py-1.5 rounded-full w-fit">
            <Flame size={14} fill="currentColor" className="stroke-none" />
            <span>Current: {streakInfo.currentStreak} days</span>
          </div>
        </div>
      </section>

      {/* Visualizations Section */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Weekly Activity Custom Chart */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between h-[360px] relative group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-sans text-md font-bold text-slate-800">
              Study Activity
            </h3>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              Last 7 Days
            </span>
          </div>

          {/* Core SVG/HTML Bar Graph */}
          <div className="flex items-end justify-between h-48 gap-4 px-2 select-none relative mt-4">
            {weeklyActivity.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar h-full justify-end relative">
                {/* Micro Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-all duration-200 pointer-events-none bg-slate-900 text-white text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg shadow-md whitespace-nowrap z-20">
                  {formatSecondsToHM(bar.seconds)}
                </div>

                {/* Column Bar representing study percentage */}
                <div
                  className={`w-full rounded-t-xl transition-all duration-300 ease-out cursor-pointer ${
                    bar.seconds > 0
                      ? 'bg-primary hover:bg-primary-container hover:shadow-lg hover:shadow-primary/10'
                      : 'bg-slate-100/70 hover:bg-slate-200'
                  }`}
                  style={{ height: bar.height }}
                />
                <span className="font-sans text-[11px] font-bold text-slate-400 group-hover/bar:text-slate-800 group-hover/bar:font-extrabold transition-all duration-200 uppercase tracking-wide">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between h-[360px] relative">
          <h3 className="font-sans text-md font-bold text-slate-800">
            Streak Milestones
          </h3>

          <div className="flex flex-col gap-5 flex-grow justify-center mt-4">
            {/* 10-Day Streak Progress */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-sans text-xs font-semibold text-slate-700">10 Day Streak</span>
                <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                  {Math.round(tenDayProgress)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 border border-slate-100/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${tenDayProgress}%` }}
                />
              </div>
              <p className="mt-1.5 font-sans text-[11px] text-slate-400 font-medium">
                {streakInfo.currentStreak >= 10 
                  ? 'Goal achieved! 🔥' 
                  : `${10 - streakInfo.currentStreak} days to go`}
              </p>
            </div>

            {/* 30-Day Streak Progress */}
            <div className={`relative ${streakInfo.currentStreak < 10 ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-sans text-xs font-semibold text-slate-700">30 Day Streak</span>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                  {Math.round(thirtyDayProgress)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 border border-slate-100/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${thirtyDayProgress}%` }}
                />
              </div>
              <p className="mt-1.5 font-sans text-[11px] text-slate-400 font-medium">
                {streakInfo.currentStreak >= 30 
                  ? 'Consistency Master unlocked! 🏆' 
                  : 'Unlock "Consistency Master" badge'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4.5 border-t border-slate-100 flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary border border-secondary-fixed-dim/10 shrink-0">
              <Award size={22} className="stroke-[2px]" />
            </div>
            <div className="flex flex-col">
              <h4 className="font-sans text-xs font-bold text-slate-800 leading-none">
                Next Achievement
              </h4>
              <p className="font-sans text-[11px] text-slate-400 mt-1.5 font-medium leading-none">
                {totalCompletedSessionsCount >= 50 
                  ? 'Zen Focus Master (50+ Sessions)' 
                  : `Zen Focus (50 sessions) • ${Math.max(50 - totalCompletedSessionsCount, 0)} left`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Database Session Breakdown */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-sans text-md font-bold text-slate-800">
              Session Breakdown
            </h3>
            <p className="font-sans text-[11px] text-slate-400 font-medium uppercase tracking-wide">
              Detailed study database logs
            </p>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Elegant search box */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all duration-200 placeholder:text-slate-300 w-full md:w-56"
              />
            </div>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:text-slate-800 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-sans text-sm italic flex flex-col items-center justify-center gap-3.5">
              <BookOpen size={28} className="text-slate-200 stroke-[1.5px]" />
              <span>No study sessions found matching your search.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-8 py-4 font-sans text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-8 py-4 font-sans text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-8 py-4 font-sans text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-8 py-4 font-sans text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Status
                  </th>
                  <th className="px-8 py-4 font-sans text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.slice(0, 15).map((s, idx) => {
                  const date = new Date(s.timestamp);
                  const formattedDate = date.toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-colors duration-150 group/row"
                    >
                      <td className="px-8 py-5.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              idx % 3 === 0
                                ? 'bg-primary'
                                : idx % 3 === 1
                                ? 'bg-secondary'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span className="font-sans font-semibold text-sm text-slate-800">
                            {s.topic}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5.5 font-mono text-xs text-slate-400">
                        {formattedDate}
                      </td>
                      <td className="px-8 py-5.5 font-mono text-xs text-slate-800 font-bold">
                        {formatSecondsToHMS(s.duration)}
                      </td>
                      <td className="px-8 py-5.5 text-right">
                        <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-full border border-primary/5 uppercase tracking-wide">
                          Completed
                        </span>
                      </td>
                      <td className="px-8 py-5.5 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently delete "${s.topic}" from study history?`)) {
                              deleteSession(s.id);
                            }
                          }}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 p-1 rounded transition-all duration-150 cursor-pointer"
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Serene Atmosphere Image Section */}
      <section className="mb-4">
        <div className="relative w-full h-[280px] rounded-3xl overflow-hidden shadow-md group">
          {/* Blur & Dark Overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent z-10" />
          
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc7SJZ58ZZofUG99eWXkH-57PvS25knUKQI9xts37LN6Vd-csKme51aHOejc0GVRYU0Q9peuW0b_7o7Ust78bpmemdppA8WzWDjNhUpASIO4CYIAtwt-1HLp5eQ6of_iI3lzaopDlNPu5v6A51yBOsqIefH_TNfMbvHuSuOuNUlJeBt6s78ysN5qJESDggCsvU7pTYmDCHcCCqG0QpWpjT8RA3Alr1D1esBJXwTa-G4toDlyjbTRwSow"
            alt="Minimal home workspace dusk desk study focus flow"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-[1000ms]"
          />
          
          <div className="absolute bottom-0 left-0 p-8 md:p-10 z-20 flex flex-col gap-2 max-w-xl">
            <h3 className="font-sans text-xl md:text-2xl font-bold text-white tracking-tight">
              Maintain Your Flow
            </h3>
            <p className="font-sans text-xs md:text-sm text-white/70 leading-relaxed italic mt-1.5">
              “Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.”
            </p>
            <span className="font-sans text-[10px] font-bold text-primary mt-1">
              — Alexander Graham Bell
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
