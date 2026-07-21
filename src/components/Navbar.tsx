/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, BarChart2, Settings, User } from 'lucide-react';

interface NavbarProps {
  activeTab: 'timer' | 'stats';
  setActiveTab: (tab: 'timer' | 'stats') => void;
  openSettings: () => void;
}

export default function Navbar({ activeTab, setActiveTab, openSettings }: NavbarProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <>
      {/* Desktop Left Sidebar Navigation */}
      <nav className="hidden md:flex flex-col border-r border-slate-100 h-screen fixed left-0 top-0 w-64 bg-white/90 backdrop-blur-md z-40 p-6 justify-between">
        <div className="flex flex-col gap-8">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5 px-2 py-4">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20 bg-slate-50 flex items-center justify-center shrink-0 shadow-sm">
              {!imgError ? (
                <img
                  src="/shaheem.png"
                  alt="Shaheem Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg font-sans">
                  SF
                </div>
              )}
              {/* Soft online indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-sans text-lg font-bold text-slate-900 tracking-tight leading-tight">
                FocusFlow
              </h1>
              <p className="text-slate-400 text-xs font-medium tracking-wide">
                Digital Silence
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-sm group ${
                activeTab === 'timer'
                  ? 'bg-primary/5 text-primary'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
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
                  ? 'bg-primary/5 text-primary'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
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

        {/* Settings button at the bottom of sidebar */}
        <div className="px-2">
          <button
            onClick={openSettings}
            className="w-full flex items-center gap-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-sm group"
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
      <header className="md:hidden flex justify-between items-center px-6 h-16 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-slate-100 flex items-center justify-center shrink-0">
            {!imgError ? (
              <img
                src="/shaheem.png"
                alt="Shaheem Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-primary font-bold text-xs">SF</span>
            )}
          </div>
          <h1 className="font-sans text-md font-bold text-slate-900 tracking-tight">
            FocusFlow
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openSettings}
            className="p-2 text-slate-500 hover:text-primary active:scale-95 transition-all duration-150 rounded-full hover:bg-slate-50"
          >
            <Settings size={18} className="stroke-[1.8px]" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg flex justify-around items-center h-16 border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-40 px-6">
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            activeTab === 'timer' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <div
            className={`flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-200 ${
              activeTab === 'timer' ? 'bg-primary/10' : ''
            }`}
          >
            <Clock size={18} className={activeTab === 'timer' ? 'stroke-[2.3px]' : 'stroke-[1.8px]'} />
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Timer</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            activeTab === 'stats' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <div
            className={`flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-200 ${
              activeTab === 'stats' ? 'bg-primary/10' : ''
            }`}
          >
            <BarChart2 size={18} className={activeTab === 'stats' ? 'stroke-[2.3px]' : 'stroke-[1.8px]'} />
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Stats</span>
        </button>

        <button
          onClick={openSettings}
          className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 active:scale-95 transition-all duration-200"
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
