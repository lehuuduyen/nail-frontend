import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import api from '../api/client';
import { employeeFullName } from '../lib/employeeDisplay';
import { formatCurrency } from '../utils/format';

const PIE_COLORS = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#e11d48', '#be123c', '#9f1239'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(null);
  const [empBars, setEmpBars] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [lineData, setLineData] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [sumRes, empRes, popRes] = await Promise.all([
          api.get('/api/transactions/summary', { params: { start, end } }),
          api.get('/api/employees'),
          api.get('/api/services/popular', { params: { start, end } }),
        ]);
        if (cancelled) return;
        setSummary(sumRes.data);

        const emps = empRes.data || [];
        const stats = await Promise.all(
          emps.map((e) =>
            api
              .get(`/api/employees/${e.id}/stats`, { params: { start, end } })
              .then((r) => ({
                name: employeeFullName(e).slice(0, 14),
                revenue: Number(r.data.revenue || 0),
              }))
              .catch(() => ({ name: employeeFullName(e).slice(0, 14), revenue: 0 }))
          )
        );
        setEmpBars(stats.filter((s) => s.revenue > 0).sort((a, b) => b.revenue - a.revenue));

        const catMap = {};
        (popRes.data || []).forEach((row) => {
          const cat = row.service?.category || 'other';
          catMap[cat] = (catMap[cat] || 0) + Number(row.totalRevenue || 0);
        });
        setPieData(
          Object.entries(catMap).map(([name, value]) => ({
            name,
            value: Number(value.toFixed(2)),
          }))
        );

        const months = [];
        const cur = new Date(start + 'T12:00:00');
        const endD = new Date(end + 'T12:00:00');
        while (cur <= endD) {
          const y = cur.getFullYear();
          const m = cur.getMonth();
          const ms = `${y}-${String(m + 1).padStart(2, '0')}-01`;
          const last = new Date(y, m + 1, 0);
          const me = last.toISOString().slice(0, 10);
          months.push({ label: `${y}-${String(m + 1).padStart(2, '0')}`, start: ms, end: me });
          cur.setMonth(cur.getMonth() + 1);
        }
        const lineRows = await Promise.all(
          months.map(async (mo) => {
            const { data } = await api.get('/api/transactions/revenue', {
              params: { start: mo.start, end: mo.end },
            });
            return { month: mo.label, revenue: Number(data.totalAmount || 0) };
          })
        );
        setLineData(lineRows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  if (loading) return <p className="text-slate-500">Loading reports…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs text-slate-600">Start</label>
            <input
              type="date"
              className="mt-1 block rounded-lg border border-rose-200 px-3 py-2 text-sm"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">End</label>
            <input
              type="date"
              className="mt-1 block rounded-lg border border-rose-200 px-3 py-2 text-sm"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Total revenue</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Transactions</p>
            <p className="text-xl font-bold">{summary.totalTransactions}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Avg transaction</p>
            <p className="text-xl font-bold">{formatCurrency(summary.avgTransaction)}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800">Revenue by employee</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={empBars} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis type="number" tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#f43f5e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Revenue by category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Monthly revenue trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
