import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel, Modality, LiveServerMessage } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support photo uploads up to 25MB for deep visual analysis
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Storage file for family persistence
const DATA_FILE = path.join(__dirname, 'family_vault_data.json');

// Default initial allowed family users and family knowledge
interface UserRecord {
  id: string;
  username: string;
  passwordHash: string; // Plain password for simple household access
  name: string;
  role: 'admin' | 'parent' | 'kid' | 'elder';
  avatar: string;
  color: string;
  notes: string;
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
}

interface AdminNotification {
  id: string;
  type: 'login' | 'chat' | 'system';
  title: string;
  message: string;
  userId: string;
  userName: string;
  role: 'admin' | 'parent' | 'kid' | 'elder';
  avatar: string;
  timestamp: string;
  read: boolean;
  deviceInfo?: string;
}

interface FamilyHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'parent' | 'kid' | 'elder';
  userAvatar: string;
  userColor?: string;
  mode: string;
  prompt: string;
  response: string;
  hasImage?: boolean;
  generatedImage?: { url: string; prompt: string; style?: string; downloadUrl?: string };
  sources?: any[];
  modelUsed?: string;
}

interface MemberLoginLog {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'parent' | 'kid' | 'elder';
  userAvatar: string;
  timestamp: string;
  deviceInfo: string;
}

export interface GeneratedFamilyImage {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  imageUrl: string;
  style: string;
  aspectRatio: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
}

interface FamilyData {
  users: UserRecord[];
  rules: Array<{ id: string; title: string; category: string; content: string; updatedBy: string }>;
  memories: Array<{ id: string; title: string; category: string; content: string; updatedBy: string }>;
  chores: Array<{ id: string; task: string; assignedTo: string; points: number; done: boolean }>;
  notifications: AdminNotification[];
  chatHistory: FamilyHistoryEntry[];
  loginLogs: MemberLoginLog[];
  generatedImages: GeneratedFamilyImage[];
}

const DEFAULT_FAMILY_DATA: FamilyData = {
  users: [
    {
      id: 'usr_admin',
      username: 'krish',
      passwordHash: '@1234krish',
      name: 'Krish (Admin)',
      role: 'admin',
      avatar: '👑',
      color: 'bg-amber-500',
      notes: 'Family Head & Administrator for Jhatwal Home with full permissions',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: null,
    },
    {
      id: 'usr_mom',
      username: 'mom',
      passwordHash: 'family123',
      name: 'Mom',
      role: 'parent',
      avatar: '👩',
      color: 'bg-rose-500',
      notes: 'Jhatwal family parent, interested in healthy recipes, family budgeting & schedules',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: null,
    },
    {
      id: 'usr_dad',
      username: 'dad',
      passwordHash: 'family123',
      name: 'Dad',
      role: 'parent',
      avatar: '👨',
      color: 'bg-blue-500',
      notes: 'Jhatwal family parent, loves weekend DIY projects, tech, and family road trips',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: null,
    },
    {
      id: 'usr_kabir',
      username: 'kabir',
      passwordHash: 'kabir2026',
      name: 'Kabir',
      role: 'kid',
      avatar: '🚀',
      color: 'bg-emerald-500',
      notes: '10 years old, 5th grader. Loves astronomy, robotics & Minecraft. Needs step-by-step homework tutoring.',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: null,
    },
    {
      id: 'usr_nana',
      username: 'nana',
      passwordHash: 'nana123',
      name: 'Grandma',
      role: 'elder',
      avatar: '👵',
      color: 'bg-purple-500',
      notes: 'Grandmother, traditional cooking, family history & storytelling curator',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: null,
    },
  ],
  rules: [
    {
      id: 'rule_1',
      title: 'Screen Time & Homework',
      category: 'rule',
      content: 'Homework and 30 minutes of reading must be completed before gaming or tablet entertainment on weekdays.',
      updatedBy: 'Sunita (Mom)',
    },
    {
      id: 'rule_2',
      title: 'Sunday Family Dinner',
      category: 'routine',
      content: 'Every Sunday at 6:00 PM is tech-free dinner around the main table.',
      updatedBy: 'Krish (Admin)',
    },
  ],
  memories: [
    {
      id: 'mem_1',
      title: 'Dietary & Allergies',
      category: 'dietary',
      content: 'Kabir has a mild peanut allergy (keep snacks tree-nut/peanut safe). Nana prefers low-sodium cooking. Krish drinks almond milk.',
      updatedBy: 'Sunita (Mom)',
    },
    {
      id: 'mem_2',
      title: 'Emergency Contacts & Pet Info',
      category: 'emergency',
      content: 'Pediatrician: Dr. Higgins (555-0192). Vet for pet golden retriever "Barnaby": Westside Pet Hospital (555-0144). Wi-Fi Network: KinNest-5G / Pass: SunnyMeadow2026!',
      updatedBy: 'Krish (Admin)',
    },
    {
      id: 'mem_3',
      title: 'Favorite Family Traditions',
      category: 'recipe',
      content: 'Nana Evelyn Secret Apple Crisp Recipe: 6 tart Granny Smith apples, 1 cup rolled oats, 3/4 cup brown sugar, 1 tsp cinnamon, generous cold butter.',
      updatedBy: 'Nana Evelyn',
    },
  ],
  chores: [
    { id: 'ch_1', task: 'Empty dishwasher in the morning', assignedTo: 'Kabir', points: 15, done: false },
    { id: 'ch_2', task: 'Walk Barnaby (pet dog) after school', assignedTo: 'Kabir', points: 20, done: true },
    { id: 'ch_3', task: 'Take out recycling bins on Tuesday evening', assignedTo: 'Krish', points: 10, done: false },
    { id: 'ch_4', task: 'Water indoor herbs and patio planters', assignedTo: 'Nana Evelyn', points: 10, done: true },
  ],
  notifications: [
    {
      id: 'notif_welcome',
      type: 'system',
      title: 'Jhatwal Home AI Active',
      message: 'Household system initialized with administrative oversight and real-time member monitoring.',
      userId: 'usr_admin',
      userName: 'Krish (Admin)',
      role: 'admin',
      avatar: '👑',
      timestamp: new Date().toISOString(),
      read: true,
      deviceInfo: 'System Hub',
    },
  ],
  chatHistory: [],
  loginLogs: [],
  generatedImages: [],
};

