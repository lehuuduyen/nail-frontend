import { useEffect, useState } from 'react';
import api from '../api/client';

export default function LoginErrorLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get('/api/login-error-logs', { params: { limit: 200 } });
    setLogs(data);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Login Error Logs</h2>
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-primary hover:bg-rose-50"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-rose-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-rose-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No errors logged
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t border-rose-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{l.username || '—'}</td>
                  <td className="px-4 py-3">{l.status ?? 'Network'}</td>
                  <td className="px-4 py-3">{l.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
