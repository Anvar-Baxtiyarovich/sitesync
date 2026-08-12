'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  icon?: string;
  type?: 'CHAT' | 'DIRECTIVE' | 'REPORT';
  link?: string;
}

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  sendNotification: (title: string, body: string, icon?: string, type?: 'CHAT' | 'DIRECTIVE' | 'REPORT') => void;
  activePopups: NotificationItem[];
  dismissPopup: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  permission: 'default',
  requestPermission: async () => {},
  sendNotification: () => {},
  activePopups: [],
  dismissPopup: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

/**
 * Web Audio API Notification Chime Generator (No external audio file needed)
 */
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio context play error ignored
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [activePopups, setActivePopups] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
    }
  };

  const dismissPopup = (id: string) => {
    setActivePopups((prev) => prev.filter((p) => p.id !== id));
  };

  const sendNotification = (
    title: string,
    body: string,
    icon: string = '🔔',
    type: 'CHAT' | 'DIRECTIVE' | 'REPORT' = 'CHAT'
  ) => {
    // 1. Play subtle audio chime sound
    playNotificationChime();

    // 2. In-App Floating Toast Popup Banner
    const newItem: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random()}`,
      title,
      body,
      icon,
      type,
    };

    setActivePopups((prev) => [newItem, ...prev.slice(0, 2)]); // Keep max 3 popups

    // Auto-dismiss in-app popup after 4.5 seconds
    setTimeout(() => {
      dismissPopup(newItem.id);
    }, 4500);

    // 3. Native Browser / Phone System Notification (if permission granted)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/manifest-icon.png',
          badge: '/manifest-icon.png',
        });
      } catch {
        // Ignored
      }
    }
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, sendNotification, activePopups, dismissPopup }}>
      {children}

      {/* ── Floating Notification Pop-up Banners (Top Right / Center) ── */}
      {activePopups.length > 0 && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2 pointer-events-none">
          {activePopups.map((popup) => (
            <div
              key={popup.id}
              className="pointer-events-auto bg-slate-900/95 border border-emerald-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-white flex items-start gap-3 animate-in slide-in-from-top-4 duration-300 ring-1 ring-emerald-500/30"
            >
              <div className="text-2xl p-2 bg-emerald-950/80 rounded-xl border border-emerald-700/50 shrink-0">
                {popup.icon || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <h4 className="font-bold text-xs text-emerald-300 truncate">{popup.title}</h4>
                  <button
                    onClick={() => dismissPopup(popup.id)}
                    className="text-xs text-slate-400 hover:text-white p-1"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-200 mt-0.5 leading-snug line-clamp-2">{popup.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}
