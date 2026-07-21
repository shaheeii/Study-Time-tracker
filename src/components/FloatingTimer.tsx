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
  maximizeToTimerTab: () => void;
}

export default function FloatingTimer({
  activeSeconds,
  isTimerRunning,
  isTimerPaused,
  activeTopic,
  pauseTimer,
  resumeTimer,
  stopAndSaveTimer,
  activeMood,
  maximizeToTimerTab,
}: FloatingTimerProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: window.innerHeight - 180 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Maintain floating position inside safe boundaries during screen resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - 280;
        const maxY = window.innerHeight - 150;
        return {
          x: Math.max(16, Math.min(prev.x, maxX)),
          y: Math.max(16, Math.min(prev.y, maxY)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag handlers for pointer events (supports mouse and touch screens beautifully!)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag when clicking the drag handle or card background, not on interactive buttons
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
    const maxX = window.innerWidth - (isMinimized ? 160 : 260);
    const maxY = window.innerHeight - (isMinimized ? 70 : 130);

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
      // Background with sleek rounded-ish card look
      ctx.fillStyle = '#0f172a'; // Deep dark slate
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mood-based accent sidebar indicator
      const accentColors: Record<AtmosphereMood, string> = {
        'Deep Focus': '#3b82f6',
        'Calm Mind': '#10b981',
        'Creative Flow': '#6366f1',
        'Light Study': '#f59e0b',
      };
      ctx.fillStyle = accentColors[activeMood] || '#3b82f6';
      ctx.fillRect(0, 0, 8, canvas.height);

      // Topic Text (Trunkated if too long)
      ctx.fillStyle = '#94a3b8'; // Cool slate text
      ctx.font = 'bold 12px system-ui, sans-serif';
      const displayTopic = activeTopic.trim() ? activeTopic : 'Untitled Session';
      const truncatedTopic = displayTopic.length > 22 ? displayTopic.slice(0, 20) + '...' : displayTopic;
      ctx.fillText(truncatedTopic.toUpperCase(), 20, 26);

      // Active Timer Count string
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(formatSecondsToHMS(activeSeconds), 20, 68);

      // Vibe Indicator
      ctx.fillStyle = '#475569';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillText(`Vibe: ${activeMood}`, 20, 92);
    };

    drawCanvas();
  }, [activeSeconds, activeTopic, activeMood, isTimerRunning]);

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
          alert('Your browser does not support streaming a canvas element to Picture-in-Picture.');
          return;
        }

        video.srcObject = stream;
        
        // Wait for video to load metadata/play
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            await video.requestPictureInPicture();
            setIsPipActive(true);
            sound.playChirp();
          } catch (err) {
            console.error('Failed to enter Picture-in-Picture mode:', err);
            alert('Picture-in-Picture could not start. Please ensure user interaction is active.');
          }
        };
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Monitor PiP status natively
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
      {/* Invisible HTML elements for browser Picture-in-Picture stream rendering */}
      <canvas ref={canvasRef} width={250} height={110} className="hidden" />
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Floating Widget Panel */}
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
        className={`fixed z-50 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md shadow-2xl transition-shadow duration-300 select-none ${
          isDragging ? 'shadow-slate-400/30 cursor-grabbing border-primary/30 ring-2 ring-primary/5' : 'shadow-slate-300/20 cursor-grab hover:border-slate-300'
        } ${isMinimized ? 'w-[150px] p-3' : 'w-[250px] p-4.5'}`}
        id="floating-timer-widget"
      >
        {/* Compact layout */}
        {isMinimized ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="cursor-move text-slate-300 hover:text-slate-500">
                <Move size={12} />
              </span>
              <button
                onClick={() => setIsMinimized(false)}
                className="text-slate-400 hover:text-slate-800 text-[10px] font-bold"
                title="Expand Floating Controller"
              >
                Expand
              </button>
            </div>
            <span className="font-mono text-xl font-bold text-primary tracking-tight">
              {formatSecondsToHMS(activeSeconds)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={isTimerPaused ? resumeTimer : pauseTimer}
                className="p-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 cursor-pointer"
                title={isTimerPaused ? 'Resume' : 'Pause'}
              >
                {isTimerPaused ? <Play size={10} fill="currentColor" /> : <Pause size={10} />}
              </button>
              <button
                onClick={stopAndSaveTimer}
                className="p-1 rounded-lg bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 cursor-pointer"
                title="Save & End"
              >
                <Square size={10} fill="currentColor" className="stroke-none" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {/* Header: Draggable Grip Indicator + Minimize button */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100/60">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Move size={14} className="cursor-move animate-pulse shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[120px]">
                  {activeTopic.trim() ? activeTopic : 'Focus Session'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Switch view screen toggle */}
                <button
                  onClick={maximizeToTimerTab}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                  title="Maximize to Tab"
                >
                  <ExternalLink size={12} />
                </button>
                {/* Minimize block */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                  title="Minimize Panel"
                >
                  <Minimize2 size={12} />
                </button>
              </div>
            </div>

            {/* Time string layout */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-2xl font-bold text-primary tracking-tight leading-none tabular-nums">
                  {formatSecondsToHMS(activeSeconds)}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-300 mt-1">
                  {isTimerPaused ? 'Session Paused' : `${activeMood} active`}
                </span>
              </div>

              {/* PiP System-Wide Button */}
              <button
                onClick={handleTogglePip}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  isPipActive
                    ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/15'
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-500'
                }`}
                title={isPipActive ? 'Close Pop-Out Timer' : 'Pop-Out Native System Timer'}
              >
                <Tv size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wide">PIP</span>
              </button>
            </div>

            {/* Bottom Row Controls */}
            <div className="flex justify-between items-center gap-2 mt-1">
              {/* Play Pause */}
              <button
                onClick={isTimerPaused ? resumeTimer : pauseTimer}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isTimerPaused ? (
                  <>
                    <Play size={10} fill="currentColor" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause size={10} />
                    <span>Pause</span>
                  </>
                )}
              </button>

              {/* End */}
              <button
                onClick={stopAndSaveTimer}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Square size={10} fill="currentColor" className="stroke-none" />
                <span>Save</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
