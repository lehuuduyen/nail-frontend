import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../api/client';
import { employeeFullName } from '../lib/employeeDisplay';
import StatCard from '../components/StatCard';
import { formatCurrency, todayISO, lastNDates } from '../utils/format';

export default function Dashboard() {
  const [daily, setDaily] = useState(null);
  const [services, setServices] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [recent, setRecent] = useState([]);
  const [topToday, setTopToday] = useState('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = todayISO();
        const [dailyRes, svcRes, ...dailyCharts] = await Promise.all([
          api.get('/api/transactions/daily', { params: { date: today } }),
          api.get('/api/services'),
          ...lastNDates(7).map((d) => api.get('/api/transactions/daily', { params: { date: d } })),
        ]);
        const txRes = await api.get('/api/transactions', { params: { limit: 100 } });

        if (cancelled) return;
        setDaily(dailyRes.data);
        setServices(svcRes.data || []);

        const chart = lastNDates(7).map((d, i) => ({
          date: d.slice(5),
          revenue: Number(dailyCharts[i]?.data?.totalAmount || 0),
        }));
        setChartData(chart);

        const txs = txRes.data || [];
        const todayTxs = txs.filter((t) => t.date === today);
        const byEmp = {};
        todayTxs.forEach((t) => {
          const id = t.employeeId;
          const name = t.Employee ? employeeFullName(t.Employee) : `#${id}`;
          byEmp[id] = byEmp[id] || { name, sum: 0 };
          byEmp[id].sum += Number(t.amount || 0);
        });
        let best = null;
        Object.values(byEmp).forEach((v) => {
          if (!best || v.sum > best.sum) best = v;
        });
        setTopToday(best ? `${best.name} (${formatCurrency(best.sum)})` : '—');

        const sorted = [...txs].sort((a, b) => {
          const da = new Date(a.date + 'T12:00:00');
          const db = new Date(b.date + 'T12:00:00');
          return db - da;
        });
        setRecent(sorted.slice(0, 10));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeServices = services.filter((s) => s.isActive).length;

  if (loading) {
    return <p className="text-slate-500">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today's revenue" value={formatCurrency(daily?.totalAmount)} />
        <StatCard
          title="Transactions today"
          value={String(daily?.transactionCount ?? 0)}
        />
        <StatCard title="Top employee today" value={topToday} />
        <StatCard title="Active services" value={String(activeServices)} />
      </div>

      <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800">Revenue (last 7 days)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-100 bg-white shadow-sm">
        <div className="border-b border-rose-100 px-6 py-4">
          <h3 className="font-semibold text-slate-800">Recent transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-rose-50/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-t border-rose-50">
                  <td className="px-4 py-3">{t.date}</td>
                  <td className="px-4 py-3">
                    {t.Employee ? employeeFullName(t.Employee) : '—'}
                  </td>
                  <td className="px-4 py-3">{t.Service?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
