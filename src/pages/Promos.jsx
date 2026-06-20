import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

const emptyForm = {
  title: '',
  description: '',
  details: '',
  badge: '',
  startDate: '',
  endDate: '',
  ctaLabel: 'Book Now',
  ctaHref: '/booking',
  active: true,
  showCountdown: false,
  displayOrder: 0,
  tiers: [],
};

function fmt(d) {
  if (!d) return '';
  return String(d).slice(0, 10);
}

export default function Promos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'add' | { id }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/api/promos/admin');
    setItems(data || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const openAdd = () => {
    setForm({ ...emptyForm, displayOrder: items.length });
    setModal('add');
  };

  const openEdit = (p) => {
    setForm({
      title: p.title || '',
      description: p.description || '',
      details: p.details || '',
      badge: p.badge || '',
      startDate: fmt(p.startDate),
      endDate: fmt(p.endDate),
      ctaLabel: p.ctaLabel || 'Book Now',
      ctaHref: p.ctaHref || '/booking',
      active: !!p.active,
      showCountdown: !!p.showCountdown,
      displayOrder: p.displayOrder ?? 0,
      tiers: Array.isArray(p.tiers) ? p.tiers : [],
    });
    setModal({ id: p.id });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) || 0 };
      if (modal === 'add') {
        await api.post('/api/promos', payload);
      } else {
        await api.put(`/api/promos/${modal.id}`, payload);
      }
      setModal(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTier = () =>
    setForm((f) => ({ ...f, tiers: [...f.tiers, { worth: '', pay: '', bestValue: false }] }));
  const updateTier = (i, key, val) =>
    setForm((f) => ({
      ...f,
      tiers: f.tiers.map((t, idx) => (idx === i ? { ...t, [key]: val } : t)),
    }));
  const removeTier = (i) =>
    setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }));

  const toggle = async (p) => {
    try {
      await api.put(`/api/promos/${p.id}`, { active: !p.active });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete promo "${p.title}"?`)) return;
    try {
      await api.delete(`/api/promos/${p.id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <p className="text-slate-500">Loading promos…</p>;

  const today = new Date().toISOString().slice(0, 10);
  const status = (p) => {
    if (!p.active) return { label: 'Off', cls: 'bg-slate-200 text-slate-600' };
    if (fmt(p.endDate) < today) return { label: 'Expired', cls: 'bg-amber-100 text-amber-800' };
    if (fmt(p.startDate) > today) return { label: 'Scheduled', cls: 'bg-sky-100 text-sky-800' };
    return { label: 'Live', cls: 'bg-emerald-100 text-emerald-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Promotions</h2>
          <p className="text-sm text-slate-500">
            Shown on the website announcement bar, homepage, and /specials. Dates use Arizona
            (Phoenix) time.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          + Add promo
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-slate-500">No promos yet. Click “Add promo”.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-rose-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {items.map((p) => {
                const st = status(p);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.title}</p>
                      {p.badge && <span className="text-xs text-slate-500">{p.badge}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {fmt(p.startDate)} → {fmt(p.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(p)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {p.active ? 'Turn off' : 'Turn on'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-primary hover:bg-rose-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(p)}
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              {modal === 'add' ? 'Add promo' : 'Edit promo'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Details / fine print
                </label>
                <textarea
                  rows={2}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Badge</label>
                  <input
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="Limited Time"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Display order
                  </label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Start date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">End date *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    CTA label
                  </label>
                  <input
                    value={form.ctaLabel}
                    onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">CTA link</label>
                  <input
                    value={form.ctaHref}
                    onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
                    placeholder="/booking or /specials"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-600">
                    Pricing tiers (optional)
                  </label>
                  <button
                    type="button"
                    onClick={addTier}
                    className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-medium text-primary hover:bg-rose-100"
                  >
                    + Add tier
                  </button>
                </div>
                {form.tiers.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    For gift-card style promos: e.g. worth $50 → pay $45.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.tiers.map((t, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">Worth $</span>
                        <input
                          type="number"
                          min="0"
                          value={t.worth}
                          onChange={(e) => updateTier(i, 'worth', e.target.value)}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <span className="text-xs text-slate-500">Pay $</span>
                        <input
                          type="number"
                          min="0"
                          value={t.pay}
                          onChange={(e) => updateTier(i, 'pay', e.target.value)}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <label className="flex items-center gap-1 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={!!t.bestValue}
                            onChange={(e) => updateTier(i, 'bestValue', e.target.checked)}
                            className="accent-primary"
                          />
                          Best
                        </label>
                        <button
                          type="button"
                          onClick={() => removeTier(i)}
                          className="ml-auto rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="accent-primary"
                  />
                  Active (master switch)
                </label>
                <label className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.showCountdown}
                    onChange={(e) => setForm({ ...form, showCountdown: e.target.checked })}
                    className="accent-primary"
                  />
                  Show countdown timer
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
