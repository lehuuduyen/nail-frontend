export default function BookingToast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(({ id, booking }) => {
        const time = new Date(booking.scheduledAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
        return (
          <div
            key={id}
            className="flex w-80 items-start gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 shadow-lg"
          >
            <span className="mt-0.5 text-xl">📅</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">New Online Booking</p>
              <p className="truncate text-sm text-slate-600">
                {booking.customerName} — {booking.Service?.name ?? 'Service'}
              </p>
              <p className="text-xs text-slate-400">{time}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(id)}
              className="shrink-0 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
