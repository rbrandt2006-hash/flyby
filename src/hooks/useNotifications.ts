import { useState, useEffect, useCallback } from "react";

export interface AppNotification {
  id: string;
  type: "trip" | "expense" | "chat" | "system";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    route: string;
    entityId?: string;
  };
}

const STORAGE_KEY = "flyby_notifications";

function loadNotificationsFromStorage(): AppNotification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load notifications from localStorage:", e);
  }
  return [];
}

function saveNotificationsToStorage(notifications: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error("Failed to save notifications to localStorage:", e);
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotificationsFromStorage());

  useEffect(() => {
    saveNotificationsToStorage(notifications);
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<AppNotification, "id" | "timestamp" | "read">): AppNotification => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification;
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    unreadCount,
  };
}
