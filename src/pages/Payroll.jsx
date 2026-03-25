import { useEffect, useState } from 'react';
import api from '../api/client';
import { employeeFullName } from '../lib/employeeDisplay';
import { formatCurrency } from '../utils/format';

function statusBadge(status) {
  const map = {
    draft: 'bg-slate-200 text-slate-700',
    approved: 'bg-amber-100 text-amber-900',
    paid: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] || ''}`}>
      {status}
    </span>
  );
}

export default function Payroll() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('0');
  const [hoursWorked, setHoursWorked] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get('/api/employees').then((r) => setEmployees(r.data));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { start: periodStart, end: periodEnd };
        const [pr, sum] = await Promise.all([
          api.get('/api/payroll', { params }),
          api.get('/api/payroll/summary', { params }),
        ]);
        if (!cancelled) {
          setRows(pr.data);
          setSummary(sum.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [periodStart, periodEnd]);

  const loadPayrolls = async () => {
    const params = { start: periodStart, end: periodEnd };
    const [pr, sum] = await Promise.all([
      api.get('/api/payroll', { params }),
      api.get('/api/payroll/summary', { params }),
    ]);
    setRows(pr.data);
    setSummary(sum.data);
  };

  const filteredRows = filterEmployeeId
    ? rows.filter((r) => String(r.employeeId) === String(filterEmployeeId))
    : rows;

  const generate = async () => {
    const bonus = Number(bonusAmount) || 0;
    const hours = hoursWorked === '' ? undefined : Number(hoursWorked);
    const targets =
      filterEmployeeId !== ''
        ? employees.filter((e) => String(e.id) === String(filterEmployeeId))
        : employees.filter((e) => e.isActive);

    if (!targets.length) {
      alert('No employees to generate for');
      return;
    }

    setGenerating(true);
    try {
      for (const em of targets) {
        const body = {
          employeeId: em.id,
          periodStart,
          periodEnd,
          bonusAmount: bonus,
        };
        if (em.payType === 'hourly') {
          body.hoursWorked = hours ?? 0;
        }
        await api.post('/api/payroll/generate', body);
      }
      setBonusAmount('0');
      setHoursWorked('');
      await loadPayrolls();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setGenerating(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.put(`/api/payroll/${id}/status`, { status });
      await loadPayrolls();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const payDisplay = (p) => {
    const e = p.Employee;
    if (e?.payType === 'commission')
      return formatCurrency(p.commissionAmount || 0) + ' (commission)';
    if (e?.payType === 'hourly')
      return `${p.hoursWorked ?? '—'}h × → ${formatCurrency(p.hourlyEarnings || 0)}`;
    return formatCurrency(p.baseSalary || 0) + ' (salary)';
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Payroll</h2>

      <div className="grid gap-4 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Period start</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Period end</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Employee filter</label>
          <select
            className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
          >
            <option value="">All employees</option>
            {employees.map((em) => (
              <option key={em.id} value={em.id}>
                {employeeFullName(em)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Bonus (each, $)</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(e.target.value)}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-slate-600">
            Hours worked (hourly employees only, same value for all if generating all)
          </label>
          <input
            type="number"
            step="0.25"
            placeholder="e.g. 80"
            className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={generating}
            onClick={generate}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-dark disabled:opacity-60"
          >
            {generating ? 'Generating…' : 'Generate payroll'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="rounded-2xl border border-primary/30 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Total payout (period)</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(summary.totalPayout)}</p>
          <p className="text-xs text-slate-500">{summary.payrollCount} payroll record(s)</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-rose-100 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-rose-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Employee</th>
              <th className="px-3 py-3">Pay type</th>
              <th className="px-3 py-3 text-right">Services</th>
              <th className="px-3 py-3 text-right">Revenue</th>
              <th className="px-3 py-3">Earned</th>
              <th className="px-3 py-3 text-right">Tips</th>
              <th className="px-3 py-3 text-right">Bonus</th>
              <th className="px-3 py-3 text-right">Total pay</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((p) => (
              <tr key={p.id} className="border-t border-rose-50">
                <td className="px-3 py-3 font-medium">
                  {p.Employee ? employeeFullName(p.Employee) : `#${p.employeeId}`}
                </td>
                <td className="px-3 py-3 capitalize">{p.Employee?.payType || '—'}</td>
                <td className="px-3 py-3 text-right">{p.totalServices}</td>
                <td className="px-3 py-3 text-right">{formatCurrency(p.totalRevenue)}</td>
                <td className="px-3 py-3 text-xs">{payDisplay(p)}</td>
                <td className="px-3 py-3 text-right">{formatCurrency(p.totalTips)}</td>
                <td className="px-3 py-3 text-right">{formatCurrency(p.bonusAmount)}</td>
                <td className="px-3 py-3 text-right font-bold text-primary">
                  {formatCurrency(p.totalPay)}
                </td>
                <td className="px-3 py-3">{statusBadge(p.status)}</td>
                <td className="px-3 py-3 text-right space-x-2 whitespace-nowrap">
                  {p.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => setStatus(p.id, 'approved')}
                      className="text-xs font-medium text-amber-700 hover:underline"
                    >
                      Approve
                    </button>
                  )}
                  {p.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => setStatus(p.id, 'paid')}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Mark paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