function parseDeviceInfo(userAgent: string | undefined): string {
  if (!userAgent) return 'Web Browser';
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone')) return 'iPhone (Safari)';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android')) return 'Android Mobile';
  if (ua.includes('windows')) return 'Windows PC';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac';
  if (ua.includes('linux')) return 'Linux Device';
  return 'Web Browser';
}

function loadFamilyData(): FamilyData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_FAMILY_DATA,
        ...parsed,
        users: parsed.users || DEFAULT_FAMILY_DATA.users,
        rules: parsed.rules || DEFAULT_FAMILY_DATA.rules,
        memories: parsed.memories || DEFAULT_FAMILY_DATA.memories,
        chores: parsed.chores || DEFAULT_FAMILY_DATA.chores,
        notifications: parsed.notifications || [],
        chatHistory: parsed.chatHistory || [],
        loginLogs: parsed.loginLogs || [],
        generatedImages: parsed.generatedImages || [],
      };
    }
  } catch (err) {
    console.error('Error reading family data file, using defaults', err);
  }
  return {
    ...DEFAULT_FAMILY_DATA,
    notifications: [],
    chatHistory: [],
    loginLogs: [],
    generatedImages: [],
  };
}

function saveFamilyData(data: FamilyData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing family data file', err);
  }
}

// In-memory reference
let familyData = loadFamilyData();

// ================= AUTH ROUTES =================

// User Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter both username and password.' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const user = familyData.users.find(
    (u) =>
      (u.username.toLowerCase() === cleanUsername ||
        (u.role === 'admin' && (cleanUsername === 'admin' || cleanUsername === 'krish'))) &&
      u.passwordHash === String(password).trim()
  );

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials. Only pre-approved family members are permitted to sign in.',
    });
  }

  if (!user.active) {
    return res.status(403).json({
      error: 'Your family account is currently suspended by the Family Admin.',
    });
  }

  // Update last login
  const now = new Date().toISOString();
  user.lastLogin = now;
  const deviceInfo = parseDeviceInfo(req.headers['user-agent'] as string);

  // Add login audit log
  const loginLog: MemberLoginLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    userAvatar: user.avatar,
    timestamp: now,
    deviceInfo,
  };
  familyData.loginLogs = familyData.loginLogs || [];
  familyData.loginLogs.unshift(loginLog);
  if (familyData.loginLogs.length > 500) {
    familyData.loginLogs = familyData.loginLogs.slice(0, 500);
  }

  // Create administrative notification
  const notif: AdminNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'login',
    title: `${user.name} Signed In`,
    message: `${user.name} (${user.role.toUpperCase()}) just signed into Jhatwal Home using ${deviceInfo}.`,
    userId: user.id,
    userName: user.name,
    role: user.role,
    avatar: user.avatar,
    timestamp: now,
    read: false,
    deviceInfo,
  };
  familyData.notifications = familyData.notifications || [];
  familyData.notifications.unshift(notif);
  if (familyData.notifications.length > 200) {
    familyData.notifications = familyData.notifications.slice(0, 200);
  }

  saveFamilyData(familyData);

  const { passwordHash, ...safeUser } = user;
  return res.json({
    user: safeUser,
    token: `famsess_${user.id}_${Date.now()}`,
  });
});

