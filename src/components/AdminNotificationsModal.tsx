import React from 'react';
import { AdminNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Smartphone,
  Laptop,
  Clock,
  Shield,
  UserCheck,
} from 'lucide-react';

interface AdminNotificationsModalProps {
  notifications: AdminNotification[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const AdminNotificationsModal: React.FC<AdminNotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getDeviceIcon = (deviceInfo?: string) => {
    if (!deviceInfo) return <Smartphone className="w-3.5 h-3.5" />;
    const d = deviceInfo.toLowerCase();
    if (d.includes('pc') || d.includes('mac') || d.includes('laptop')) {
      return <Laptop className="w-3.5 h-3.5" />;
    }
    return <Smartphone className="w-3.5 h-3.5" />;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">Administrator Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Real-time alerts when family members access Jhatwal Home
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between py-2.5 px-1 border-b border-stone-800/60 text-xs">
            <span className="text-stone-400 font-medium">
              {notifications.length} total event{notifications.length === 1 ? '' : 's'} recorded
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800/60 hover:bg-red-500/20 text-stone-400 hover:text-red-300 font-medium transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div className="overflow-y-auto flex-1 divide-y divide-stone-800/60 my-2 pr-1 space-y-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-800/60 border border-stone-800 flex items-center justify-center text-stone-500 mx-auto mb-3">
                <Bell className="w-6 h-6 text-stone-600" />
              </div>
              <p className="text-sm font-semibold text-stone-300 mb-1">No notifications yet</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Whenever Sunita, Kabir, or another family member logs into their account from any phone or device, an alert will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl transition flex items-start gap-3 ${
                  !item.read
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : 'bg-stone-950/40 hover:bg-stone-950/70 border border-stone-800/40'
                }`}
              >
                {/* Member Avatar */}
                <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-xl shrink-0 border border-stone-700/50 shadow-inner">
                  {item.avatar || '👤'}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                        {item.role}
                      </span>
                    </div>

                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-sm shadow-amber-400/50 animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed mb-2">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-500" />
                      {formatTime(item.timestamp)}
                    </span>
                    {item.deviceInfo && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-800/80 text-stone-300 border border-stone-700/50">
                        {getDeviceIcon(item.deviceInfo)}
                        {item.deviceInfo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Family Administrator Security Monitor
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
