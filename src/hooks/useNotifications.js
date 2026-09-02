// src/hooks/useNotifications.js
import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const local = await notificationService.getLocal();
      setNotifications(local);
      setUnreadCount(local.filter(n => !n.is_read).length);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, is_read: true } : n)
    );
  }, []);

  return { notifications, unreadCount, markRead, loading, reload: load };
}
