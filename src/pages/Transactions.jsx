import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { employeeFullName } from '../lib/employeeDisplay';
import { formatCurrency, todayISO } from '../utils/format';

function customerCell(t) {
  if (t.notes && t.notes.includes('Customer:')) return t.notes.replace(/^.*Customer:\s*/i, '').split('|')[0].trim();
  if (t.Appointment?.customerName) return t.Appointment.customerName;
  return '—';
}

export default function Transactions() {
  const [all, setAll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState(todayISO());
  const [employeeId, setEmployeeId] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    employeeId: '',
    serviceId: '',
    tips: '0',
    paymentMethod: 'cash',
    date: todayISO(),
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [tx, em, sv] = await Promise.all([
      api.get('/api/transactions', { params: { limit: 500 } }),
      api.get('/api/employees'),
      api.get('/api/services'),
    ]);
    setAll(tx.data);
    setEmployees(em.data);
    setServices(sv.data);
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

  const filtered = useMemo(() => {
    return all.filter((t) => {
      if (t.date < start || t.date > end) return false;
      if (employeeId && String(t.employeeId) !== String(employeeId)) return false;
      return true;
    });
  }, [all, start, end, employeeId]);

  const totalRevenue = useMemo(
    () =>
      filtered.reduce((s, t) => {
        const a = Number(t.amount || 0);
        const tip = Number(t.tips || 0);
        return s + Math.max(0, a - tip);
      }, 0),
    [filtered]
  );

  const selectedService = services.find((s) => String(s.id) === String(form.serviceId));
  const price = selectedService ? Number(selectedService.price) : '';

  const openModal = () => {
    setForm({
      customerName: '',
      customerPhone: '',
      employeeId: employees[0]?.id ? String(employees[0].id) : '',
      serviceId: services[0]?.id ? String(services[0].id) : '',
      tips: '0',
      paymentMethod: 'cash',
      date: todayISO(),
    });
    setModal(true);
  };

  const submitTx = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.serviceId) {
      alert('Select employee and service');
      return;
    }
    setSaving(true);
    try {
      const notes = `Customer: ${form.customerName || 'Walk-in'} | Tel: ${form.customerPhone || '—'}`;
      const price = Number(selectedService?.price || 0);
      const tipAmt = Number(form.tips) || 0;
      await api.post('/api/transactions', {
        employeeId: Number(form.employeeId),
        serviceId: Number(form.serviceId),
        amount: Math.round((price + tipAmt) * 100) / 100,
        tips: Math.round(tipAmt * 100) / 100,
        paymentMethod: form.paymentMethod,
        date: form.date.slice(0, 10),
        notes,
      });
      setModal(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
        <button
          type="button"
          onClick={openModal}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark"
        >
          Add transaction
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
        <div>
          <label className="text-xs font-medium text-slate-600">Start date</label>
          <input
            type="date"
            className="mt-1 block rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">End date</label>
          <input
            type="date"
            className="mt-1 block rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Employee</label>
          <select
            className="mt-1 block min-w-[160px] rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">All employees</option>
            {employees.map((em) => (
              <option key={em.id} value={em.id}>
                {employeeFullName(em)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-rose-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-rose-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Tips</th>
              <th className="px-4 py-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-rose-50">
                <td className="px-4 py-3">{t.date}</td>
                <td className="px-4 py-3">{customerCell(t)}</td>
                <td className="px-4 py-3">
                  {t.Employee ? employeeFullName(t.Employee) : '—'}
                </td>
                <td className="px-4 py-3">{t.Service?.name || '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.amount)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(t.tips)}</td>
                <td className="px-4 py-3 capitalize">{t.paymentMethod}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-rose-200 bg-rose-50/50 font-semibold">
              <td colSpan={4} className="px-4 py-3 text-right">
                Total revenue (filtered)
              </td>
              <td className="px-4 py-3 text-right text-primary">{formatCurrency(totalRevenue)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">New transaction</h3>
            <form onSubmit={submitTx} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Customer name</label>
                <input
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Customer phone</label>
                <input
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Employee</label>
                <select
                  required
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                >
                  {employees.map((em) => (
                    <option key={em.id} value={em.id}>
                      {employeeFullName(em)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Service (price auto)</label>
                <select
                  required
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatCurrency(s.price)}
                    </option>
                  ))}
                </select>
                {price !== '' && (
                  <p className="mt-1 text-xs text-slate-500">Charged: {formatCurrency(price)}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Tips ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.tips}
                  onChange={(e) => setForm({ ...form, tips: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Payment method</label>
                <select
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm capitalize"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                >
                  {['cash', 'card', 'venmo', 'zelle', 'other'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Date</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