// Verify Admin Password (for secure member-switch or elevation)
app.post('/api/auth/verify-admin-password', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Please enter the administrator password.' });
  }

  const adminUser = familyData.users.find((u) => u.role === 'admin');
  if (!adminUser) {
    return res.status(404).json({ error: 'Administrator account not found.' });
  }

  if (adminUser.passwordHash !== String(password).trim()) {
    return res.status(401).json({ error: 'Incorrect Administrator password. Access denied.' });
  }

  const now = new Date().toISOString();
  adminUser.lastLogin = now;
  const deviceInfo = parseDeviceInfo(req.headers['user-agent'] as string);

  // Add audit log
  const loginLog: MemberLoginLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: adminUser.id,
    userName: adminUser.name,
    userRole: adminUser.role,
    userAvatar: adminUser.avatar,
    timestamp: now,
    deviceInfo: `${deviceInfo} (Switched)`,
  };
  familyData.loginLogs = familyData.loginLogs || [];
  familyData.loginLogs.unshift(loginLog);

  // Admin notification
  const notif: AdminNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'login',
    title: 'Admin Access Granted',
    message: `Krish (Admin) was authenticated on ${deviceInfo}.`,
    userId: adminUser.id,
    userName: adminUser.name,
    role: adminUser.role,
    avatar: adminUser.avatar,
    timestamp: now,
    read: false,
    deviceInfo,
  };
  familyData.notifications = familyData.notifications || [];
  familyData.notifications.unshift(notif);

  saveFamilyData(familyData);

  const { passwordHash, ...safeAdmin } = adminUser;
  return res.json({
    success: true,
    user: safeAdmin,
    token: `famsess_${adminUser.id}_${Date.now()}`,
  });
});

// Get all allowed family members
app.get('/api/auth/users', (req, res) => {
  const safeUsers = familyData.users.map(({ passwordHash, ...u }) => ({
    ...u,
    hasPassword: Boolean(passwordHash),
  }));
  res.json({ users: safeUsers });
});

// Admin Add new allowed member
app.post('/api/auth/users', (req, res) => {
  const { username, password, name, role, avatar, color, notes } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and display name are required.' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  if (familyData.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(409).json({ error: `Username "${username}" is already taken by a family member.` });
  }

  const newUser: UserRecord = {
    id: `usr_${Date.now()}`,
    username: cleanUsername,
    passwordHash: String(password).trim(),
    name: String(name).trim(),
    role: ['admin', 'parent', 'kid', 'elder'].includes(role) ? role : 'parent',
    avatar: avatar || '👤',
    color: color || 'bg-amber-500',
    notes: String(notes || '').trim(),
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  };

  familyData.users.push(newUser);
  saveFamilyData(familyData);

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser });
});

// Admin Update allowed member
app.put('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  const user = familyData.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Family member not found.' });
  }

  const { name, role, avatar, color, notes, active, password } = req.body;
  if (name !== undefined) user.name = String(name).trim();
  if (role !== undefined && ['admin', 'parent', 'kid', 'elder'].includes(role)) user.role = role;
  if (avatar !== undefined) user.avatar = avatar;
  if (color !== undefined) user.color = color;
  if (notes !== undefined) user.notes = String(notes).trim();
  if (active !== undefined) user.active = Boolean(active);
  if (password) user.passwordHash = String(password).trim();

  saveFamilyData(familyData);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Admin Remove member
app.delete('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  const idx = familyData.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Member not found.' });
  }

  // Prevent deleting the last admin
  const admins = familyData.users.filter((u) => u.role === 'admin');
  if (familyData.users[idx].role === 'admin' && admins.length <= 1) {
    return res.status(400).json({ error: 'Cannot remove the primary family admin.' });
  }

  familyData.users.splice(idx, 1);
  saveFamilyData(familyData);
  res.json({ success: true });
});

// ================= FAMILY MEMORY & VAULT ROUTES =================

app.get('/api/family/data', (req, res) => {
  res.json({
    rules: familyData.rules,
    memories: familyData.memories,
    chores: familyData.chores,
  });
});

app.post('/api/family/memories', (req, res) => {
  const { title, category, content, updatedBy } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }
  const newMem = {
    id: `mem_${Date.now()}`,
    title: String(title).trim(),
    category: category || 'note',
    content: String(content).trim(),
    updatedBy: updatedBy || 'Family Member',
  };
  familyData.memories.unshift(newMem);
  saveFamilyData(familyData);
  res.status(201).json(newMem);
});

