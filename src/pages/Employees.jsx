import { useEffect, useState } from 'react';
import api from '../api/client';
import { employeeFullName } from '../lib/employeeDisplay';

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  payType: 'commission',
  commissionRate: '45',
  hourlyRate: '',
  baseSalary: '',
  tipsEnabled: true,
  hireDate: '',
  isActive: true,
};

function rateLabel(e) {
  if (e.payType === 'commission')
    return `${(Number(e.commissionRate || 0) * 100).toFixed(0)}%`;
  if (e.payType === 'hourly') return formatMoney(e.hourlyRate) + '/hr';
  return formatMoney(e.baseSalary) + '/mo';
}

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n || 0)
  );
}

export default function Employees() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/api/employees');
    setRows(data);
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

  const openAdd = () => {
    setForm(emptyForm);
    setModal('add');
  };

  const openEdit = (e) => {
    const cr = e.commissionRate != null ? Number(e.commissionRate) : 0;
    setForm({
      firstName: e.firstName,
      lastName: e.lastName,
      phone: e.phone || '',
      email: e.email || '',
      payType: e.payType,
      commissionRate: String(cr <= 1 && cr > 0 ? cr * 100 : cr || ''),
      hourlyRate: e.hourlyRate != null ? String(e.hourlyRate) : '',
      baseSalary: e.baseSalary != null ? String(e.baseSalary) : '',
      tipsEnabled: !!e.tipsEnabled,
      hireDate: e.hireDate || '',
      isActive: !!e.isActive,
    });
    setModal({ type: 'edit', id: e.id });
  };

  const payloadFromForm = () => {
    const p = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || null,
      email: form.email || null,
      payType: form.payType,
      tipsEnabled: form.tipsEnabled,
      hireDate: form.hireDate || null,
      isActive: form.isActive,
      commissionRate: null,
      hourlyRate: null,
      baseSalary: null,
    };
    if (form.payType === 'commission') {
      let cr = Number(form.commissionRate);
      if (cr > 1) cr /= 100;
      p.commissionRate = cr;
    }
    if (form.payType === 'hourly') p.hourlyRate = Number(form.hourlyRate) || 0;
    if (form.payType === 'salary') p.baseSalary = Number(form.baseSalary) || 0;
    return p;
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = payloadFromForm();
      if (modal === 'add') {
        await api.post('/api/employees', body);
      } else if (modal?.type === 'edit') {
        await api.put(`/api/employees/${modal.id}`, body);
      }
      setModal(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await api.delete(`/api/employees/${id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark"
        >
          Add employee
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-rose-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-rose-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Pay type</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-rose-50">
                <td className="px-4 py-3 font-medium">{employeeFullName(e)}</td>
                <td className="px-4 py-3">{e.phone || '—'}</td>
                <td className="px-4 py-3 capitalize">{e.payType}</td>
                <td className="px-4 py-3">{rateLabel(e)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {e.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => openEdit(e)}
                    className="text-primary font-medium hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    className="text-red-600 font-medium hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {modal === 'add' ? 'Add employee' : 'Edit employee'}
            </h3>
            <form onSubmit={save} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">First name</label>
                  <input
                    required
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.firstName}
                    onChange={(ev) => setForm({ ...form, firstName: ev.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Last name</label>
                  <input
                    required
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.lastName}
                    onChange={(ev) => setForm({ ...form, lastName: ev.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Phone</label>
                <input
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(ev) => setForm({ ...form, phone: ev.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(ev) => setForm({ ...form, email: ev.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Pay type</label>
                <select
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.payType}
                  onChange={(ev) => setForm({ ...form, payType: ev.target.value })}
                >
                  <option value="commission">Commission</option>
                  <option value="hourly">Hourly</option>
                  <option value="salary">Salary</option>
                </select>
              </div>
              {form.payType === 'commission' && (
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Commission % (e.g. 45 for 45%, or 0.45 for 45%)
                  </label>
                  <input
                    step="0.01"
                    min="0"
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.commissionRate}
                    onChange={(ev) => setForm({ ...form, commissionRate: ev.target.value })}
                  />
                </div>
              )}
              {form.payType === 'hourly' && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Hourly rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.hourlyRate}
                    onChange={(ev) => setForm({ ...form, hourlyRate: ev.target.value })}
                  />
                </div>
              )}
              {form.payType === 'salary' && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Base salary ($/month)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.baseSalary}
                    onChange={(ev) => setForm({ ...form, baseSalary: ev.target.value })}
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.tipsEnabled}
                  onChange={(ev) => setForm({ ...form, tipsEnabled: ev.target.checked })}
                />
                Tips enabled
              </label>
              <div>
                <label className="text-xs font-medium text-slate-600">Hire date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.hireDate}
                  onChange={(ev) => setForm({ ...form, hireDate: ev.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(ev) => setForm({ ...form, isActive: ev.target.checked })}
                />
                Active
              </label>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium"
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
