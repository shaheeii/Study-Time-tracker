/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Move, ExternalLink, Minimize2, Tv } from 'lucide-react';
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
}

// Styling map dynamically reflecting each of the primary FocusFlow design themes
const THEME_STYLES = {
  blue: {
    border: 'border-blue-100 hover:border-blue-300',
    glow: 'shadow-[0_12px_30px_rgba(37,99,235,0.12)]',
    text: 'text-blue-600',
    btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: 'bg-blue-50/50 hover:bg-blue-50 text-blue-700 border border-blue-100/50',
    pipActive: 'bg-blue-50 text-blue-600 border border-blue-200',
    pipInactive: 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100',
    accentDot: 'bg-blue-500',
  },
  indigo: {
    border: 'border-indigo-100 hover:border-indigo-300',
    glow: 'shadow-[0_12px_30px_rgba(79,70,229,0.12)]',
    text: 'text-indigo-600',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    btnSecondary: 'bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 border border-indigo-100/50',
    pipActive: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
    pipInactive: 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100',
    accentDot: 'bg-indigo-500',
  },
  emerald: {
    border: 'border-emerald-100 hover:border-emerald-300',
    glow: 'shadow-[0_12px_30px_rgba(5,150,105,0.12)]',
    text: 'text-emerald-600',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: 'bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 border border-emerald-100/50',
    pipActive: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    pipInactive: 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100',
    accentDot: 'bg-emerald-500',
  },
  slate: {
    border: 'border-slate-200 hover:border-slate-400',
    glow: 'shadow-[0_12px_30px_rgba(71,85,105,0.12)]',
    text: 'text-slate-800',
    btnPrimary: 'bg-slate-800 hover:bg-slate-900 text-white',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/50',
    pipActive: 'bg-slate-200 text-slate-800 border border-slate-300',
    pipInactive: 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100',
    accentDot: 'bg-slate-600',
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
}: FloatingTimerProps) {
  // Use slightly narrower widths for cleaner look: full is 210px, minimized is 135px
  const widthExpanded = 210;
  const widthMinimized = 135;

  const [position, setPosition] = useState({ 
    x: window.innerWidth - widthExpanded - 24, 
    y: window.innerHeight - 165 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentTheme = THEME_STYLES[themeColor] || THEME_STYLES.blue;

  // Maintain floating position inside safe boundaries during screen resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const currentWidth = isMinimized ? widthMinimized : widthExpanded;
        const maxX = window.innerWidth - currentWidth - 16;
        const maxY = window.innerHeight - (isMinimized ? 75 : 145);
        return {
          x: Math.max(16, Math.min(prev.x, maxX)),
          y: Math.max(16, Math.min(prev.y, maxY)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  // Drag handlers for pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag when clicking backgrounds or explicit drag handle, not interactive buttons or text-inputs
    if ((e.target as HTMLElement).closest('button')) return;

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

    // Boundaries check
    const currentWidth = isMinimized ? widthMinimized : widthExpanded;
    const maxX = window.innerWidth - currentWidth - 16;
    const maxY = window.innerHeight - (isMinimized ? 75 : 145);

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

  // Picture-in-Picture Logic: Renders canvas stream to floating native video
  useEffect(() => {
    if (!isTimerRunning) {
      setIsPipActive(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Re-draw timer onto hidden canvas
    const drawCanvas = () => {
      // Clean background
      ctx.fillStyle = '#0f172a'; // Slate-900 background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Theme-specific vertical accent indicator bar
      const themeColorsHex = {
        blue: '#2563eb',
        indigo: '#4f46e5',
        emerald: '#059669',
        slate: '#475569',
      };
      ctx.fillStyle = themeColorsHex[themeColor] || '#2563eb';
      ctx.fillRect(0, 0, 8, canvas.height);

      // Topic text line
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      const displayTopic = activeTopic.trim() ? activeTopic : 'Focus Session';
      const truncatedTopic = displayTopic.length > 20 ? displayTopic.slice(0, 18) + '...' : displayTopic;
      ctx.fillText(truncatedTopic.toUpperCase(), 18, 24);

      // Big clock
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px monospace';
      ctx.fillText(formatSecondsToHMS(activeSeconds), 18, 62);

      // State label
      ctx.fillStyle = isTimerPaused ? '#f43f5e' : '#10b981';
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(isTimerPaused ? 'PAUSED' : `ACTIVE: ${activeMood.toUpperCase()}`, 18, 86);
    };

    drawCanvas();
  }, [activeSeconds, activeTopic, activeMood, isTimerRunning, isTimerPaused, themeColor]);

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
          alert('Your browser does not support streaming canvas rendering to Picture-in-Picture.');
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
            console.error('Failed to request PiP:', err);
            alert('Could not start PiP display. Interaction is required.');
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

  if (!isTimerRunning) return null;

  return (
    <>
      <canvas ref={canvasRef} width={220} height={105} className="hidden" />
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Floating Container */}
      <div
        ref={dragRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none',
        }}
        className={`fixed z-50 rounded-2xl border bg-white/95 backdrop-blur-md transition-all duration-200 select-none ${
          isDragging 
            ? `shadow-xl cursor-grabbing scale-[1.02] border-slate-300 ring-2 ring-slate-100` 
            : `shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-grab ${currentTheme.border} ${currentTheme.glow}`
        } ${isMinimized ? 'w-[135px] p-2.5' : 'w-[210px] p-3.5'}`}
        id="floating-timer-widget"
      >
        {isMinimized ? (
          /* Minimized Capsule Layout */
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-between w-full text-slate-400">
              <span className="cursor-move text-slate-300 hover:text-slate-500">
                <Move size={11} />
              </span>
              <button
                onClick={() => setIsMinimized(false)}
                className="text-[9px] font-bold tracking-tight text-slate-400 hover:text-slate-700 hover:underline cursor-pointer"
              >
                Expand
              </button>
            </div>
            
            <span className={`font-mono text-base font-extrabold tracking-tight tabular-nums ${currentTheme.text}`}>
              {formatSecondsToHMS(activeSeconds)}
            </span>

            <div className="flex gap-1.5 w-full">
              <button
                onClick={isTimerPaused ? resumeTimer : pauseTimer}
                className="flex-1 p-1 rounded-md bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 flex justify-center items-center cursor-pointer"
                title={isTimerPaused ? 'Resume' : 'Pause'}
              >
                {isTimerPaused ? <Play size={10} fill="currentColor" /> : <Pause size={10} />}
              </button>
              <button
                onClick={stopAndSaveTimer}
                className="flex-1 p-1 rounded-md bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 flex justify-center items-center cursor-pointer"
                title="Save & End"
              >
                <Square size={8} fill="currentColor" className="stroke-none" />
              </button>
            </div>
          </div>
        ) : (
          /* Expanded Thin / Clean Mini-Card Layout */
          <div className="flex flex-col gap-2.5">
            {/* Header: drag bar, topic, minimize/external buttons */}
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full ${isTimerPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'} shrink-0`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[100px]">
                  {activeTopic.trim() ? activeTopic : 'Focusing'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={maximizeToTimerTab}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                  title="Maximize to timer"
                >
                  <ExternalLink size={11} />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                  title="Minimize widget"
                >
                  <Minimize2 size={11} />
                </button>
              </div>
            </div>

            {/* Time value, label, and Pip icon */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`font-mono text-xl font-black tracking-tight leading-none tabular-nums ${currentTheme.text}`}>
                  {formatSecondsToHMS(activeSeconds)}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 mt-1">
                  {isTimerPaused ? 'Paused' : activeMood}
                </span>
              </div>

              {/* picture-in-picture activation button */}
              <button
                onClick={handleTogglePip}
                className={`p-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isPipActive ? currentTheme.pipActive : currentTheme.pipInactive
                }`}
                title={isPipActive ? 'Close Pop-Out screen' : 'Pop-Out Native System Overlay'}
              >
                <Tv size={11} />
                <span>PIP</span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center gap-1.5 mt-0.5">
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
          </div>
        )}
      </div>
    </>
  );
}
