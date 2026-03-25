import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { employeeFullName } from '../lib/employeeDisplay';
import { todayISO } from '../utils/format';

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function statusStyle(status) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'in_progress':
      return 'bg-amber-100 text-amber-900';
    case 'cancelled':
      return 'bg-slate-200 text-slate-600';
    default:
      return 'bg-rose-100 text-primary';
  }
}

export default function Schedule() {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/appointments/day', { params: { date } });
        if (!cancelled) setRows(data || []);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const refresh = async () => {
    const { data } = await api.get('/api/appointments/day', { params: { date } });
    setRows(data || []);
  };

  const confirmWeb = async (a) => {
    setActing(a.id);
    try {
      await api.put(`/api/appointments/${a.id}`, { status: 'in_progress' });
      await refresh();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setActing(null);
    }
  };

  const cancelWeb = async (a) => {
    if (!confirm('Cancel this web booking?')) return;
    setActing(a.id);
    try {
      await api.put(`/api/appointments/${a.id}`, { status: 'cancelled' });
      await refresh();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setActing(null);
    }
  };

  const byHour = useMemo(() => {
    const map = {};
    for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h += 1) {
      map[h] = [];
    }
    rows.forEach((a) => {
      const d = new Date(a.scheduledAt);
      if (Number.isNaN(d.getTime())) return;
      let h = d.getHours();
      if (h < DAY_START_HOUR) h = DAY_START_HOUR;
      if (h > DAY_END_HOUR) h = DAY_END_HOUR;
      map[h].push(a);
    });
    return map;
  }, [rows]);

  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Schedule</h2>
          <p className="text-sm text-slate-500">
            Bookings by hour (phone AI and admin). Times use your browser timezone.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-rose-200 px-3 py-2 text-sm shadow-sm"
          />
          <button
            type="button"
            onClick={() => setDate(todayISO())}
            className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-primary hover:bg-rose-50"
          >
            Today
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading schedule…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
          <div className="border-b border-rose-100 bg-rose-50/80 px-4 py-3">
            <p className="text-sm font-medium text-slate-700">
              {new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              · {rows.length} appointment{rows.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="divide-y divide-rose-100">
            {hours.map((hour) => {
              const label = new Date(2000, 0, 1, hour, 0).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              });
              const list = byHour[hour] || [];
              return (
                <div key={hour} className="grid gap-0 md:grid-cols-[120px_1fr]">
                  <div className="border-b border-rose-50 bg-rose-50/40 px-4 py-3 text-sm font-semibold text-slate-700 md:border-b-0 md:border-r md:border-rose-100">
                    {label}
                  </div>
                  <div className="min-h-[52px] space-y-2 px-4 py-3">
                    {list.length === 0 ? (
                      <span className="text-sm text-slate-400">No bookings</span>
                    ) : (
                      list.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              {formatTime(a.scheduledAt)}
                              {a.Service?.duration != null && (
                                <span className="ml-2 font-normal text-slate-500">
                                  ({a.Service.duration} min)
                                </span>
                              )}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {a.source === 'web' && (
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-indigo-800">
                                  Web booking
                                </span>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyle(a.status)}`}
                              >
                                {a.status?.replace('_', ' ') || 'scheduled'}
                              </span>
                            </div>
                          </div>
                          {a.source === 'web' &&
                            a.status !== 'cancelled' &&
                            a.status !== 'completed' && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={acting === a.id}
                                  onClick={() => confirmWeb(a)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  disabled={acting === a.id}
                                  onClick={() => cancelWeb(a)}
                                  className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          <p className="mt-1 text-slate-800">
                            <span className="font-medium">{a.customerName}</span>
                            {a.customerPhone && (
                              <span className="text-slate-600"> · {a.customerPhone}</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-600">
                            {a.Service?.name || 'Service'}{' '}
                            {a.Employee && (
                              <>
                                ·{' '}
                                <span className="font-medium text-primary">
                                  {employeeFullName(a.Employee)}
                                </span>
                              </>
                            )}
                          </p>
                          {a.notes && (
                            <p className="mt-1 text-xs italic text-slate-500">{a.notes}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
