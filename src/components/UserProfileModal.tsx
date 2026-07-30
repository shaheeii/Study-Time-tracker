/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Camera, Upload, Check, X, LogOut, Edit3, Shield, Smile, AlertCircle, Sparkles, CheckCircle2, XCircle, UserCheck, Mail } from 'lucide-react';
import { UserProfile } from '../types';
import { recordLoginEvent } from '../utils';

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
  const [loginEmail, setLoginEmail] = useState(userProfile.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Edit form state
  const [editName, setEditName] = useState(userProfile.name);
  const [editEmail, setEditEmail] = useState(userProfile.email || '');
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(userProfile.avatarUrl);
  const [editPassword, setEditPassword] = useState(userProfile.password || '');
  const [editError, setEditError] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(userProfile.isLoggedIn ? initialMode : 'login');
      setLoginName(userProfile.isLoggedIn ? userProfile.name || '' : '');
      setLoginEmail(userProfile.isLoggedIn ? userProfile.email || '' : '');
      setLoginPassword('');
      setLoginError('');
      setEditError('');
      setEditName(userProfile.name || '');
      setEditEmail(userProfile.email || '');
      setEditBio(userProfile.bio || 'Chasing digital silence and productivity.');
      setEditAvatarUrl(userProfile.avatarUrl || '/shaheem.png');
      setEditPassword(userProfile.password || '');
    }
  }, [isOpen, userProfile, initialMode]);

  if (!isOpen) return null;

  // Real-time unique username & Email availability checker
  const checkUsernameAvailability = (nameInput: string, emailInput?: string, excludeKey?: string) => {
    const cleanName = nameInput.trim();
    const cleanEmail = (emailInput || '').trim().toLowerCase();

    if (!cleanName && !cleanEmail) return { status: 'empty' as const, targetUserId: '', message: '' };

    const targetUserId = 'user_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dbKey = 'focusflow_users_db_v1';
    let usersDb: Record<string, UserProfile> = {};
    try {
      usersDb = JSON.parse(localStorage.getItem(dbKey) || '{}');
    } catch (e) {}

    const matchedKey = Object.keys(usersDb).find((key) => {
      if (excludeKey && key === excludeKey) return false;
      if (cleanName && key === targetUserId) return true;
      const u = usersDb[key];
      const nameMatch = Boolean(cleanName && u.name && u.name.toLowerCase().trim() === cleanName.toLowerCase());
      const emailMatch = Boolean(cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail);
      return nameMatch || emailMatch;
    });

    if (matchedKey) {
      return {
        status: 'taken' as const,
        targetUserId: matchedKey,
        existingUser: usersDb[matchedKey],
        message: `Registered Account Found (ID: ${matchedKey})`,
      };
    }

    return {
      status: 'available' as const,
      targetUserId,
      message: `Username Available (ID: ${targetUserId})`,
    };
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const normalizedName = loginName.trim();
    const normalizedEmail = loginEmail.trim().toLowerCase();

    if (!normalizedName) {
      setLoginError('Please enter a username.');
      return;
    }

    const cleanPassword = loginPassword.trim();
    if (!cleanPassword) {
      setLoginError('Password is required.');
      return;
    }

    if (cleanPassword.length < 8) {
      setLoginError('Password must be at least 8 characters long.');
      return;
    }

    const targetUserId = 'user_' + normalizedName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedName,
          email: normalizedEmail || undefined,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Authentication failed');
        recordLoginEvent(targetUserId, normalizedName, 'Failed', data.error || 'Incorrect password');
        return;
      }

      if (data.users) {
        localStorage.setItem('focusflow_users_db_v1', JSON.stringify(data.users));
      }

      if (data.user) {
        recordLoginEvent(targetUserId, normalizedName, 'Success');
        onUpdateProfile(data.user);
        setMode('view');
        onClose();
        return;
      }
    } catch (err) {
      console.warn('Backend API offline, falling back to local storage authentication:', err);
    }

    // Fallback local authentication if server unavailable
    const dbKey = 'focusflow_users_db_v1';
    let usersDb: Record<string, UserProfile> = {};
    try {
      usersDb = JSON.parse(localStorage.getItem(dbKey) || '{}');
    } catch (e) {}

    // Check if account already exists by key, case-insensitive username, or email
    const matchedKey = Object.keys(usersDb).find((key) => {
      if (key === targetUserId) return true;
      const u = usersDb[key];
      const nameMatch = Boolean(u.name && u.name.toLowerCase().trim() === normalizedName.toLowerCase());
      const emailMatch = Boolean(normalizedEmail && u.email && u.email.toLowerCase().trim() === normalizedEmail);
      return nameMatch || emailMatch;
    });

    if (matchedKey) {
      const existingUser = usersDb[matchedKey];
      // Account exists, verify password strictly
      if (existingUser.password && existingUser.password !== cleanPassword) {
        recordLoginEvent(matchedKey, normalizedName, 'Failed', 'Incorrect password for registered username');
        setLoginError(`Username "${existingUser.name}" belongs to a registered user. Incorrect password. Each username belongs to exactly one user account.`);
        return;
      }

      // Password correct! Log in as existing user
      recordLoginEvent(matchedKey, normalizedName, 'Success');
      const updatedUser: UserProfile = {
        ...existingUser,
        email: normalizedEmail || existingUser.email,
        isLoggedIn: true,
        lastLoginAt: new Date().toISOString(),
        loginCount: (existingUser.loginCount || 0) + 1,
      };
      onUpdateProfile(updatedUser);
    } else {
      // Registering new account: Check if username or email is taken by any other user
      const nameTaken = Object.values(usersDb).some(
        (u) => u.name && u.name.toLowerCase().trim() === normalizedName.toLowerCase()
      );
      if (nameTaken) {
        setLoginError(`Username "${normalizedName}" is already registered to another user. Each username can only belong to one user.`);
        return;
      }

      if (normalizedEmail) {
        const emailTaken = Object.values(usersDb).some(
          (u) => u.email && u.email.toLowerCase().trim() === normalizedEmail
        );
        if (emailTaken) {
          setLoginError(`Email address "${normalizedEmail}" is already registered to another user account.`);
          return;
        }
      }

      // Safe to create new unique user account
      recordLoginEvent(targetUserId, normalizedName, 'Success');
      const isFirstAdmin = normalizedName.toLowerCase() === 'admin' || normalizedName.toLowerCase() === 'shaheem';
      const newUser: UserProfile = {
        name: normalizedName,
        email: normalizedEmail || undefined,
        password: cleanPassword,
        isLoggedIn: true,
        avatarUrl: '/shaheem.png',
        bio: 'Outside registered scholar.',
        role: isFirstAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
      };
      onUpdateProfile(newUser);
    }

    setMode('view');
    onClose();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    const cleanName = editName.trim();
    const cleanEmail = editEmail.trim().toLowerCase();
    const cleanPassword = editPassword.trim();

    if (!cleanName) {
      setEditError('Username cannot be empty.');
      return;
    }

    if (!cleanPassword) {
      setEditError('Password is required.');
      return;
    }

    if (cleanPassword.length < 8) {
      setEditError('Password must be at least 8 characters long.');
      return;
    }

    const dbKey = 'focusflow_users_db_v1';
    let usersDb: Record<string, UserProfile> = {};
    try {
      usersDb = JSON.parse(localStorage.getItem(dbKey) || '{}');
    } catch (e) {}

    const currentUserId = 'user_' + (userProfile.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newUserId = 'user_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check username conflict with other users
    const usernameTaken = Object.keys(usersDb).some((key) => {
      if (key === currentUserId) return false;
      const u = usersDb[key];
      return key === newUserId || Boolean(u.name && u.name.toLowerCase().trim() === cleanName.toLowerCase());
    });

    if (usernameTaken) {
      setEditError(`The username "${cleanName}" is already taken by another user account. Each username can only belong to one user.`);
      return;
    }

    // Check email conflict with other users
    if (cleanEmail) {
      const emailTaken = Object.keys(usersDb).some((key) => {
        if (key === currentUserId) return false;
        const u = usersDb[key];
        return Boolean(u.email && u.email.toLowerCase().trim() === cleanEmail);
      });

      if (emailTaken) {
        setEditError(`The email "${cleanEmail}" is already registered to another user account.`);
        return;
      }
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      name: cleanName,
      email: cleanEmail || undefined,
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl,
      password: cleanPassword,
      isLoggedIn: true,
    };

    if (newUserId !== currentUserId) {
      // Migrate existing user sessions, settings, and state so user data is never lost
      const oldSessions = localStorage.getItem(`focusflow_sessions_v1_${currentUserId}`);
      if (oldSessions) {
        localStorage.setItem(`focusflow_sessions_v1_${newUserId}`, oldSessions);
        localStorage.removeItem(`focusflow_sessions_v1_${currentUserId}`);
      }

      const oldSettings = localStorage.getItem(`focusflow_settings_v1_${currentUserId}`);
      if (oldSettings) {
        localStorage.setItem(`focusflow_settings_v1_${newUserId}`, oldSettings);
        localStorage.removeItem(`focusflow_settings_v1_${currentUserId}`);
      }

      const oldState = localStorage.getItem(`focusflow_user_state_v1_${currentUserId}`);
      if (oldState) {
        localStorage.setItem(`focusflow_user_state_v1_${newUserId}`, oldState);
        localStorage.removeItem(`focusflow_user_state_v1_${currentUserId}`);
      }

      // Delete old key in users db
      delete usersDb[currentUserId];
      localStorage.setItem(dbKey, JSON.stringify(usersDb));
    }

    // Post to backend server API
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userKey: newUserId,
        oldUserKey: currentUserId,
        updatedProfile,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          localStorage.setItem(dbKey, JSON.stringify(data.users));
        }
      })
      .catch(() => {});

    onUpdateProfile(updatedProfile);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        id="user-profile-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={18} />
            </div>
            <h3 className="font-sans text-base font-bold text-slate-900 dark:text-slate-100">
              {mode === 'login' ? 'User Profile Login' : mode === 'edit' ? 'Edit Profile' : 'User Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Welcome to padikkanam</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Log in with your name and password to access your personalized focus dashboard.
                </p>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>User Name</span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                    ID: {loginName.trim() ? 'user_' + loginName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : 'unique_id'}
                  </span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="Enter your unique username..."
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                {/* Real-time Username ID Availability Indicator */}
                {loginName.trim().length > 0 && (() => {
                  const check = checkUsernameAvailability(loginName, loginEmail);
                  if (check.status === 'taken') {
                    return (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium animate-fade-in">
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Registered Account Found! Enter password to log in.</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium animate-fade-in">
                        <Sparkles size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                        <span>Username Available! New unique user account will be created.</span>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Email Input Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Email Address <span className="text-[10px] text-slate-400 font-normal uppercase">(Optional)</span></span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">Min. 8 characters</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password (min. 8 chars)..."
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Usernames are strictly unique. Each username can belong to only one user account.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-md overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <img src={userProfile.avatarUrl || '/shaheem.png'} alt={userProfile.name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online & Focused"></span>
              </div>

              <div className="flex flex-col gap-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
                  <span>{userProfile.name}</span>
                  <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                </h4>
                {userProfile.email && (
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    <span>{userProfile.email}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed mx-auto mt-0.5">
                  {userProfile.bio || 'Chasing digital silence and productivity.'}
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100/80 dark:border-slate-800 text-left">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    Logged In
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Security</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">Password Protected</span>
                </div>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setMode('edit')}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="py-2.5 px-4 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
              {editError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Avatar Selector Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => setShowAvatarPresets(!showAvatarPresets)}>
                  <div className="w-20 h-20 rounded-full border-2 border-primary/30 overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center">
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
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Smile size={14} />
                    <span>Choose Preset</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
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
                  <div className="w-full bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150 flex flex-col gap-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Select Preset Avatar</span>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setEditAvatarUrl(url);
                            setShowAvatarPresets(false);
                          }}
                          className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 bg-white dark:bg-slate-900 cursor-pointer ${
                            editAvatarUrl === url ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
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
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-2.5 py-1.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Name Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Display Name</span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                    ID: {editName.trim() ? 'user_' + editName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : 'unique_id'}
                  </span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />

                {/* Real-time username availability check in edit mode */}
                {editName.trim().length > 0 && (() => {
                  const currentUserId = 'user_' + (userProfile.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const check = checkUsernameAvailability(editName, editEmail, currentUserId);
                  if (check.status === 'taken') {
                    return (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300 font-medium animate-fade-in">
                        <XCircle size={14} className="shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>Username/Email Taken! ID <code className="font-mono">{check.targetUserId}</code> or email belongs to another account.</span>
                      </div>
                    );
                  } else if (editName.trim().toLowerCase() !== (userProfile.name || '').toLowerCase()) {
                    return (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium animate-fade-in">
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Username Available! New ID: <code className="font-mono">{check.targetUserId}</code>.</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Bio Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Bio / Status Phrase
                </label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="E.g. Chasing digital silence..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between items-center">
                  <span>Password</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">Min. 8 characters</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Set or update password (min. 8 chars)..."
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-hover flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