app.delete('/api/family/memories/:id', (req, res) => {
  const { id } = req.params;
  familyData.memories = familyData.memories.filter((m) => m.id !== id);
  saveFamilyData(familyData);
  res.json({ success: true });
});

app.post('/api/family/chores', (req, res) => {
  const { task, assignedTo, points } = req.body;
  if (!task) return res.status(400).json({ error: 'Task is required.' });
  const newChore = {
    id: `ch_${Date.now()}`,
    task: String(task).trim(),
    assignedTo: assignedTo || 'Unassigned',
    points: Number(points) || 10,
    done: false,
  };
  familyData.chores.push(newChore);
  saveFamilyData(familyData);
  res.status(201).json(newChore);
});

app.put('/api/family/chores/:id', (req, res) => {
  const { id } = req.params;
  const chore = familyData.chores.find((c) => c.id === id);
  if (!chore) return res.status(404).json({ error: 'Chore not found.' });
  if (req.body.done !== undefined) chore.done = Boolean(req.body.done);
  if (req.body.task !== undefined) chore.task = String(req.body.task);
  if (req.body.assignedTo !== undefined) chore.assignedTo = String(req.body.assignedTo);
  if (req.body.points !== undefined) chore.points = Number(req.body.points);
  saveFamilyData(familyData);
  res.json(chore);
});

app.delete('/api/family/chores/:id', (req, res) => {
  const { id } = req.params;
  familyData.chores = familyData.chores.filter((c) => c.id !== id);
  saveFamilyData(familyData);
  res.json({ success: true });
});

// ================= ADMIN NOTIFICATIONS & HISTORY AUDIT ROUTES =================

// Get Notifications
app.get('/api/admin/notifications', (req, res) => {
  const list = familyData.notifications || [];
  const unreadCount = list.filter((n) => !n.read).length;
  res.json({
    notifications: list,
    unreadCount,
  });
});

// Mark all or specific notification as read
app.put('/api/admin/notifications/mark-read', (req, res) => {
  const { id } = req.body || {};
  familyData.notifications = familyData.notifications || [];
  if (id) {
    familyData.notifications = familyData.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
  } else {
    familyData.notifications = familyData.notifications.map((n) => ({ ...n, read: true }));
  }
  saveFamilyData(familyData);
  const unreadCount = familyData.notifications.filter((n) => !n.read).length;
  res.json({ success: true, unreadCount });
});

// Clear notifications
app.delete('/api/admin/notifications', (req, res) => {
  familyData.notifications = [];
  saveFamilyData(familyData);
  res.json({ success: true, unreadCount: 0 });
});

// Get Family Chat & Interaction History + Login Logs
app.get('/api/admin/history', (req, res) => {
  const { userId, mode, search } = req.query;
  let items = familyData.chatHistory || [];

  if (userId && typeof userId === 'string' && userId !== 'all') {
    items = items.filter((h) => h.userId === userId);
  }

  if (mode && typeof mode === 'string' && mode !== 'all') {
    items = items.filter((h) => h.mode === mode);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (h) =>
        h.prompt.toLowerCase().includes(q) ||
        h.response.toLowerCase().includes(q) ||
        h.userName.toLowerCase().includes(q)
    );
  }

  res.json({
    history: items,
    totalCount: (familyData.chatHistory || []).length,
    loginLogs: familyData.loginLogs || [],
  });
});

// Delete specific history record
app.delete('/api/admin/history/:id', (req, res) => {
  const { id } = req.params;
  familyData.chatHistory = (familyData.chatHistory || []).filter((h) => h.id !== id);
  saveFamilyData(familyData);
  res.json({ success: true });
});

// Clear all history
app.delete('/api/admin/history', (req, res) => {
  familyData.chatHistory = [];
  saveFamilyData(familyData);
  res.json({ success: true });
});

// Get Login Logs specifically
app.get('/api/admin/logins', (req, res) => {
  res.json({ loginLogs: familyData.loginLogs || [] });
});

// ================= FREE AI IMAGE STUDIO & GENERATOR =================

const STYLE_PROMPTS: Record<string, string> = {
  realistic: 'photorealistic 8k, highly detailed, dramatic lighting, shot on 35mm lens, professional photography',
  'digital-art': 'vibrant digital art, trending on artstation, masterpiece, detailed concept art, sharp focus',
  anime: 'studio ghibli aesthetic, anime illustration, hand-drawn look, painterly scenery, vivid atmosphere',
  '3d-pixar': '3d animated character style, cute Disney Pixar CGI rendering, soft ambient lighting, high poly',
  watercolor: 'fine watercolor painting, expressive brushstrokes, textured watercolor paper, soft pastel colors',
  cinematic: 'cinematic still, anamorphic widescreen, atmospheric lighting, moody shadows, movie production',
  sketch: 'detailed pencil sketch, fine graphite lines, cross-hatching, realistic pencil drawing',
};

