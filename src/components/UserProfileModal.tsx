/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Camera, Upload, Check, X, LogOut, Edit3, Shield, Smile, AlertCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
  initialMode?: 'login' | 'edit' | 'view';
}

const PRESET_AVATARS = [
  '/shaheem.png',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Milo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=FocusBot',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ZenMaster',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Serene',
];

export default function UserProfileModal({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onLogout,
  initialMode = 'view',
}: UserProfileModalProps) {
  const [mode, setMode] = useState<'login' | 'edit' | 'view'>(initialMode);
  
  // Login form state
  const [loginName, setLoginName] = useState(userProfile.name || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Edit form state
  const [editName, setEditName] = useState(userProfile.name);
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(userProfile.avatarUrl);
  const [editPassword, setEditPassword] = useState(userProfile.password || '');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(userProfile.isLoggedIn ? initialMode : 'login');
      setLoginName(userProfile.name || 'Focus Scholar');
      setLoginPassword('');
      setLoginError('');
      setEditName(userProfile.name || 'Focus Scholar');
      setEditBio(userProfile.bio || 'Chasing digital silence and productivity.');
      setEditAvatarUrl(userProfile.avatarUrl || '/shaheem.png');
      setEditPassword(userProfile.password || '');
    }
  }, [isOpen, userProfile, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim()) {
      setLoginError('Please enter a username.');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Password is required.');
      return;
    }

    // Low secure verification: if user already has a saved password, check it.
    // If not, or if logging in with new credentials, update and log in!
    if (userProfile.password && userProfile.password !== loginPassword && userProfile.name.toLowerCase() === loginName.trim().toLowerCase()) {
      setLoginError('Incorrect password for this user profile.');
      return;
    }

    onUpdateProfile({
      name: loginName.trim(),
      password: loginPassword.trim(),
      isLoggedIn: true,
      avatarUrl: userProfile.avatarUrl || '/shaheem.png',
      bio: userProfile.bio || 'Chasing digital silence and productivity.',
    });
    setMode('view');
    onClose();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Username cannot be empty.');
      return;
    }
    onUpdateProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl,
      password: editPassword.trim() || undefined,
      isLoggedIn: true,
    });
    setMode('view');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customImageUrl.trim()) {
      setEditAvatarUrl(customImageUrl.trim());
      setCustomImageUrl('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        id="user-profile-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={18} />
            </div>
            <h3 className="font-sans text-base font-bold text-slate-900">
              {mode === 'login' ? 'User Profile Login' : mode === 'edit' ? 'Edit Profile' : 'User Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 mx-auto mb-3 flex items-center justify-center overflow-hidden">
                  <img src={userProfile.avatarUrl || '/shaheem.png'} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">Welcome to FocusFlow</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Log in with your name and password to access your personalized focus dashboard.
                </p>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  User Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="Enter your username..."
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-slate-400 font-normal">Low Secure Required</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter or create password..."
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  If this is your first time, the entered password will be set as your account password.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Shield size={16} />
                <span>Log In / Access Profile</span>
              </button>
            </form>
          )}

          {/* VIEW MODE */}
          {mode === 'view' && (
            <div className="flex flex-col gap-6 items-center text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img src={userProfile.avatarUrl || '/shaheem.png'} alt={userProfile.name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Online & Focused"></span>
              </div>

              <div className="flex flex-col gap-1">
                <h4 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-1.5">
                  <span>{userProfile.name}</span>
                  <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                </h4>
                <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed mx-auto">
                  {userProfile.bio || 'Chasing digital silence and productivity.'}
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 text-left">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    Logged In
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security</span>
                  <span className="text-xs font-bold text-slate-700 mt-0.5">Password Protected</span>
                </div>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setMode('edit')}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="py-2.5 px-4 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}

          {/* EDIT MODE */}
          {mode === 'edit' && (
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              {/* Avatar Selector Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => setShowAvatarPresets(!showAvatarPresets)}>
                  <div className="w-20 h-20 rounded-full border-2 border-primary/30 overflow-hidden bg-slate-50 shadow-inner flex items-center justify-center">
                    <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={18} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAvatarPresets(!showAvatarPresets)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Smile size={14} />
                    <span>Choose Preset</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <Upload size={14} />
                    <span>Upload Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Preset Avatars Grid */}
                {showAvatarPresets && (
                  <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-in fade-in duration-150 flex flex-col gap-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Preset Avatar</span>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setEditAvatarUrl(url);
                            setShowAvatarPresets(false);
                          }}
                          className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 bg-white ${
                            editAvatarUrl === url ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={url} alt="preset" className="w-full h-full object-cover rounded-lg" />
                        </button>
                      ))}
                    </div>
                    {/* Custom URL Input */}
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="url"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="Or paste image URL..."
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Name Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Bio Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bio / Status Phrase
                </label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="E.g. Chasing digital silence..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                  <span>Password</span>
                  <span className="text-[10px] font-normal text-slate-400">Required for access</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Set or update password..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-hover flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check size={15} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
