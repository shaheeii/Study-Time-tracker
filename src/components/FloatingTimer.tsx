/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Move, ExternalLink, Minimize2, Tv, Settings, Check } from 'lucide-react';
import { AtmosphereMood } from '../types';
import { formatSecondsToHMS, sound } from '../utils';

interface FloatingTimerProps {
  activeSeconds: number;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  activeTopic: string;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndSaveTimer: () => void;
  activeMood: AtmosphereMood;
  themeColor: 'blue' | 'indigo' | 'slate' | 'emerald';
  maximizeToTimerTab: () => void;
  pipTrigger?: number;
}

// Design-theme styles mirroring the master color definitions in FocusFlow
const THEME_STYLES = {
  blue: {
    border: 'border-blue-100/80 hover:border-blue-300',
    glow: 'shadow-[0_12px_35px_rgba(59,130,246,0.12)]',
    text: 'text-blue-600',
    btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: 'bg-blue-50/50 hover:bg-blue-50 text-blue-700 border border-blue-100/50',
    btnActiveTab: 'bg-blue-600 text-white',
    btnInactiveTab: 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100',
    pipActive: 'bg-blue-50 text-blue-600 border border-blue-200',
    pipInactive: 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100',
    accentDot: 'bg-blue-500',
    accentSlider: 'accent-blue-600',
  },
  indigo: {
    border: 'border-indigo-100/80 hover:border-indigo-300',
    glow: 'shadow-[0_12px_35px_rgba(99,102,241,0.12)]',
    text: 'text-indigo-600',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    btnSecondary: 'bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 border border-indigo-100/50',
    btnActiveTab: 'bg-indigo-600 text-white',
    btnInactiveTab: 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100',
    pipActive: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
    pipInactive: 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100',
    accentDot: 'bg-indigo-500',
    accentSlider: 'accent-indigo-600',
  },
  emerald: {
    border: 'border-emerald-100/80 hover:border-emerald-300',
    glow: 'shadow-[0_12px_35px_rgba(16,185,129,0.12)]',
    text: 'text-emerald-600',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: 'bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 border border-emerald-100/50',
    btnActiveTab: 'bg-emerald-600 text-white',
    btnInactiveTab: 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100',
    pipActive: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    pipInactive: 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100',
    accentDot: 'bg-emerald-500',
    accentSlider: 'accent-emerald-600',
  },
  slate: {
    border: 'border-slate-200 hover:border-slate-400',
    glow: 'shadow-[0_12px_35px_rgba(71,85,105,0.12)]',
    text: 'text-slate-800',
    btnPrimary: 'bg-slate-800 hover:bg-slate-900 text-white',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/50',
    btnActiveTab: 'bg-slate-800 text-white',
    btnInactiveTab: 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100',
    pipActive: 'bg-slate-200 text-slate-800 border border-slate-300',
    pipInactive: 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100',
    accentDot: 'bg-slate-600',
    accentSlider: 'accent-slate-600',
  },
};

