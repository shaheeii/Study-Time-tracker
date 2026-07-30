import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users_db.json');
const LOGS_FILE = path.join(DATA_DIR, 'login_logs.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserProfileServer {
  name: string;
  email?: string;
  password?: string;
  isLoggedIn?: boolean;
  avatarUrl?: string;
  bio?: string;
  role?: 'admin' | 'user';
  createdAt?: string;
  lastLoginAt?: string;
  loginCount?: number;
}

interface LoginLogEventServer {
  id: string;
  userId: string;
  username: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'Success' | 'Failed';
  failureReason?: string;
}

// Helpers for data reading & writing
function loadUsers(): Record<string, UserProfileServer> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading users db:', e);
  }
  // Default seed database with admin accounts
  const seed: Record<string, UserProfileServer> = {
    user_admin: {
      name: 'Admin',
      email: 'admin@padikkanam.org',
      password: 'admin',
      isLoggedIn: false,
      avatarUrl: '/shaheem.png',
      bio: 'System Administrator',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      loginCount: 1,
    },
    user_shaheem: {
      name: 'Shaheem',
      email: 'shaheem@padikkanam.org',
      password: 'shaheemcode0880',
      isLoggedIn: false,
      avatarUrl: '/shaheem.png',
      bio: 'Lead Developer & Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      loginCount: 1,
    },
  };
  saveUsers(seed);
  return seed;
}

function saveUsers(users: Record<string, UserProfileServer>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing users db:', e);
  }
}

function loadLogs(): LoginLogEventServer[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading logs db:', e);
  }
  return [];
}

function saveLogs(logs: LoginLogEventServer[]) {
  try {
    // Keep last 500 logs
    const trimmed = logs.slice(0, 500);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing logs db:', e);
  }
}

function loadSessions(): Record<string, any[]> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading sessions db:', e);
  }
  return {};
}

