export type UserRole = 'admin' | 'parent' | 'kid' | 'elder';

export interface FamilyUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar: string;
  color: string;
  notes: string;
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
  hasPassword?: boolean;
}

export type AIMode = 'general' | 'thinking' | 'fast' | 'search' | 'maps' | 'vision' | 'image';

export type AppTab = 'chat' | 'studio' | 'vault' | 'tools' | 'history' | 'access';

export interface GroundingSource {
  title: string;
  url: string;
  type: 'web' | 'maps';
  snippet?: string;
}

export interface ChatImageAttachment {
  data: string; // base64
  mimeType: string;
  previewUrl: string;
  name?: string;
}

export interface GeneratedImagePayload {
  url: string;
  prompt: string;
  style?: string;
  downloadUrl?: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
    avatar: string;
  };
  mode: AIMode;
  image?: ChatImageAttachment;
  generatedImage?: GeneratedImagePayload;
  sources?: GroundingSource[];
  modelUsed?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  mode: AIMode;
}

export interface FamilyMemory {
  id: string;
  title: string;
  category: 'dietary' | 'emergency' | 'recipe' | 'event' | 'note' | string;
  content: string;
  updatedBy: string;
}

export interface FamilyRule {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedBy: string;
}

export interface FamilyChore {
  id: string;
  task: string;
  assignedTo: string;
  points: number;
  done: boolean;
}

export interface AdminNotification {
  id: string;
  type: 'login' | 'chat' | 'system';
  title: string;
  message: string;
  userId: string;
  userName: string;
  role: UserRole;
  avatar: string;
  timestamp: string;
  read: boolean;
  deviceInfo?: string;
}

export interface FamilyHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar: string;
  userColor?: string;
  mode: AIMode;
  prompt: string;
  response: string;
  hasImage?: boolean;
  generatedImage?: GeneratedImagePayload;
  sources?: GroundingSource[];
  modelUsed?: string;
}

export interface MemberLoginLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar: string;
  timestamp: string;
  deviceInfo: string;
}

export interface CustomVoiceProfile {
  id: string;
  name: string;
  pitch: number; // 0.6 to 1.6, default 1.0
  rate: number; // 0.7 to 1.3, default 1.0
  systemVoiceURI?: string;
  isClonedFromMic: boolean;
  sampleAudioUrl?: string;
  toneStyle: 'natural' | 'warm' | 'clear' | 'storyteller' | 'energetic';
  warmthBoost: boolean;
  recordedPitchHz?: number;
}

