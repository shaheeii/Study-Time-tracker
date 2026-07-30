/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  TrendingUp,
  LogIn,
  Search,
  Lock,
  Unlock,
  Key,
  Trash2,
  RefreshCw,
  Clock,
  Award,
  BarChart2,
  AlertCircle,
  X,
  CheckCircle2,
  XCircle,
  Download,
  ShieldAlert,
  UserCheck,
  ChevronRight,
  Database,
  Sparkles,
  Eye,
  EyeOff,
  Radio,
  Play,
  Pause,
  Activity,
  Mail,
  Globe,
  User,
  Copy
} from 'lucide-react';
import { UserProfile, LoginLogEvent, StudySession } from '../types';
import { formatSecondsToHMS } from '../utils';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateCurrentUser: (profile: UserProfile) => void;
}

export default function AdminDashboardModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateCurrentUser,
}: AdminDashboardModalProps) {
  // Authorization State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  // Active Tab: 'logins' | 'growth' | 'profiles' | 'live' | 'system'
  const [activeTab, setActiveTab] = useState<'logins' | 'growth' | 'profiles' | 'live' | 'system'>('live');

  // Data States & Live Clock Ticker
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loginLogs, setLoginLogs] = useState<LoginLogEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPasswordUserKey, setEditingPasswordUserKey] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPasswordsMap, setShowPasswordsMap] = useState<Record<string, boolean>>({});
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [nowTicker, setNowTicker] = useState(Date.now());

  const togglePasswordVisibility = (userKey: string) => {
    setShowPasswordsMap((prev) => ({
      ...prev,
      [userKey]: !prev[userKey],
    }));
  };

  // Real-time 1-second ticker for live active study timers
  useEffect(() => {
    if (!isOpen || !isAdminAuthenticated) return;
    const interval = setInterval(() => {
      setNowTicker(Date.now());
      loadAdminData();
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isAdminAuthenticated]);

  // Check if admin session token exists on mount or modal toggle
  useEffect(() => {
    if (isOpen) {
      const adminToken = localStorage.getItem('focusflow_admin_auth_session');
      if (adminToken === 'true') {
        setIsAdminAuthenticated(true);
      } else {
        setIsAdminAuthenticated(false);
      }
      loadAdminData();
    }
  }, [isOpen]);

  const loadAdminData = () => {
    // 1. Load Users Database
    const dbKey = 'focusflow_users_db_v1';
    let loadedUsers: Record<string, UserProfile> = {};
    try {
      loadedUsers = JSON.parse(localStorage.getItem(dbKey) || '{}');
    } catch (e) {
      console.error('Failed to load users db:', e);
    }

    // 2. Load Login Logs
    const logsKey = 'focusflow_login_logs_v1';
    let loadedLogs: LoginLogEvent[] = [];
    try {
      loadedLogs = JSON.parse(localStorage.getItem(logsKey) || '[]');
    } catch (e) {
      console.error('Failed to load login logs:', e);
    }
    setLoginLogs(loadedLogs);

    // 3. Auto-discover all outside/external users who logged in or created keys in localStorage
    // a) From login logs:
    loadedLogs.forEach((log) => {
      if (log.username && log.username.trim().toLowerCase() !== 'guest') {
        const userKey = log.userId || ('user_' + log.username.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
        if (!loadedUsers[userKey]) {
          const isAdmin = log.username.toLowerCase() === 'admin' || log.username.toLowerCase() === 'shaheem';
          loadedUsers[userKey] = {
            name: log.username,
            isLoggedIn: false,
            role: isAdmin ? 'admin' : 'user',
            avatarUrl: '/shaheem.png',
            bio: 'Outside registered user',
            createdAt: log.timestamp,
            lastLoginAt: log.timestamp,
            loginCount: 1,
          };
        } else {
          const existing = loadedUsers[userKey];
          if (!existing.lastLoginAt || new Date(log.timestamp) > new Date(existing.lastLoginAt)) {
            existing.lastLoginAt = log.timestamp;
          }
        }
      }
    });

    // b) From localStorage keys (sessions, user state, settings)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('focusflow_sessions_v1_') || k.startsWith('focusflow_user_state_v1_') || k.startsWith('focusflow_settings_v1_'))) {
          const userKey = k.replace(/^focusflow_(sessions_v1|user_state_v1|settings_v1)_/, '');
          if (userKey && userKey !== 'guest' && !loadedUsers[userKey]) {
            const rawName = userKey.replace(/^user_/, '').replace(/_/g, ' ');
            const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            const isAdmin = rawName.toLowerCase() === 'admin' || rawName.toLowerCase() === 'shaheem';
            loadedUsers[userKey] = {
              name: formattedName || 'Outside User',
              isLoggedIn: false,
              role: isAdmin ? 'admin' : 'user',
              avatarUrl: '/shaheem.png',
              bio: 'Outside registered user',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              loginCount: 1,
            };
          }
        }
      }
    } catch (e) {}

    // c) Ensure current user exists in database if logged in
    const currentKey = 'user_' + (currentUser.name || 'guest').toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (currentUser.isLoggedIn && currentUser.name) {
      loadedUsers[currentKey] = {
        ...loadedUsers[currentKey],
        ...currentUser,
        createdAt: currentUser.createdAt || loadedUsers[currentKey]?.createdAt || new Date().toISOString(),
        role: currentUser.role || (currentUser.name.toLowerCase() === 'admin' || currentUser.name.toLowerCase() === 'shaheem' ? 'admin' : 'user'),
      };
    }

    localStorage.setItem(dbKey, JSON.stringify(loadedUsers));
    setUsersMap(loadedUsers);

    // 4. Fetch real-time server database for all outside/external users
    fetch('/api/admin/data')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const serverUsers: Record<string, UserProfile> = data.users || {};
          const serverLogs: LoginLogEvent[] = data.logs || [];

          const mergedUsers = { ...loadedUsers, ...serverUsers };
          setUsersMap(mergedUsers);
          localStorage.setItem(dbKey, JSON.stringify(mergedUsers));

          if (serverLogs.length > 0) {
            setLoginLogs(serverLogs);
            localStorage.setItem(logsKey, JSON.stringify(serverLogs));
          }
        }
      })
      .catch((e) => console.error('Error fetching backend admin data:', e));
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanPass = passcode.trim();
    if (!cleanPass) {
      setAuthError('Please enter admin password.');
      return;
    }

    // Passcode validation: 'shaheemcode0880', 'admin123', 'admin', or current user's password
    const isMasterPasscode = cleanPass === 'shaheemcode0880' || cleanPass === 'admin123' || cleanPass === 'shaheem';
    const isUserPasscode = currentUser.password && cleanPass === currentUser.password;

    const currentKey = 'user_' + (currentUser.name || 'admin').toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (isMasterPasscode || isUserPasscode) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('focusflow_admin_auth_session', 'true');
      
      // Import recordLoginEvent dynamically or log event in storage
      const logsKey = 'focusflow_login_logs_v1';
      try {
        const logs: LoginLogEvent[] = JSON.parse(localStorage.getItem(logsKey) || '[]');
        logs.unshift({
          id: 'log_admin_' + Date.now(),
          userId: currentKey,
          username: currentUser.name || 'Admin',
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1 (Admin Session)',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
          status: 'Success',
          failureReason: 'Unlocked Admin Control Panel',
        });
        localStorage.setItem(logsKey, JSON.stringify(logs));
      } catch (e) {}

      // Upgrade current profile role to admin if not already
      if (currentUser.role !== 'admin') {
        const updatedProfile: UserProfile = { ...currentUser, role: 'admin' };
        onUpdateCurrentUser(updatedProfile);
      }
      setPasscode('');
      loadAdminData();
    } else {
      const logsKey = 'focusflow_login_logs_v1';
      try {
        const logs: LoginLogEvent[] = JSON.parse(localStorage.getItem(logsKey) || '[]');
        logs.unshift({
          id: 'log_admin_fail_' + Date.now(),
          userId: currentKey,
          username: currentUser.name || 'Visitor',
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1 (Admin Session)',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
          status: 'Failed',
          failureReason: 'Incorrect Admin Password',
        });
        localStorage.setItem(logsKey, JSON.stringify(logs));
      } catch (e) {}

      setAuthError('Access Denied: Invalid Admin Password!');
    }
  };

  const handleLockPanel = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('focusflow_admin_auth_session');
  };

  const handleToggleUserRole = (userKey: string) => {
    const user = usersMap[userKey];
    if (!user) return;

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const updatedUser = { ...user, role: newRole };

    const updatedMap = { ...usersMap, [userKey]: updatedUser };
    setUsersMap(updatedMap);
    localStorage.setItem('focusflow_users_db_v1', JSON.stringify(updatedMap));

    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey, updatedProfile: { role: newRole } }),
    }).catch(() => {});

    // If updating current user's profile
    const currentKey = 'user_' + (currentUser.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (userKey === currentKey) {
      onUpdateCurrentUser({ ...currentUser, role: newRole });
    }

    showSuccessToast(`Role for ${user.name} updated to ${newRole.toUpperCase()}`);
  };

  const handleResetPassword = (userKey: string) => {
    if (!newPasswordValue.trim() || newPasswordValue.trim().length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    const user = usersMap[userKey];
    if (!user) return;

    const newPass = newPasswordValue.trim();
    const updatedUser = { ...user, password: newPass };
    const updatedMap = { ...usersMap, [userKey]: updatedUser };
    setUsersMap(updatedMap);
    localStorage.setItem('focusflow_users_db_v1', JSON.stringify(updatedMap));

    fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey, newPassword: newPass }),
    }).catch(() => {});

    setEditingPasswordUserKey(null);
    setNewPasswordValue('');
    showSuccessToast(`Password reset successfully for ${user.name}`);
  };

  const handleDeleteUser = (userKey: string) => {
    const user = usersMap[userKey];
    if (!user) return;

    if (!window.confirm(`Are you sure you want to delete user profile "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    const updatedMap = { ...usersMap };
    delete updatedMap[userKey];
    setUsersMap(updatedMap);
    localStorage.setItem('focusflow_users_db_v1', JSON.stringify(updatedMap));

    fetch('/api/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey }),
    }).catch(() => {});

    // Remove user storage keys
    localStorage.removeItem(`focusflow_sessions_v1_${userKey}`);
    localStorage.removeItem(`focusflow_settings_v1_${userKey}`);
    localStorage.removeItem(`focusflow_user_state_v1_${userKey}`);

    showSuccessToast(`User account "${user.name}" deleted successfully.`);
  };

  const handleSeedDemoUsers = () => {
    const dbKey = 'focusflow_users_db_v1';
    const existing = { ...usersMap };

    const demoProfiles: UserProfile[] = [
      {
        name: 'Alex Rivera',
        avatarUrl: '/shaheem.png',
        bio: 'Computer Science major working on AI models.',
        password: 'password123',
        isLoggedIn: false,
        role: 'user',
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        loginCount: 12,
      },
      {
        name: 'Sofia Chen',
        avatarUrl: '/shaheem.png',
        bio: 'Designing digital interfaces & mastering focus flows.',
        password: 'password123',
        isLoggedIn: false,
        role: 'user',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        loginCount: 19,
      },
      {
        name: 'David Miller',
        avatarUrl: '/shaheem.png',
        bio: 'Medical scholar studying neuroscience & biology.',
        password: 'password123',
        isLoggedIn: false,
        role: 'user',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        loginCount: 6,
      },
    ];

    demoProfiles.forEach((p) => {
      const key = 'user_' + p.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!existing[key]) {
        existing[key] = p;
        // Seed mock study sessions for user
        const mockSessions: StudySession[] = [
          {
            id: 'sess_1_' + key,
            topic: 'Deep Research & Reading',
            duration: 3600 * 3,
            timestamp: new Date().toISOString(),
            status: 'Completed',
          },
          {
            id: 'sess_2_' + key,
            topic: 'Algorithm Practice',
            duration: 1800 * 2,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            status: 'Completed',
          },
        ];
        localStorage.setItem(`focusflow_sessions_v1_${key}`, JSON.stringify(mockSessions));
      }
    });

    setUsersMap(existing);
    localStorage.setItem(dbKey, JSON.stringify(existing));
    showSuccessToast('Demo study accounts seeded into database!');
  };

  const handleExportData = () => {
    const exportObject = {
      app: 'FocusFlow Admin Export',
      exportedAt: new Date().toISOString(),
      usersCount: Object.keys(usersMap).length,
      users: usersMap,
      loginLogs: loginLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `focusflow_admin_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showSuccessToast('Full admin JSON database exported successfully!');
  };

  const showSuccessToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage('');
    }, 4000);
  };

  // Live Status Resolver for any User
  const getUserLiveStatus = (userKey: string, user: UserProfile) => {
    let savedState: any = null;
    try {
      savedState = JSON.parse(localStorage.getItem(`focusflow_user_state_v1_${userKey}`) || 'null');
    } catch (e) {}

    const isCurrentActiveUser = userKey === ('user_' + (currentUser.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_'));

    if (savedState?.isTimerRunning) {
      let currentSecs = savedState.accumulatedSeconds || 0;
      if (savedState.currentRunStartTime && !savedState.isTimerPaused) {
        currentSecs += Math.floor((nowTicker - savedState.currentRunStartTime) / 1000);
      }
      return {
        statusType: 'studying' as const,
        statusLabel: 'Studying Live',
        topic: savedState.activeTopic || 'Deep Focus Session',
        seconds: Math.max(0, currentSecs),
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        dotColor: 'bg-emerald-500 animate-pulse',
      };
    }

    if (savedState?.isTimerPaused) {
      return {
        statusType: 'paused' as const,
        statusLabel: 'Timer Paused',
        topic: savedState.activeTopic || 'Focus Session',
        seconds: savedState.accumulatedSeconds || 0,
        badgeBg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        dotColor: 'bg-amber-500',
      };
    }

    const lastSeenTime = user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;
    const isOnline = user.isLoggedIn || isCurrentActiveUser || (nowTicker - lastSeenTime < 15 * 60 * 1000);

    if (isOnline) {
      return {
        statusType: 'online' as const,
        statusLabel: 'Online & Idle',
        topic: 'Dashboard Active',
        seconds: 0,
        badgeBg: 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        dotColor: 'bg-blue-500',
      };
    }

    return {
      statusType: 'offline' as const,
      statusLabel: 'Offline',
      topic: 'Inactive',
      seconds: 0,
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      dotColor: 'bg-slate-400',
    };
  };

  // Analytics Computations
  const userList = useMemo(() => Object.entries(usersMap), [usersMap, nowTicker]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return userList;
    const q = searchQuery.toLowerCase().trim();
    return userList.filter(([key, u]) => {
      return (
        key.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.password && u.password.toLowerCase().includes(q))
      );
    });
  }, [userList, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return loginLogs;
    const q = searchQuery.toLowerCase().trim();
    return loginLogs.filter((l) => {
      return (
        l.username.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        (l.failureReason && l.failureReason.toLowerCase().includes(q)) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q))
      );
    });
  }, [loginLogs, searchQuery]);

  const stats = useMemo(() => {
    const totalUsers = userList.length;
    const adminCount = userList.filter(([, u]) => u.role === 'admin' || u.name?.toLowerCase() === 'admin').length;
    const totalLogins = loginLogs.length;
    const successfulLogins = loginLogs.filter((l) => l.status === 'Success').length;
    const failedLogins = loginLogs.filter((l) => l.status === 'Failed').length;

    // Count live active studying users
    let liveStudyingCount = 0;
    userList.forEach(([key, u]) => {
      const st = getUserLiveStatus(key, u);
      if (st.statusType === 'studying') liveStudyingCount++;
    });

    // Calculate total study hours across all user profiles
    let grandTotalStudySeconds = 0;
    userList.forEach(([key]) => {
      try {
        const sess: StudySession[] = JSON.parse(localStorage.getItem(`focusflow_sessions_v1_${key}`) || '[]');
        sess.forEach((s) => {
          if (s.status === 'Completed') grandTotalStudySeconds += s.duration;
        });
      } catch (e) {}
    });

    const grandTotalStudyHours = (grandTotalStudySeconds / 3600).toFixed(1);

    return {
      totalUsers,
      adminCount,
      learnerCount: Math.max(0, totalUsers - adminCount),
      totalLogins,
      successfulLogins,
      failedLogins,
      liveStudyingCount,
      grandTotalStudyHours,
    };
  }, [userList, loginLogs, nowTicker]);

  // Growth Data Aggregation
  const growthTimeline = useMemo(() => {
    const dateCounts: Record<string, number> = {};

    userList.forEach(([, u]) => {
      const dateStr = u.createdAt ? u.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort();
    let cumulative = 0;
    return sortedDates.map((date) => {
      cumulative += dateCounts[date];
      return {
        date,
        newUsers: dateCounts[date],
        totalUsers: cumulative,
      };
    });
  }, [userList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={22} className="stroke-[2.2px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
                  Admin Control Panel
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Password Protected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live user sessions, audit stream, profile management & growth analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <button
                onClick={handleLockPanel}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Lock Admin Panel"
              >
                <Lock size={14} />
                <span>Lock Panel</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {actionSuccessMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* BODY CONTENT: AUTH GATE vs DASHBOARD */}
        {!isAdminAuthenticated ? (
          /* ADMIN AUTHENTICATION GATE (SHAHEEMCODE0880 REQUIREMENT) */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-sm">
              <ShieldAlert size={32} className="stroke-[2px]" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight mb-2">
              Admin Password Required
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              This panel is protected for authorized administrators. Please enter the master password to unlock live user monitoring and system management tools.
            </p>

            <form onSubmit={handleAdminAuthSubmit} className="w-full flex flex-col gap-4">
              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 text-left">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Admin Password
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin password..."
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Unlock size={16} />
                <span>Unlock Admin Dashboard</span>
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* Navigation Bar Tabs & Search */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setActiveTab('live')}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'live'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Activity size={15} className="text-emerald-500 animate-pulse" />
                  <span>Live Status ({stats.totalUsers})</span>
                </button>

                <button
                  onClick={() => setActiveTab('logins')}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'logins'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LogIn size={15} />
                  <span>Login History ({loginLogs.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('growth')}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'growth'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <TrendingUp size={15} />
                  <span>Users Growth</span>
                </button>

                <button
                  onClick={() => setActiveTab('profiles')}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'profiles'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Users size={15} />
                  <span>User Profiles ({userList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('system')}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'system'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Database size={15} />
                  <span>System Tools</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, topic or status..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* MAIN TAB CONTENT VIEW */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* STATS OVERVIEW HEADER CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Accounts</span>
                    <Users size={16} className="text-indigo-500" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {stats.totalUsers}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {stats.adminCount} Admins · {stats.learnerCount} Scholars
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Live Studying</span>
                    <Radio size={16} className="text-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {stats.liveStudyingCount} Active
                  </span>
                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                    Timer currently running
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Logins</span>
                    <LogIn size={16} className="text-blue-500" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {stats.totalLogins}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {stats.successfulLogins} Success / {stats.failedLogins} Failed
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Hours</span>
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {stats.grandTotalStudyHours}h
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Logged across all accounts
                  </span>
                </div>
              </div>

              {/* TAB 1: REAL-TIME LIVE USER MONITOR (REQUIREMENT) */}
              {activeTab === 'live' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500 animate-pulse" />
                        <span>Real-Time Live Users Status Monitor</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                        Live Sync 1s
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {userList.length} Accounts Tracked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUsers.map(([key, user]) => {
                      const liveStatus = getUserLiveStatus(key, user);
                      const isCurrentAppUser = key === ('user_' + (currentUser.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_'));

                      return (
                        <div
                          key={key}
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                            liveStatus.statusType === 'studying'
                              ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-md shadow-emerald-500/5'
                              : liveStatus.statusType === 'paused'
                              ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                                  {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="font-bold text-lg text-primary">{user.name.charAt(0)}</span>
                                  )}
                                </div>
                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${liveStatus.dotColor}`} />
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                    {user.name}
                                  </h4>
                                  {user.role === 'admin' || user.name?.toLowerCase() === 'admin' ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-0.5">
                                      <ShieldCheck size={10} />
                                      Admin
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-0.5">
                                      <Globe size={10} />
                                      Outside User
                                    </span>
                                  )}
                                  {isCurrentAppUser && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                {user.email ? (
                                  <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                                    <Mail size={11} className="shrink-0" />
                                    <span className="truncate max-w-[150px]">{user.email}</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-400 block">ID: {key}</span>
                                )}
                              </div>
                            </div>

                            {/* Live Status Badge */}
                            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${liveStatus.badgeBg}`}>
                              <span className={`w-2 h-2 rounded-full ${liveStatus.dotColor}`} />
                              <span>{liveStatus.statusLabel}</span>
                            </div>
                          </div>

                          {/* Active Topic Banner / Live Timer */}
                          {liveStatus.statusType === 'studying' && (
                            <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs">
                                <Play size={14} className="text-emerald-600 dark:text-emerald-400 fill-emerald-600" />
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                                    Current Topic
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {liveStatus.topic}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                {formatSecondsToHMS(liveStatus.seconds)}
                              </span>
                            </div>
                          )}

                          {liveStatus.statusType === 'paused' && (
                            <div className="p-3 rounded-xl bg-amber-100/60 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs">
                                <Pause size={14} className="text-amber-600 dark:text-amber-400" />
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                                    Paused Topic
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {liveStatus.topic}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono text-sm font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                                {formatSecondsToHMS(liveStatus.seconds)}
                              </span>
                            </div>
                          )}

                          {liveStatus.statusType === 'online' && (
                            <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                              <span>User currently browsing dashboard</span>
                              <span className="text-[10px] font-mono">Ready to study</span>
                            </div>
                          )}

                          {liveStatus.statusType === 'offline' && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                              <span>Last Seen:</span>
                              <span className="font-mono text-[11px]">
                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString() : 'Earlier session'}
                              </span>
                            </div>
                          )}

                          {/* Footer Details */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 font-medium">
                            <div className="flex items-center gap-1 font-mono">
                              <span>Pass:</span>
                              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                                {showPasswordsMap[key] ? (user.password || 'Set') : (user.password ? '••••••••' : 'Set')}
                              </strong>
                              {user.password && (
                                <button
                                  onClick={() => togglePasswordVisibility(key)}
                                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-1"
                                  title={showPasswordsMap[key] ? 'Hide Password' : 'Show Password'}
                                >
                                  {showPasswordsMap[key] ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                              )}
                            </div>
                            <span>Logins: <strong className="text-slate-700 dark:text-slate-300">{user.loginCount || 1}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: LOGIN HISTORY FEED */}
              {activeTab === 'logins' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <LogIn size={16} className="text-indigo-500" />
                      <span>Every User Login Audit Stream</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      Showing {filteredLogs.length} events
                    </span>
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium">
                      No login events recorded yet or no match for search query.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-4 py-3">User</th>
                              <th className="px-4 py-3">Timestamp</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">IP / Device</th>
                              <th className="px-4 py-3">Details / Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                            {filteredLogs.map((log) => {
                              const isSuccess = log.status === 'Success';
                              const matchedUser = (Object.values(usersMap) as UserProfile[]).find(
                                (u) => u.name && u.name.toLowerCase().trim() === log.username.toLowerCase().trim()
                              );
                              const userEmail = matchedUser?.email;

                              return (
                                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                      {log.username.charAt(0)}
                                    </div>
                                    <div>
                                      <span>{log.username}</span>
                                      {userEmail && (
                                        <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-normal">
                                          {userEmail}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                        isSuccess
                                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                      }`}
                                    >
                                      {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-400 text-[11px] font-mono truncate max-w-[150px]">
                                    {log.ipAddress || 'Local Session'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                                    {log.failureReason ? (
                                      <span className="text-rose-500 font-medium">{log.failureReason}</span>
                                    ) : (
                                      <span className="text-slate-400">Authenticated & Restored State</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: USERS GROWTH ANALYTICS */}
              {activeTab === 'growth' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp size={16} className="text-indigo-500" />
                      <span>User Account Growth Metrics & Analytics</span>
                    </h3>
                  </div>

                  {/* Growth Bar Chart / Visualization */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Cumulative User Registrations Timeline
                      </span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                        Total Users: {stats.totalUsers}
                      </span>
                    </div>

                    {growthTimeline.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">No registration timeline data available.</p>
                    ) : (
                      <div className="pt-4 pb-2">
                        <div className="flex items-end gap-3 h-40 border-b border-slate-100 dark:border-slate-800 pb-2 px-2">
                          {growthTimeline.map((item, idx) => {
                            const maxUsers = Math.max(...growthTimeline.map((g) => g.totalUsers), 1);
                            const heightPercent = Math.max(15, (item.totalUsers / maxUsers) * 100);
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-mono pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                  {item.date}: {item.totalUsers} total (+{item.newUsers} new)
                                </div>
                                <div
                                  style={{ height: `${heightPercent}%` }}
                                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 dark:from-indigo-600 dark:to-indigo-500 rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-sm"
                                />
                                <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center">
                                  {item.date.slice(5)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Registered Users Breakdown Table */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      User Join Log Timeline
                    </h4>
                    <div className="space-y-2">
                      {userList.map(([key, user]) => {
                        return (
                          <div
                            key={key}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-slate-900 dark:text-slate-100">{user.name}</h5>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                      user.role === 'admin'
                                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                                        : 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                                    }`}
                                  >
                                    {user.role === 'admin' ? 'Admin' : 'Outside User'}
                                  </span>
                                </div>
                                {user.email ? (
                                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1">
                                    <Mail size={10} />
                                    <span>{user.email}</span>
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-slate-400 font-mono">ID: {key}</p>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-mono text-slate-500 block">
                                Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Initial Session'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                Logins: {user.loginCount || 1}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: USER PROFILES DIRECTORY */}
              {activeTab === 'profiles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Users size={16} className="text-indigo-500" />
                      <span>User Profiles Directory ({filteredUsers.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUsers.map(([key, user]) => {
                      const isAdmin = user.role === 'admin' || user.name?.toLowerCase() === 'admin';
                      const isEditingPassword = editingPasswordUserKey === key;
                      const liveStatus = getUserLiveStatus(key, user);

                      // Compute total study hours for user
                      let userStudySeconds = 0;
                      let userSessionCount = 0;
                      try {
                        const userSessions: StudySession[] = JSON.parse(
                          localStorage.getItem(`focusflow_sessions_v1_${key}`) || '[]'
                        );
                        userSessionCount = userSessions.length;
                        userSessions.forEach((s) => {
                          if (s.status === 'Completed') userStudySeconds += s.duration;
                        });
                      } catch (e) {}

                      const userStudyHours = (userStudySeconds / 3600).toFixed(1);

                      return (
                        <div
                          key={key}
                          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-bold text-lg text-primary">{user.name.charAt(0)}</span>
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                                    {user.name}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                                      isAdmin
                                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                                        : 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                                    }`}
                                  >
                                    {isAdmin ? <ShieldCheck size={10} /> : <Globe size={10} />}
                                    <span>{isAdmin ? 'Admin' : 'Outside User'}</span>
                                  </span>
                                </div>
                                {user.email ? (
                                  <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                                    <Mail size={11} className="shrink-0" />
                                    <span className="truncate max-w-[160px]">{user.email}</span>
                                  </div>
                                ) : (
                                  <p className="text-[11px] font-mono text-slate-400 truncate">ID: {key}</p>
                                )}
                              </div>
                            </div>

                            {/* Live Badge in card */}
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${liveStatus.badgeBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.dotColor}`} />
                              <span>{liveStatus.statusLabel}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-slate-50/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            "{user.bio || 'Outside registered user.'}"
                          </p>

                          {/* Stats Grid for this profile */}
                          <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Studied</span>
                              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                                {userStudyHours}h
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Sessions</span>
                              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                                {userSessionCount}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Password</span>
                              <div className="flex items-center justify-center gap-1 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                <span>{showPasswordsMap[key] ? (user.password || 'None') : (user.password ? '••••••••' : 'Set')}</span>
                                {user.password && (
                                  <button
                                    onClick={() => togglePasswordVisibility(key)}
                                    className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                    title={showPasswordsMap[key] ? 'Hide' : 'Show'}
                                  >
                                    {showPasswordsMap[key] ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reset Password Collapsible Drawer */}
                          {isEditingPassword && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 animate-fade-in">
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                                Set New Password for {user.name}:
                              </span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newPasswordValue}
                                  onChange={(e) => setNewPasswordValue(e.target.value)}
                                  placeholder="New password (min 8 chars)..."
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleResetPassword(key)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPasswordUserKey(null)}
                                  className="px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Actions Bar */}
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
                            <button
                              onClick={() => handleToggleUserRole(key)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              {isAdmin ? <ShieldAlert size={14} className="text-indigo-500" /> : <ShieldCheck size={14} className="text-emerald-500" />}
                              <span>{isAdmin ? 'Demote to User' : 'Make Admin'}</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingPasswordUserKey(isEditingPassword ? null : key);
                                  setNewPasswordValue('');
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Reset User Password"
                              >
                                <Key size={15} />
                              </button>

                              <button
                                onClick={() => handleDeleteUser(key)}
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title="Delete User Profile"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: SYSTEM TOOLS & DATABASE BACKUP */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Database size={16} className="text-indigo-500" />
                      <span>System Utilities & Data Management</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          <Download size={18} />
                          <span>Export Full JSON Database</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Download complete backup of registered users database, login audit stream, and study session logs as JSON.
                        </p>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download size={15} />
                        <span>Download JSON Backup</span>
                      </button>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          <Sparkles size={18} />
                          <span>Seed Demo Scholars</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Populate database with sample student accounts and completed study session logs for previewing multi-user stats.
                        </p>
                      </div>
                      <button
                        onClick={handleSeedDemoUsers}
                        className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Users size={15} />
                        <span>Seed Demo Profiles</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
