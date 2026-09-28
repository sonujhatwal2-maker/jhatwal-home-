import React, { useState, useEffect, useRef } from 'react';
import {
  FamilyUser,
  ChatMessage,
  AIMode,
  AppTab,
  FamilyMemory,
  FamilyRule,
  FamilyChore,
  AdminNotification,
} from './types';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { FamilyVault } from './components/FamilyVault';
import { FamilyTools } from './components/FamilyTools';
import { ImageStudioView } from './components/ImageStudioView';
import { UserManagement } from './components/UserManagement';
import { AdminHistoryView } from './components/AdminHistoryView';
import { AdminNotificationsModal } from './components/AdminNotificationsModal';
import { SwitchUserModal } from './components/SwitchUserModal';
import { MobileNav } from './components/MobileNav';
import { PhoneAccessModal } from './components/PhoneAccessModal';
import { ShareModal } from './components/ShareModal';
import { VoiceLiveModal } from './components/VoiceLiveModal';
import { WifiOff, Bell, X, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FamilyUser | null>(null);
  const [allowedUsers, setAllowedUsers] = useState<FamilyUser[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Administrative Notifications State
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [liveToast, setLiveToast] = useState<AdminNotification | null>(null);
  const prevUnreadCountRef = useRef(0);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeMode, setActiveMode] = useState<AIMode>('general');

  // Family Vault State
  const [memories, setMemories] = useState<FamilyMemory[]>([]);
  const [rules, setRules] = useState<FamilyRule[]>([]);
  const [chores, setChores] = useState<FamilyChore[]>([]);

  // Load allowed users and session on mount
  useEffect(() => {
    fetchUsers();
    fetchFamilyData();

    // Check saved session
    const savedUser = localStorage.getItem('kin_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('kin_current_user');
      }
    }
  }, []);

  // Poll notifications if current user is admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;

    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        const newNotifications: AdminNotification[] = data.notifications || [];
        const newUnreadCount = data.unreadCount || 0;

        // If a new unread notification arrived while admin is active, show live toast!
        if (newUnreadCount > prevUnreadCountRef.current && newNotifications.length > 0) {
          const latest = newNotifications[0];
          if (!latest.read) {
            setLiveToast(latest);
            setTimeout(() => {
              setLiveToast(null);
            }, 6000);
          }
        }

        prevUnreadCountRef.current = newUnreadCount;
        setNotifications(newNotifications);
        setUnreadNotificationsCount(newUnreadCount);
      }
    } catch (err) {
      console.warn('Could not fetch notifications', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadNotificationsCount(0);
        prevUnreadCountRef.current = 0;
      }
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
        setUnreadNotificationsCount(0);
        prevUnreadCountRef.current = 0;
      }
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setAllowedUsers(data.users || []);
      }
    } catch (err) {
      console.warn('Could not fetch users', err);
    }
  };

  const fetchFamilyData = async () => {
    try {
      const res = await fetch('/api/family/data');
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
        setRules(data.rules || []);
        setChores(data.chores || []);
      }
    } catch (err) {
      console.warn('Could not fetch family data', err);
    }
  };

  const handleLoginSuccess = (user: FamilyUser, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('kin_current_user', JSON.stringify(user));
    localStorage.setItem('kin_auth_token', token);
    if (user.role === 'admin') {
      fetchNotifications();
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kin_current_user');
    localStorage.removeItem('kin_auth_token');
    setShowSwitchModal(false);
    setShowNotificationsModal(false);
  };

  const handleSwitchUser = (user: FamilyUser) => {
    setCurrentUser(user);
    localStorage.setItem('kin_current_user', JSON.stringify(user));
    if (user.role === 'admin') {
      fetchNotifications();
    }
  };

  // Add Memory to Vault
  const handleAddMemory = async (mem: { title: string; category: string; content: string }) => {
    try {
      const res = await fetch('/api/family/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mem,
          updatedBy: currentUser?.name || 'Family Member',
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setMemories((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error('Failed to add memory', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/family/memories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete memory', err);
    }
  };

  // Chores
  const handleAddChore = async (chore: { task: string; assignedTo: string; points: number }) => {
    try {
      const res = await fetch('/api/family/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chore),
      });
      if (res.ok) {
        const created = await res.json();
        setChores((prev) => [...prev, created]);
      }
    } catch (err) {
      console.error('Failed to add chore', err);
    }
  };

  const handleToggleChore = async (id: string, done: boolean) => {
    setChores((prev) => prev.map((c) => (c.id === id ? { ...c, done } : c)));
    try {
      await fetch(`/api/family/chores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
    } catch (err) {
      console.error('Failed to update chore', err);
    }
  };

  const handleDeleteChore = async (id: string) => {
    setChores((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/family/chores/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete chore', err);
    }
  };

  // User Management
  const handleAddUser = async (newUserData: Partial<FamilyUser> & { password: string }) => {
    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUserData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create user');
    }
    setAllowedUsers((prev) => [...prev, data.user]);
  };

  const handleUpdateUser = async (id: string, updates: Partial<FamilyUser> & { password?: string }) => {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update user');
    }
    setAllowedUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
    if (currentUser?.id === id) {
      setCurrentUser(data.user);
      localStorage.setItem('kin_current_user', JSON.stringify(data.user));
    }
  };

  const handleDeleteUser = async (id: string) => {
    const res = await fetch(`/api/auth/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to remove user');
    }
    setAllowedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Launch prompt from FamilyTools into ChatView
  const handleSendToChat = (prompt: string, mode: AIMode) => {
    setActiveMode(mode);
    setActiveTab('chat');

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: {
        id: currentUser!.id,
        name: currentUser!.name,
        role: currentUser!.role,
        avatar: currentUser!.avatar,
      },
      mode,
    };

    setMessages((prev) => [...prev, userMessage]);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        mode,
        userProfile: currentUser,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const assistantMessage: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: data.text || 'Done!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: {
            id: 'kin_ai',
            name: 'Jhatwal Home AI',
            role: 'admin',
            avatar: '🤖',
          },
          mode,
          generatedImage: data.generatedImage,
          sources: data.sources || [],
          modelUsed: data.modelUsed,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      })
      .catch((err) => {
        const errorMsg: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to execute tool: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: {
            id: 'kin_ai',
            name: 'Jhatwal Home AI',
            role: 'admin',
            avatar: '🤖',
          },
          mode,
        };
        setMessages((prev) => [...prev, errorMsg]);
      });
  };

  // If not logged in, render the clean family login screen
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
        allowedUsers={allowedUsers}
      />
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenSwitchUser={() => setShowSwitchModal(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenShare={() => setShowShareModal(true)}
        onOpenLiveVoice={() => setShowLiveVoiceModal(true)}
      />

      {/* Real-time Administrator Toast Alert */}
      {liveToast && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-full bg-stone-900 border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl shadow-amber-500/10 flex items-start gap-3 animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-xs font-black text-amber-300">🔔 Sign-In Alert</span>
              <button
                onClick={() => setLiveToast(null)}
                className="text-stone-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-stone-200 leading-tight">
              {liveToast.message}
            </p>
            <button
              onClick={() => {
                setLiveToast(null);
                setShowNotificationsModal(true);
              }}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 mt-1 cursor-pointer"
            >
              View in Notification Center →
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 pb-16 sm:pb-0">
        {activeTab === 'chat' && (
          <ChatView
            currentUser={currentUser}
            messages={messages}
            setMessages={setMessages}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            onClearThread={() => setMessages([])}
            onNavigateToStudio={() => setActiveTab('studio')}
            onOpenLiveVoice={() => setShowLiveVoiceModal(true)}
          />
        )}

        {activeTab === 'vault' && (
          <FamilyVault
            currentUser={currentUser}
            memories={memories}
            rules={rules}
            chores={chores}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onAddChore={handleAddChore}
            onToggleChore={handleToggleChore}
            onDeleteChore={handleDeleteChore}
          />
        )}

        {activeTab === 'tools' && (
          <FamilyTools
            currentUser={currentUser}
            onSendToChat={handleSendToChat}
          />
        )}

        {activeTab === 'studio' && (
          <ImageStudioView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'history' && isAdmin && (
          <AdminHistoryView
            currentUser={currentUser}
            allowedUsers={allowedUsers}
          />
        )}

        {activeTab === 'access' && (
          <UserManagement
            currentUser={currentUser}
            users={allowedUsers}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar for smartphones */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        onOpenLiveVoice={() => setShowLiveVoiceModal(true)}
      />

      {/* Offline Connectivity Indicator */}
      {!isOnline && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-stone-950 font-bold text-xs shadow-xl animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline — Cached household data is active</span>
        </div>
      )}

      {/* Admin Notifications Modal */}
      {showNotificationsModal && (
        <AdminNotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onClearAll={handleClearAllNotifications}
        />
      )}

      {/* Phone QR & Installation Guide Modal */}
      {showPhoneModal && (
        <PhoneAccessModal
          onClose={() => setShowPhoneModal(false)}
        />
      )}

      {/* Share / Invite Friends & Family Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Gemini 3.8 Live Voice Conversation Modal */}
      {showLiveVoiceModal && (
        <VoiceLiveModal
          isOpen={showLiveVoiceModal}
          onClose={() => setShowLiveVoiceModal(false)}
          userName={currentUser.name}
        />
      )}

      {/* Switch User Modal */}
      {showSwitchModal && (
        <SwitchUserModal
          currentUser={currentUser}
          users={allowedUsers}
          onSelectUser={handleSwitchUser}
          onClose={() => setShowSwitchModal(false)}
          onFullLogout={handleLogout}
        />
      )}
    </div>
  );
}