function saveSessions(sessions: Record<string, any[]>) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing sessions db:', e);
  }
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all registered users (for admin & sync)
  app.get('/api/users', (_req, res) => {
    const users = loadUsers();
    res.json({ users });
  });

  // Check if username or email is taken
  app.post('/api/users/check', (req, res) => {
    const { username, email, currentUserId } = req.body || {};
    const users = loadUsers();
    const normName = (username || '').trim().toLowerCase();
    const normEmail = (email || '').trim().toLowerCase();

    let nameTaken = false;
    let emailTaken = false;

    Object.keys(users).forEach((key) => {
      if (currentUserId && key === currentUserId) return;
      const u = users[key];
      if (u.name && u.name.trim().toLowerCase() === normName) {
        nameTaken = true;
      }
      if (normEmail && u.email && u.email.trim().toLowerCase() === normEmail) {
        emailTaken = true;
      }
    });

    res.json({ nameTaken, emailTaken });
  });

  // Register or Login user
  app.post('/api/users/login', (req, res) => {
    const { username, password, email } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const normName = username.trim();
    const normEmail = email ? email.trim().toLowerCase() : undefined;
    const cleanPass = password.trim();
    const userKey = 'user_' + normName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const users = loadUsers();
    const logs = loadLogs();

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser Client';

    // Check if account exists by key or case-insensitive username match
    let matchedKey = Object.keys(users).find((k) => k === userKey);
    if (!matchedKey) {
      matchedKey = Object.keys(users).find(
        (k) => users[k].name && users[k].name.trim().toLowerCase() === normName.toLowerCase()
      );
    }

    if (matchedKey) {
      const existingUser = users[matchedKey];
      // Strictly verify password
      if (existingUser.password && existingUser.password !== cleanPass) {
        // Record failed log
        logs.unshift({
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          userId: matchedKey,
          username: normName,
          timestamp: new Date().toISOString(),
          ipAddress: clientIp,
          userAgent,
          status: 'Failed',
          failureReason: 'Incorrect password for registered username',
        });
        saveLogs(logs);

        return res.status(401).json({
          error: `Username "${existingUser.name}" belongs to a registered user. Incorrect password.`,
        });
      }

      // Successful login
      const updatedUser: UserProfileServer = {
        ...existingUser,
        email: normEmail || existingUser.email,
        isLoggedIn: true,
        lastLoginAt: new Date().toISOString(),
        loginCount: (existingUser.loginCount || 0) + 1,
      };
      users[matchedKey] = updatedUser;
      saveUsers(users);

      logs.unshift({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId: matchedKey,
        username: normName,
        timestamp: new Date().toISOString(),
        ipAddress: clientIp,
        userAgent,
        status: 'Success',
      });
      saveLogs(logs);

      return res.json({ success: true, user: updatedUser, userKey: matchedKey, users, logs });
    } else {
      // New registration
      const isAdmin = normName.toLowerCase() === 'admin' || normName.toLowerCase() === 'shaheem';
      const newUser: UserProfileServer = {
        name: normName,
        email: normEmail,
        password: cleanPass,
        isLoggedIn: true,
        avatarUrl: '/shaheem.png',
        bio: 'Outside registered scholar.',
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
      };

      users[userKey] = newUser;
      saveUsers(users);

      logs.unshift({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId: userKey,
        username: normName,
        timestamp: new Date().toISOString(),
        ipAddress: clientIp,
        userAgent,
        status: 'Success',
        failureReason: 'New Account Registration',
      });
      saveLogs(logs);

      return res.json({ success: true, user: newUser, userKey, users, logs });
    }
  });

  // Update user profile
  app.post('/api/users/update', (req, res) => {
    const { userKey, updatedProfile, oldUserKey } = req.body || {};
    if (!userKey || !updatedProfile) {
      return res.status(400).json({ error: 'Missing user key or profile' });
    }

    const users = loadUsers();
    if (oldUserKey && oldUserKey !== userKey && users[oldUserKey]) {
      delete users[oldUserKey];
    }

    users[userKey] = {
      ...users[userKey],
      ...updatedProfile,
    };

    saveUsers(users);
    res.json({ success: true, users, user: users[userKey] });
  });

  // Delete user (Admin action)
  app.post('/api/users/delete', (req, res) => {
    const { userKey } = req.body || {};
    const users = loadUsers();
    if (users[userKey]) {
      delete users[userKey];
      saveUsers(users);
    }
    res.json({ success: true, users });
  });

  // Reset password (Admin action)
  app.post('/api/users/reset-password', (req, res) => {
    const { userKey, newPassword } = req.body || {};
    const users = loadUsers();
    if (users[userKey]) {
      users[userKey].password = newPassword;
      saveUsers(users);
    }
    res.json({ success: true, users });
  });

  // Record login log event directly
  app.post('/api/logs', (req, res) => {
    const { userId, username, status, failureReason } = req.body || {};
    const logs = loadLogs();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser Client';

    const newLog: LoginLogEventServer = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: userId || 'unknown',
      username: username || 'Visitor',
      timestamp: new Date().toISOString(),
      ipAddress: clientIp,
      userAgent,
      status: status === 'Failed' ? 'Failed' : 'Success',
      failureReason,
    };

    logs.unshift(newLog);
    saveLogs(logs);
    res.json({ success: true, log: newLog, logs });
  });

  // Get all login logs
  app.get('/api/logs', (_req, res) => {
    const logs = loadLogs();
    res.json({ logs });
  });

  // Sync user study sessions
  app.post('/api/sessions/sync', (req, res) => {
    const { userId, sessions } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const allSessions = loadSessions();
    allSessions[userId] = sessions || [];
    saveSessions(allSessions);
    res.json({ success: true });
  });

  // Get study sessions
  app.get('/api/sessions', (_req, res) => {
    const allSessions = loadSessions();
    res.json({ sessions: allSessions });
  });

  // Get Admin Dashboard Overview data (All outside users, logs, and sessions)
  app.get('/api/admin/data', (_req, res) => {
    const users = loadUsers();
    const logs = loadLogs();
    const sessions = loadSessions();

    res.json({
      users,
      logs,
      sessions,
      totalUsers: Object.keys(users).length,
      totalLogs: logs.length,
    });
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`padikkanam server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
