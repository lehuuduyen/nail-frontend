import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/client';

const POLL_INTERVAL = 30_000;
const LS_KEY = 'nail_notif_last_checked';

function requestBrowserPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function fireBrowserNotification(booking) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const time = new Date(booking.scheduledAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  new Notification('New Online Booking!', {
    body: `${booking.customerName} — ${booking.Service?.name ?? 'Service'} on ${time}`,
    icon: '/favicon.png',
  });
}

export function useBookingNotifications(isAuthenticated) {
  const [toasts, setToasts] = useState([]);
  const lastCheckedRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    requestBrowserPermission();

    const stored = localStorage.getItem(LS_KEY);
    lastCheckedRef.current = stored ? new Date(stored) : new Date();

    async function poll() {
      const since = lastCheckedRef.current.toISOString();
      const now = new Date();
      try {
        const { data } = await api.get(`/api/appointments/new-web?since=${encodeURIComponent(since)}`);
        if (data.length > 0) {
          data.forEach(fireBrowserNotification);
          setToasts((prev) => [
            ...data.map((b) => ({ id: b.id, booking: b })),
            ...prev,
          ]);
        }
      } catch {
        // network error — skip silently
      }
      lastCheckedRef.current = now;
      localStorage.setItem(LS_KEY, now.toISOString());
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  return { toasts, dismissToast };
}
