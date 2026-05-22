import { useState, useEffect } from 'react';

const LS_KEY = 'nail_notif_consent_asked';

export default function NotificationConsentDialog() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(LS_KEY)) return;
    // Small delay so the page settles before showing dialog
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  const enable = async () => {
    setShow(false);
    localStorage.setItem(LS_KEY, 'asked');
    await Notification.requestPermission();
  };

  const skip = () => {
    setShow(false);
    localStorage.setItem(LS_KEY, 'skipped');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-6 shadow-2xl">
        <div className="mb-3 flex justify-center text-4xl">🔔</div>
        <h2 className="text-center text-lg font-bold text-slate-800">
          Enable Booking Notifications?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 leading-relaxed">
          Get instant browser alerts when customers book online — so you never miss a new appointment.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={skip}
            className="flex-1 rounded-xl border border-rose-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={enable}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-dark"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
