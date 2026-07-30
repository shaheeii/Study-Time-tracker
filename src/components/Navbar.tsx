/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, BarChart2, Settings, User, Sun, Moon } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'timer' | 'stats';
  setActiveTab: (tab: 'timer' | 'stats') => void;
  openSettings: () => void;
  userProfile?: UserProfile;
  onOpenProfileModal?: (mode: 'login' | 'edit' | 'view') => void;
  themeMode?: 'light' | 'dark';
  onToggleThemeMode?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  openSettings,
  userProfile,
  onOpenProfileModal,
  themeMode = 'light',
  onToggleThemeMode,
}: NavbarProps) {
  const [imgError, setImgError] = useState(false);

  const displayAvatar = userProfile?.avatarUrl || '/shaheem.png';
  const displayName = userProfile?.isLoggedIn ? userProfile.name : 'FocusFlow';
  const displaySubtitle = userProfile?.isLoggedIn ? 'Focus Scholar' : 'Digital Silence';

  return (
    <>
      {/* Desktop Left Sidebar Navigation */}
      <nav className="hidden md:flex flex-col border-r border-slate-100 dark:border-slate-800 h-screen fixed left-0 top-0 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-40 p-6 justify-between transition-colors">
        <div className="flex flex-col gap-8">
          {/* Brand Logo & Title - Clickable for Profile */}
          <div 
            onClick={() => onOpenProfileModal ? onOpenProfileModal(userProfile?.isLoggedIn ? 'view' : 'login') : null}
            className="flex items-center gap-3.5 px-2 py-3 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 group"
            title="Click to view/edit User Profile"
          >
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary transition-colors">
              {!imgError ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg font-sans">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Soft online indicator */}
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${userProfile?.isLoggedIn ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-white dark:border-slate-900 rounded-full`}></span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="font-sans text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
                {displayName}
              </h1>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium tracking-wide truncate flex items-center gap-1">
                <span>{displaySubtitle}</span>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-sm group ${
                activeTab === 'timer'
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock
                size={18}
                className={`transition-transform duration-200 group-hover:scale-105 ${
                  activeTab === 'timer' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                }`}
              />
              <span>Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-sm group ${
                activeTab === 'stats'
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart2
                size={18}
                className={`transition-transform duration-200 group-hover:scale-105 ${
                  activeTab === 'stats' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                }`}
              />
              <span>Stats & Insights</span>
            </button>
          </div>
        </div>

        {/* Bottom controls in sidebar: Theme Mode toggle & Settings */}
        <div className="px-2 flex flex-col gap-2">
          {onToggleThemeMode && (
            <button
              onClick={onToggleThemeMode}
              className="w-full flex items-center justify-between text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-sm group"
              title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <div className="flex items-center gap-3">
                {themeMode === 'dark' ? (
                  <Sun size={18} className="text-amber-400 stroke-[1.8px]" />
                ) : (
                  <Moon size={18} className="text-indigo-500 stroke-[1.8px]" />
                )}
                <span>{themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {themeMode === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>
          )}

          <button
            onClick={openSettings}
            className="w-full flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-sm group"
          >
            <Settings
              size={18}
              className="transition-transform duration-300 group-hover:rotate-45 stroke-[1.8px]"
            />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Top App Bar (Mobile Only) */}
      <header className="md:hidden flex justify-between items-center px-6 h-16 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-colors">
        <div 
          onClick={() => onOpenProfileModal ? onOpenProfileModal(userProfile?.isLoggedIn ? 'view' : 'login') : null}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            {!imgError ? (
              <img
                src={displayAvatar}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-primary font-bold text-xs">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h1 className="font-sans text-md font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[150px]">
            {displayName}
          </h1>
        </div>
        <div className="flex gap-1.5">
          {onToggleThemeMode && (
            <button
              onClick={onToggleThemeMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary active:scale-95 transition-all duration-150 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
              title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {themeMode === 'dark' ? <Sun size={18} className="text-amber-400 stroke-[1.8px]" /> : <Moon size={18} className="text-indigo-500 stroke-[1.8px]" />}
            </button>
          )}
          <button
            onClick={() => onOpenProfileModal ? onOpenProfileModal('view') : null}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary active:scale-95 transition-all duration-150 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
            title="User Profile"
          >
            <User size={18} className="stroke-[1.8px]" />
          </button>
          <button
            onClick={openSettings}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary active:scale-95 transition-all duration-150 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Settings size={18} className="stroke-[1.8px]" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg flex justify-around items-center h-16 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-40 px-6 transition-colors">
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            activeTab === 'timer' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <div
            className={`flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-200 ${
              activeTab === 'timer' ? 'bg-primary/10 dark:bg-primary/20' : ''
            }`}
          >
            <Clock size={18} className={activeTab === 'timer' ? 'stroke-[2.3px]' : 'stroke-[1.8px]'} />
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Timer</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            activeTab === 'stats' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <div
            className={`flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-200 ${
              activeTab === 'stats' ? 'bg-primary/10 dark:bg-primary/20' : ''
            }`}
          >
            <BarChart2 size={18} className={activeTab === 'stats' ? 'stroke-[2.3px]' : 'stroke-[1.8px]'} />
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Stats</span>
        </button>

        <button
          onClick={openSettings}
          className="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition-all duration-200"
        >
          <div className="flex items-center justify-center px-5 py-1.5 rounded-full">
            <Settings size={18} className="stroke-[1.8px]" />
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Config</span>
        </button>
      </nav>
    </>
  );
}