function getDimensions(aspectRatio: string = '1:1') {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1280, height: 720 };
    case '9:16':
      return { width: 720, height: 1280 };
    case '4:3':
      return { width: 1024, height: 768 };
    case '3:4':
      return { width: 768, height: 1024 };
    case '1:1':
    default:
      return { width: 1024, height: 1024 };
  }
}

async function enhancePromptWithGemini(rawPrompt: string, style: string): Promise<string> {
  const styleAddon = STYLE_PROMPTS[style] || STYLE_PROMPTS.realistic;
  try {
    const promptEnhanceReq = `You are an expert AI prompt artist. The user wants to generate an image for a family household app.
Raw prompt: "${rawPrompt}"
Desired visual style: "${style}" (${styleAddon})

Write an enhanced, descriptive, vivid prompt (1-3 sentences max) optimized for text-to-image models. Do not include introductory conversational text, do not use quotes, only return the prompt text itself.`;

    const timerPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Prompt enhance timeout')), 8000)
    );

    const callPromise = (async () => {
      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptEnhanceReq,
      });
      const text = res?.text?.trim();
      return text || `${rawPrompt}, ${styleAddon}`;
    })();

    const enhanced = await Promise.race([callPromise, timerPromise]);
    return enhanced;
  } catch (e) {
    return `${rawPrompt}, ${styleAddon}`;
  }
}

// Generate Image Endpoint (100% Free, No Paid Key Needed)
app.post('/api/images/generate', async (req, res) => {
  try {
    const { prompt, style = 'realistic', aspectRatio = '1:1', enhance = true, author } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const cleanPrompt = prompt.trim();
    let finalPrompt = cleanPrompt;

    if (enhance) {
      finalPrompt = await enhancePromptWithGemini(cleanPrompt, style);
    } else {
      const styleAddon = STYLE_PROMPTS[style] || STYLE_PROMPTS.realistic;
      finalPrompt = `${cleanPrompt}, ${styleAddon}`;
    }

    const { width, height } = getDimensions(aspectRatio);
    const seed = Math.floor(Math.random() * 10000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      finalPrompt
    )}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const newImage: GeneratedFamilyImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      prompt: cleanPrompt,
      enhancedPrompt: finalPrompt,
      imageUrl,
      style,
      aspectRatio,
      createdAt: new Date().toISOString(),
      authorId: author?.id || 'usr_unknown',
      authorName: author?.name || 'Family Member',
      authorAvatar: author?.avatar || '🎨',
    };

    familyData.generatedImages = familyData.generatedImages || [];
    familyData.generatedImages.unshift(newImage);
    if (familyData.generatedImages.length > 200) {
      familyData.generatedImages = familyData.generatedImages.slice(0, 200);
    }
    saveFamilyData(familyData);

    res.json({ image: newImage });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate image' });
  }
});

// Get Gallery
app.get('/api/images/gallery', (req, res) => {
  res.json({ images: familyData.generatedImages || [] });
});

// Delete from Gallery
app.delete('/api/images/gallery/:id', (req, res) => {
  const { id } = req.params;
  familyData.generatedImages = (familyData.generatedImages || []).filter((img) => img.id !== id);
  saveFamilyData(familyData);
  res.json({ success: true });
});

// Audio Transcription Endpoint using gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    let cleanBase64 = audioData;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }

    const audioPart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: 'Transcribe this spoken audio accurately. Output ONLY the clean transcribed words with proper punctuation, without any conversational preamble or notes.' },
        ],
      },
    });

    const transcription = response?.text?.trim() || '';
    return res.json({ transcription });
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to transcribe audio' });
  }
});

// Image Edit & Creation Endpoint using gemini-3.1-flash-image-preview with studio fallback
app.post('/api/images/edit', async (req, res) => {
  try {
    const { prompt, baseImage, style = 'realistic', author } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const cleanPrompt = prompt.trim();
    let imageUrl = '';
    const seed = Math.floor(Math.random() * 10000000);
    const { width, height } = getDimensions('1:1');

    // Attempt with Gemini 3.1 flash image preview
    try {
      if (baseImage) {
        let cleanBase64 = baseImage;
        if (cleanBase64.includes('base64,')) {
          cleanBase64 = cleanBase64.split('base64,')[1];
        }

        const editResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: `Edit this image based on the following instruction: ${cleanPrompt}`,
              },
            ],
          },
        });

        for (const part of editResponse?.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (geminiImgErr) {
      console.warn('Gemini image edit fallback:', geminiImgErr);
    }

    // High fidelity fallback using enhanced prompt
    if (!imageUrl) {
      const finalPrompt = await enhancePromptWithGemini(cleanPrompt, style);
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        finalPrompt
      )}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
    }

    const newImage: GeneratedFamilyImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      prompt: cleanPrompt,
      imageUrl,
      style,
      aspectRatio: '1:1',
      createdAt: new Date().toISOString(),
      authorId: author?.id || 'usr_unknown',
      authorName: author?.name || 'Family Member',
      authorAvatar: author?.avatar || '🎨',
    };

    familyData.generatedImages = familyData.generatedImages || [];
    familyData.generatedImages.unshift(newImage);
    saveFamilyData(familyData);

    return res.json({ image: newImage });
  } catch (err: any) {
    console.error('Image edit error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to edit image' });
  }
});