export default function FloatingTimer({
  activeSeconds,
  isTimerRunning,
  isTimerPaused,
  activeTopic,
  pauseTimer,
  resumeTimer,
  stopAndSaveTimer,
  activeMood,
  themeColor,
  maximizeToTimerTab,
  pipTrigger = 0,
}: FloatingTimerProps) {
  // Widget base configurations with saved preferences
  const [widgetWidth, setWidgetWidth] = useState<number>(() => {
    const saved = localStorage.getItem('focusflow_widget_width');
    return saved ? parseInt(saved) : 220;
  });

  const [widgetHeight, setWidgetHeight] = useState<number>(() => {
    const saved = localStorage.getItem('focusflow_widget_height');
    return saved ? parseInt(saved) : 155;
  });

  const widthMinimized = 135;

  // Custom PiP canvas dimensions for fully adjustable system popup dimensions
  const [pipWidth, setPipWidth] = useState<number>(() => {
    const saved = localStorage.getItem('focusflow_pip_width');
    return saved ? parseInt(saved) : 320;
  });

  const [pipHeight, setPipHeight] = useState<number>(() => {
    const saved = localStorage.getItem('focusflow_pip_height');
    return saved ? parseInt(saved) : 100;
  });

  // Widget scale/zoom multiplier
  const [widgetScale, setWidgetScale] = useState<number>(() => {
    const saved = localStorage.getItem('focusflow_widget_scale');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [position, setPosition] = useState({ 
    x: window.innerWidth - widgetWidth - 24, 
    y: window.innerHeight - widgetHeight - 24
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoLaunchPip, setAutoLaunchPip] = useState<boolean>(() => {
    const saved = localStorage.getItem('focusflow_auto_pip');
    return saved !== 'false';
  });

  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentTheme = THEME_STYLES[themeColor] || THEME_STYLES.blue;

  // Persist adjustable preferences
  useEffect(() => {
    localStorage.setItem('focusflow_auto_pip', autoLaunchPip.toString());
  }, [autoLaunchPip]);

  useEffect(() => {
    localStorage.setItem('focusflow_widget_width', widgetWidth.toString());
  }, [widgetWidth]);

  useEffect(() => {
    localStorage.setItem('focusflow_widget_height', widgetHeight.toString());
  }, [widgetHeight]);

  useEffect(() => {
    localStorage.setItem('focusflow_pip_width', pipWidth.toString());
  }, [pipWidth]);

  useEffect(() => {
    localStorage.setItem('focusflow_pip_height', pipHeight.toString());
  }, [pipHeight]);

  useEffect(() => {
    localStorage.setItem('focusflow_widget_scale', widgetScale.toString());
  }, [widgetScale]);

  // Handle boundaries on window resizing or dimensional changes
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const currentWidth = (isMinimized ? widthMinimized : widgetWidth) * widgetScale;
        const currentHeight = (isMinimized ? 75 : widgetHeight) * widgetScale;
        const maxX = window.innerWidth - currentWidth - 16;
        const maxY = window.innerHeight - currentHeight - 16;
        return {
          x: Math.max(16, Math.min(prev.x, maxX)),
          y: Math.max(16, Math.min(prev.y, maxY)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Trigger immediately to clamp correctly
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized, widgetWidth, widgetHeight, widgetScale]);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore dragging when touching slider elements or buttons
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
    if (dragRef.current) {
      dragRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newX = positionStartRef.current.x + deltaX;
    const newY = positionStartRef.current.y + deltaY;

    // Boundary math considering scale zoom factor
    const currentWidth = (isMinimized ? widthMinimized : widgetWidth) * widgetScale;
    const currentHeight = (isMinimized ? 75 : widgetHeight) * widgetScale;
    const maxX = window.innerWidth - currentWidth - 16;
    const maxY = window.innerHeight - currentHeight - 16;

    setPosition({
      x: Math.max(16, Math.min(newX, maxX)),
      y: Math.max(16, Math.min(newY, maxY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (dragRef.current) {
      dragRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Picture-in-Picture Render Loop: Draw dynamically adjusted layouts based on user-configured aspect ratios
  useEffect(() => {
    if (!isTimerRunning) {
      setIsPipActive(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };

    // Responsive Canvas Drawing Pipeline
    const drawCanvas = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Clean backdrop with depth gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0a0f1d');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const themeColorsHex = {
        blue: '#3b82f6',
        indigo: '#6366f1',
        emerald: '#10b981',
        slate: '#64748b',
      };
      const accentColor = themeColorsHex[themeColor] || '#3b82f6';

      // 1. Draw glowing accent dynamic circle pulsing in background
      const pulseFactor = 1 + 0.1 * Math.sin(Date.now() / 800);
      const glowGrad = ctx.createRadialGradient(w - 60, h / 2, 10, w - 60, h / 2, Math.max(20, h * 0.6 * pulseFactor));
      glowGrad.addColorStop(0, accentColor + '25'); // subtle transparent glow
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(w - 60, h / 2, Math.max(30, h * pulseFactor), 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Left sidebar accent indicator
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, 5, h);

      // 3. Dynamic layout switching based on landscape vs portrait aspect
      const isLandscape = w >= h * 1.35;

      if (isLandscape) {
        // --- LANDSCAPE LAYOUT ---
        // Brand label Tag
        ctx.fillStyle = '#1e293b';
        drawRoundRect(15, 10, 85, 15, 3);
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 8px monospace';
        ctx.fillText('FOCUSFLOW', 21, 21);

        // Status beacon dot
        ctx.fillStyle = isTimerPaused ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.arc(90, 17, 3, 0, Math.PI * 2);
        ctx.fill();

        // Active Topic label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 10px system-ui, sans-serif';
        const displayTopic = activeTopic.trim() ? activeTopic : 'Focus Session';
        const truncatedTopic = displayTopic.length > 20 ? displayTopic.slice(0, 18) + '...' : displayTopic;
        ctx.fillText(truncatedTopic, 112, 22);

        // Huge time string (glowing text)
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        // Dynamically scale clock size to fit nicely
        const timeFontSize = Math.min(Math.max(16, h * 0.42), 42);
        ctx.font = `bold ${timeFontSize}px monospace`;
        ctx.fillText(formatSecondsToHMS(activeSeconds), 15, h - 18);
        ctx.shadowBlur = 0;

        // Custom state caption
        ctx.fillStyle = '#64748b';
        ctx.font = '500 8px system-ui, sans-serif';
        ctx.fillText(isTimerPaused ? 'Session Paused' : `Flow active • ${activeMood}`, 15, h - 6);

        // Dynamic Stopwatch circular dial on the far right
        const ringSize = Math.min(h * 0.65, 52);
        const ringRadius = ringSize / 2;
        const ringX = w - ringRadius - 20;
        const ringY = h / 2;

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        const secondsInMinute = activeSeconds % 60;
        const progressAngle = (secondsInMinute / 60) * Math.PI * 2 - Math.PI / 2;

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ringX, ringY, ringRadius, -Math.PI / 2, progressAngle);
        ctx.stroke();

        // Inner seconds ticker string
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${secondsInMinute}s`, ringX, ringY + 3);
        ctx.textAlign = 'left'; // restore

      } else {
        // --- PORTRAIT / COMPACT CARD LAYOUT ---
        // Center Stopwatch dial in the upper center
        const ringRadius = Math.min(w, h) * 0.22;
        const ringX = w / 2;
        const ringY = Math.max(40, h * 0.35);

        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        const secondsInMinute = activeSeconds % 60;
        const progressAngle = (secondsInMinute / 60) * Math.PI * 2 - Math.PI / 2;

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ringX, ringY, ringRadius, -Math.PI / 2, progressAngle);
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${secondsInMinute}s`, ringX, ringY + 3);

        // Huge centered digital clock
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffffff';
        const timeFontSize = Math.min(Math.max(16, h * 0.18), 32);
        ctx.font = `bold ${timeFontSize}px monospace`;
        ctx.fillText(formatSecondsToHMS(activeSeconds), ringX, ringY + ringRadius + 28);
        ctx.shadowBlur = 0;

        // Custom mini topic subtitle
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px system-ui, sans-serif';
        const displayTopic = activeTopic.trim() ? activeTopic : 'Focus';
        const truncatedTopic = displayTopic.length > 18 ? displayTopic.slice(0, 16) + '...' : displayTopic;
        ctx.fillText(truncatedTopic.toUpperCase(), ringX, ringY + ringRadius + 44);

        ctx.textAlign = 'left'; // Restore align defaults
      }
    };

    drawCanvas();
  }, [activeSeconds, activeTopic, activeMood, isTimerRunning, isTimerPaused, themeColor, pipWidth, pipHeight]);

  // Picture-in-Picture action flow
  const handleTogglePip = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      if (isPipActive) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        }
        setIsPipActive(false);
      } else {
        // @ts-ignore
        const stream = canvas.captureStream ? canvas.captureStream(10) : canvas.mozCaptureStream ? canvas.mozCaptureStream(10) : null;
        if (!stream) {
          alert('Canvas streams not supported in this browser.');
          return;
        }

        video.srcObject = stream;
        
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            await video.requestPictureInPicture();
            setIsPipActive(true);
            sound.playChirp();
          } catch (err) {
            console.error('Failed to start Picture-in-Picture overlay window:', err);
            alert('Picture-in-Picture failed. Ensure you are interacting with the tab directly.');
          }
        };
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleLeavePip = () => {
      setIsPipActive(false);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('leavepictureinpicture', handleLeavePip);
    }

    return () => {
      if (video) {
        video.removeEventListener('leavepictureinpicture', handleLeavePip);
      }
    };
  }, []);

  // Auto-launch Picture-in-Picture on session start
  useEffect(() => {
    if (pipTrigger > 0 && isTimerRunning) {
      if (autoLaunchPip) {
        const t = setTimeout(() => {
          handleTogglePip();
        }, 120);
        return () => clearTimeout(t);
      }
    }
  }, [pipTrigger, isTimerRunning]);

  return (
    <>
      {/* Hidden visual render pipeline feeds the native desktop/system video overlays */}
      <canvas ref={canvasRef} width={pipWidth} height={pipHeight} className="hidden" />
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {isTimerRunning && (
        /* Floating Container */
        <div
          ref={dragRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            touchAction: 'none',
            transform: `scale(${widgetScale})`,
            transformOrigin: 'bottom right',
            width: isMinimized ? `${widthMinimized}px` : `${widgetWidth}px`,
            height: isMinimized ? 'auto' : `${widgetHeight}px`,
          }}
          className={`fixed z-50 rounded-2xl border bg-white/95 backdrop-blur-md transition-all duration-150 select-none overflow-y-auto overflow-x-hidden ${
            isDragging 
              ? `shadow-2xl cursor-grabbing border-slate-300 ring-2 ring-slate-100` 
              : `shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-grab ${currentTheme.border} ${currentTheme.glow}`
          } p-3.5`}
          id="floating-timer-widget"
        >
        {isMinimized ? (
          /* Minimized Capsule Clock Layout */
          <div className="flex flex-col items-center justify-center gap-1.5 h-full">
            <div className="flex items-center justify-between w-full text-slate-400">
              <span className="cursor-move text-slate-300 hover:text-slate-500">
                <Move size={11} />
              </span>
              <button
                onClick={() => setIsMinimized(false)}
                className="text-[9px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Expand
              </button>
            </div>
            
            <span className={`font-mono text-base font-extrabold tracking-tight tabular-nums ${currentTheme.text}`}>
              {formatSecondsToHMS(activeSeconds)}
            </span>

            <div className="flex gap-1.5 w-full mt-0.5">
              <button
                onClick={isTimerPaused ? resumeTimer : pauseTimer}
                className="flex-1 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600 flex justify-center items-center cursor-pointer"
              >
                {isTimerPaused ? <Play size={10} fill="currentColor" /> : <Pause size={10} />}
              </button>
              <button
                onClick={stopAndSaveTimer}
                className="flex-1 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-600 flex justify-center items-center cursor-pointer"
              >
                <Square size={8} fill="currentColor" className="stroke-none" />
              </button>
            </div>
          </div>
        ) : (
          /* Expanded Custom Sized Control Card */
          <div className="flex flex-col gap-2.5 h-full justify-between">
            {/* Header section with dragging grip, topic name, and preferences button */}
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full ${isTimerPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'} shrink-0`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[100px]">
                  {activeTopic.trim() ? activeTopic : 'Focusing'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Custom size settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    showSettings ? 'text-primary bg-primary/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Adjust Height/Width Dimensions"
                >
                  <Settings size={11} />
                </button>
                {/* Full clock maximize */}
                <button
                  onClick={maximizeToTimerTab}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                  title="Maximize Window"
                >
                  <ExternalLink size={11} />
                </button>
                {/* Minimize back to capsule */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                  title="Minimize Widget"
                >
                  <Minimize2 size={11} />
                </button>
              </div>
            </div>

            {/* Custom Interactive Sizing Adjusters (Expanded menu) */}
            {showSettings ? (
              <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150 overflow-y-auto max-h-[160px] scrollbar-thin">
                
                {/* 1. HTML Floating Widget width and height slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[8px] font-extrabold uppercase tracking-wider text-slate-500">
                    <span>Widget Width</span>
                    <span className="text-slate-600 bg-white px-1 rounded border text-[9px]">{widgetWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="180"
                    max="340"
                    step="5"
                    value={widgetWidth}
                    onChange={(e) => setWidgetWidth(parseInt(e.target.value))}
                    className={`w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer ${currentTheme.accentSlider}`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[8px] font-extrabold uppercase tracking-wider text-slate-500">
                    <span>Widget Height</span>
                    <span className="text-slate-600 bg-white px-1 rounded border text-[9px]">{widgetHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min="130"
                    max="280"
                    step="5"
                    value={widgetHeight}
                    onChange={(e) => setWidgetHeight(parseInt(e.target.value))}
                    className={`w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer ${currentTheme.accentSlider}`}
                  />
                </div>

                {/* 2. System PiP canvas width and height slider */}
                <div className="border-t border-slate-200/50 pt-2 flex flex-col gap-1.5">
                  <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">System PiP Window Dimensions</span>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[8px] font-extrabold uppercase tracking-wider text-slate-500">
                      <span>PiP Width</span>
                      <span className="text-slate-600 bg-white px-1 rounded border text-[9px]">{pipWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="140"
                      max="480"
                      step="10"
                      value={pipWidth}
                      onChange={(e) => setPipWidth(parseInt(e.target.value))}
                      className={`w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer ${currentTheme.accentSlider}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[8px] font-extrabold uppercase tracking-wider text-slate-500">
                      <span>PiP Height</span>
                      <span className="text-slate-600 bg-white px-1 rounded border text-[9px]">{pipHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="320"
                      step="10"
                      value={pipHeight}
                      onChange={(e) => setPipHeight(parseInt(e.target.value))}
                      className={`w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer ${currentTheme.accentSlider}`}
                    />
                  </div>
                </div>

                {/* Auto-launch System Picture-in-Picture Toggle */}
                <div className="border-t border-slate-200/50 pt-2 flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">System Overlay Settings</span>
                  <label className="flex items-center gap-2 cursor-pointer py-0.5 select-none">
                    <input
                      type="checkbox"
                      checked={autoLaunchPip}
                      onChange={(e) => {
                        setAutoLaunchPip(e.target.checked);
                        sound.playChirp();
                      }}
                      className="rounded border-slate-300 focus:ring-0 h-3 w-3 cursor-pointer"
                    />
                    <span className="text-[9px] font-bold text-slate-600">Auto-Launch PiP on Start</span>
                  </label>
                </div>

                {/* 3. Scale modifier presets */}
                <div className="border-t border-slate-200/50 pt-2 flex flex-col gap-1">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Scale zoom</span>
                  <div className="grid grid-cols-3 gap-1">
                    {([0.85, 1.0, 1.15] as const).map((sc) => {
                      const labels = { 0.85: 'Sm', 1.0: 'Md', 1.15: 'Lg' };
                      return (
                        <button
                          key={sc}
                          onClick={() => {
                            setWidgetScale(sc);
                            sound.playChirp();
                          }}
                          className={`text-[9px] py-0.5 font-bold rounded cursor-pointer transition-all ${
                            widgetScale === sc
                              ? currentTheme.btnActiveTab
                              : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200/50'
                          }`}
                        >
                          {labels[sc]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Normal content when settings submenu is closed */
              <>
                {/* Clock output & Picture-in-Picture controller */}
                <div className="flex items-center justify-between my-auto">
                  <div className="flex flex-col">
                    <span className={`font-mono text-xl font-black tracking-tight leading-none tabular-nums ${currentTheme.text}`}>
                      {formatSecondsToHMS(activeSeconds)}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 mt-1">
                      {isTimerPaused ? 'Paused' : activeMood}
                    </span>
                  </div>

                  {/* native screen-wide overlay action */}
                  <button
                    onClick={handleTogglePip}
                    className={`p-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isPipActive ? currentTheme.pipActive : currentTheme.pipInactive
                    }`}
                    title={isPipActive ? 'Close System Popup' : 'Pop-out System Overlay'}
                  >
                    <Tv size={11} />
                    <span>PIP</span>
                  </button>
                </div>

                {/* Session Actions Footer */}
                <div className="flex justify-between items-center gap-1.5 mt-0.5 shrink-0">
                  <button
                    onClick={isTimerPaused ? resumeTimer : pauseTimer}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${currentTheme.btnSecondary}`}
                  >
                    {isTimerPaused ? (
                      <>
                        <Play size={9} fill="currentColor" />
                        <span>Play</span>
                      </>
                    ) : (
                      <>
                        <Pause size={9} />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={stopAndSaveTimer}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${currentTheme.btnPrimary}`}
                  >
                    <Square size={8} fill="currentColor" className="stroke-none" />
                    <span>Save</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      )}
    </>
  );
}