// ================= AI CHAT & REASONING ENGINE =================

// Helper to assemble system instruction with family context
function buildSystemInstruction(userProfile: any, customContext?: string) {
  const familyKnowledgeSummary = [
    `FAMILY KNOWLEDGE & CONTEXT:`,
    ...familyData.memories.map((m) => `- [${m.category.toUpperCase()}] ${m.title}: ${m.content}`),
    `HOUSE RULES & ROUTINES:`,
    ...familyData.rules.map((r) => `- [${r.category.toUpperCase()}] ${r.title}: ${r.content}`),
  ].join('\n');

  const userContext = userProfile
    ? `CURRENT USER:
- Name: ${userProfile.name}
- Role: ${userProfile.role}
- Notes: ${userProfile.notes || 'None'}
`
    : 'CURRENT USER: Family member';

  let toneGuidance = '';
  if (userProfile?.role === 'kid') {
    toneGuidance = `
IMPORTANT FOR KID MODE:
- The user is a child/student (${userProfile.name}).
- Always be encouraging, friendly, and curious.
- For homework questions, NEVER just dump the final answer! Use the Socratic method: explain concepts with fun analogies, break down steps, and ask guiding questions to let them solve it.
- Keep content 100% wholesome, safe, and age-appropriate.
`;
  } else if (userProfile?.role === 'elder') {
    toneGuidance = `
TONE FOR ELDER MODE:
- Use clear, respectful, easy-to-read explanations.
- Emphasize family traditions, warm storytelling, and practical clarity.
`;
  } else {
    toneGuidance = `
TONE FOR ADULT/PARENT MODE:
- Be highly efficient, organized, supportive, and practical.
- Proactively reference family schedules, dietary restrictions, and safety considerations.
`;
  }

  return `You are Jhatwal Home AI, the dedicated, private personal AI assistant built exclusively for the Jhatwal family.
You only serve this authenticated household. You know the family members, their preferences, pets, traditions, and allergies.

${userContext}
${toneGuidance}

${familyKnowledgeSummary}
${customContext ? `ADDITIONAL LIVE CONTEXT:\n${customContext}` : ''}

Always prioritize the family's well-being, dietary safety, and harmony. When formatting responses, use clean Markdown, bullet points, and headers where helpful.`;
}

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages, // Array of { role: 'user'|'model', content: string, image?: { data: string, mimeType: string } }
      mode = 'general', // 'general' | 'thinking' | 'fast' | 'search' | 'maps' | 'vision'
      userProfile,
      customContext,
      location, // { latitude: number, longitude: number }
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Check for Image Generation Mode or in-chat image generation request
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    const userPrompt = lastUserMsg?.content || '';
    const isImageRequest =
      mode === 'image' ||
      /\b(generate|create|draw|make|paint|show me|illustrate|render|design)\b.*\b(image|picture|photo|painting|drawing|artwork|wallpaper|pic|graphic)\b/i.test(
        userPrompt
      );

    if (isImageRequest && userPrompt && !lastUserMsg?.image) {
      try {
        let imagePrompt = userPrompt
          .replace(
            /^(please\s+)?(can you\s+)?(generate|create|draw|make|paint|show me|illustrate|render|design)\s+(an?\s+)?(image|picture|photo|painting|drawing|artwork|wallpaper|illustration|pic)?(\s+(of|og|for|a|an))?/i,
            ''
          )
          .replace(/^(a|an)\s+/i, '')
          .trim();
        if (!imagePrompt || imagePrompt.length < 2) imagePrompt = userPrompt;

        const enhanced = await enhancePromptWithGemini(imagePrompt, 'realistic');
        const seed = Math.floor(Math.random() * 10000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          enhanced
        )}?width=1024&height=1024&seed=${seed}&nologo=true`;

        const newImage: GeneratedFamilyImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          prompt: imagePrompt,
          enhancedPrompt: enhanced,
          imageUrl,
          style: 'realistic',
          aspectRatio: '1:1',
          createdAt: new Date().toISOString(),
          authorId: userProfile?.id || 'usr_unknown',
          authorName: userProfile?.name || 'Family Member',
          authorAvatar: userProfile?.avatar || '🎨',
        };

        familyData.generatedImages = familyData.generatedImages || [];
        familyData.generatedImages.unshift(newImage);
        saveFamilyData(familyData);

        const captionText = `Here is your generated artwork for **"${imagePrompt}"**! I've also saved it to the Family Image Studio gallery.`;

        // Save to chat history
        const historyRecord: FamilyHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          userId: userProfile?.id || 'usr_unknown',
          userName: userProfile?.name || 'Family Member',
          userRole: userProfile?.role || 'parent',
          userAvatar: userProfile?.avatar || '👤',
          userColor: userProfile?.color,
          mode: 'image',
          prompt: userPrompt,
          response: captionText,
          generatedImage: {
            url: imageUrl,
            prompt: imagePrompt,
            style: 'realistic',
          },
          modelUsed: 'Free Image Studio (Flux Engine)',
        };
        familyData.chatHistory = familyData.chatHistory || [];
        familyData.chatHistory.unshift(historyRecord);
        saveFamilyData(familyData);

        return res.json({
          text: `${captionText}\n\n![${imagePrompt}](${imageUrl})`,
          generatedImage: {
            url: imageUrl,
            prompt: imagePrompt,
            style: 'realistic',
          },
          modelUsed: 'Free Image Studio (Flux Engine)',
        });
      } catch (imgErr) {
        console.warn('Inline image generation error, continuing to standard text reply', imgErr);
      }
    }

    const systemInstruction = buildSystemInstruction(userProfile, customContext);

    // Map conversation history
    const contents: any[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const parts: any[] = [];

      // If there's an image attached to this message
      if (msg.image && msg.image.data) {
        let base64Clean = msg.image.data;
        if (base64Clean.includes('base64,')) {
          base64Clean = base64Clean.split('base64,')[1];
        }
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType || 'image/jpeg',
            data: base64Clean,
          },
        });
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts,
        });
      }
    }

    let modelName = 'gemini-3.8-flash';
    let config: any = {
      systemInstruction,
    };

    // Determine model and configuration based on mode
    if (mode === 'thinking' || mode === 'complex') {
      // Complex reasoning tasks: use gemini-3.1-pro-preview with fallback to gemini-3.8-flash
      modelName = 'gemini-3.1-pro-preview';
      config = {
        systemInstruction,
      };
    } else if (mode === 'vision') {
      // High-speed multimodal vision with gemini-3.8-flash
      modelName = 'gemini-3.8-flash';
      config = {
        systemInstruction,
      };
    } else if (mode === 'fast') {
      // Ultra fast model with gemini-3.1-flash-lite
      modelName = 'gemini-3.1-flash-lite';
      config = {
        systemInstruction,
      };
    } else if (mode === 'search') {
      // Google search grounding with gemini-3.8-flash
      modelName = 'gemini-3.8-flash';
      config = {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      };
    } else if (mode === 'maps') {
      // Google maps grounding with gemini-3.8-flash (with googleMaps tool)
      modelName = 'gemini-3.8-flash';
      config = {
        systemInstruction,
        tools: [{ googleMaps: {} }],
        toolConfig: location?.latitude && location?.longitude
          ? {
              retrievalConfig: {
                latLng: {
                  latitude: Number(location.latitude),
                  longitude: Number(location.longitude),
                },
              },
            }
          : undefined,
      };
    } else {
      // General tasks: gemini-3.8-flash
      modelName = 'gemini-3.8-flash';
      config = {
        systemInstruction,
      };
    }

    let response: any;
    let actualModelUsed = modelName;
    let fallbackText: string | null = null;

    // Fast execution helper with generous timeout guard (avoid premature aborts)
    const callWithTimeout = async (fn: () => Promise<any>, ms: number) => {
      let timer: any;
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
      });
      try {
        const result = await Promise.race([fn(), timeoutPromise]);
        clearTimeout(timer);
        return result;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    try {
      const primaryTimeout = mode === 'search' || mode === 'maps' || mode === 'thinking' ? 25000 : 20000;
      response = await callWithTimeout(
        () => ai.models.generateContent({ model: modelName, contents, config }),
        primaryTimeout
      );
    } catch (primaryErr: any) {
      console.warn(`Primary model call (${modelName}) issue or timeout:`, primaryErr?.message || primaryErr);

      // Fallback sequence across lightweight fast models
      const fallbackModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'].filter((m) => m !== modelName);
      let success = false;
      for (const fallbackModel of fallbackModels) {
        try {
          console.log(`Fallback attempt to ${fallbackModel}...`);
          // Strip out external search/maps tools in fallback to ensure immediate conversational resolution
          const fallbackConfig: any = {
            systemInstruction: config.systemInstruction,
          };
          response = await callWithTimeout(
            () => ai.models.generateContent({ model: fallbackModel, contents, config: fallbackConfig }),
            18000
          );
          actualModelUsed = `${fallbackModel} (turbo-mode)`;
          success = true;
          break;
        } catch (fbErr: any) {
          console.warn(`Fallback to ${fallbackModel} failed:`, fbErr?.message || fbErr);
        }
      }

      if (!success && !response) {
        // As a last safe guard, generate a direct response with gemini-3.1-flash-lite
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: { systemInstruction: config.systemInstruction },
          });
          actualModelUsed = 'gemini-3.1-flash-lite (safe-fallback)';
        } catch (finalErr: any) {
          console.error('All model attempts failed:', finalErr?.message || finalErr);
          fallbackText = "I'm temporarily experiencing a connection delay with the AI service. All your household rules, family notes, routines, and calendar are securely saved in KinVault. Please try asking your question again in just a moment!";
          actualModelUsed = 'KinVault Offline Vault';
        }
      }
    }

    // Robust text extraction so the user NEVER receives an empty message or crashes
    let text = fallbackText || response?.text;
    if (!text && response?.candidates?.[0]?.content?.parts) {
      text = response.candidates[0].content.parts
        .map((p: any) => p.text || '')
        .filter(Boolean)
        .join('\n')
        .trim();
    }

    if (!text || text.trim().length === 0) {
      text = "I'm here for you! I processed your request. How else can I assist our family today?";
    }

    // Extract grounding sources (Web and Maps)
    const sources: Array<{ title: string; url: string; type: 'web' | 'maps'; snippet?: string }> = [];
    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
            type: 'web',
          });
        }
        if (chunk.maps) {
          const mapUrl = chunk.maps.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chunk.maps.title || 'Location')}`;
          const rawSnippet: any = chunk.maps.placeAnswerSources?.reviewSnippets?.[0];
          const snippetText = typeof rawSnippet === 'string' ? rawSnippet : rawSnippet?.text || rawSnippet?.snippet || undefined;
          sources.push({
            title: chunk.maps.title || 'View on Google Maps',
            url: mapUrl,
            type: 'maps',
            snippet: snippetText,
          });
        }
      }
    }

    // Save to server-side persistent family chat history
    try {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
      const promptText =
        lastUserMsg?.content || (lastUserMsg?.image ? '[Photo / Document attached]' : 'Question asked');

      const historyRecord: FamilyHistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        userId: userProfile?.id || 'usr_unknown',
        userName: userProfile?.name || 'Family Member',
        userRole: userProfile?.role || 'parent',
        userAvatar: userProfile?.avatar || '👤',
        userColor: userProfile?.color,
        mode,
        prompt: promptText,
        response: text,
        hasImage: Boolean(lastUserMsg?.image),
        sources,
        modelUsed: actualModelUsed,
      };

      familyData.chatHistory = familyData.chatHistory || [];
      familyData.chatHistory.unshift(historyRecord);
      if (familyData.chatHistory.length > 1000) {
        familyData.chatHistory = familyData.chatHistory.slice(0, 1000);
      }
      saveFamilyData(familyData);
    } catch (saveErr) {
      console.warn('Could not save conversation to family history', saveErr);
    }

    return res.json({
      text,
      sources,
      modelUsed: actualModelUsed,
    });
  } catch (error: any) {
    console.error('Chat generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process AI request. Please try again.',
    });
  }
});

// Vite middleware in dev or static serving in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const server = http.createServer(app);

  // Gemini 3.8 Live API WebSocket Server
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    let session: any = null;
    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'You are Jhatwal Home AI, the private household voice assistant for the Jhatwal family. Speak warmly, clearly, and concisely.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
            if (clientWs.readyState === WebSocket.OPEN) {
              if (audio) {
                clientWs.send(JSON.stringify({ audio, text }));
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: err?.message || 'Live session error' }));
            }
          },
          onclose: () => {
            console.log('Gemini Live session closed');
          },
        },
      });

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio && session) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (parsed.text && session) {
            session.sendRealtimeInput({
              text: parsed.text,
            });
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      });

      clientWs.on('close', () => {
        try {
          if (session) session.close();
        } catch (e) {}
      });
    } catch (liveErr: any) {
      console.error('Error initiating Gemini Live session:', liveErr);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            error: liveErr?.message || 'Failed to start Live session with gemini-3.8-live',
          })
        );
      }
    }
  });

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Jhatwal Home Family AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
