import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { formatCurrency } from '../utils/format';

const sectionOrder = [
  'manicure',
  'pedicure',
  'nails',
  'addon',
  'kids',
  'lash',
  'waxing',
  'head_spa',
  'facial',
  'acrylic',
  'gel',
  'dip',
  'other',
];

const categories = [
  ...sectionOrder,
];

function labelCat(cat) {
  return cat.replace(/_/g, ' ');
}

const emptySvc = {
  name: '',
  nameVi: '',
  description: '',
  price: '',
  priceCard: '',
  duration: '',
  menuSort: '0',
  category: 'manicure',
  isActive: true,
};

export default function Services() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptySvc);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/api/services');
    setList(data);
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

  const grouped = useMemo(() => {
    const g = {};
    list.forEach((s) => {
      const c = s.category || 'other';
      if (!g[c]) g[c] = [];
      g[c].push(s);
    });
    Object.keys(g).forEach((c) => {
      g[c].sort(
        (a, b) =>
          (a.menuSort ?? 0) - (b.menuSort ?? 0) || (a.id ?? 0) - (b.id ?? 0)
      );
    });
    return g;
  }, [list]);

  const orderedSections = useMemo(() => {
    const seen = new Set();
    const out = [];
    sectionOrder.forEach((c) => {
      if (grouped[c]?.length) {
        out.push(c);
        seen.add(c);
      }
    });
    Object.keys(grouped).forEach((c) => {
      if (!seen.has(c)) out.push(c);
    });
    return out;
  }, [grouped]);

  const openAdd = () => {
    setForm(emptySvc);
    setModal('add');
  };

  const openEdit = (s) => {
    setForm({
      name: s.name,
      nameVi: s.nameVi || '',
      description: s.description || '',
      price: String(s.price),
      priceCard: s.priceCard != null && s.priceCard !== '' ? String(s.priceCard) : '',
      duration: String(s.duration),
      menuSort: String(s.menuSort ?? 0),
      category: s.category,
      isActive: !!s.isActive,
    });
    setModal({ type: 'edit', id: s.id });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        nameVi: form.nameVi?.trim() || null,
        description: form.description || null,
        price: Number(form.price),
        priceCard:
          form.priceCard === '' || form.priceCard == null
            ? null
            : Number(form.priceCard),
        duration: parseInt(form.duration, 10),
        menuSort: parseInt(form.menuSort, 10) || 0,
        category: form.category,
        isActive: form.isActive,
      };
      if (modal === 'add') await api.post('/api/services', body);
      else await api.put(`/api/services/${modal.id}`, body);
      setModal(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/api/services/${s.id}`, { isActive: !s.isActive });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Services</h2>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark"
        >
          Add service
        </button>
      </div>

      {orderedSections.map((cat) => (
        <section key={cat}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
            {labelCat(cat)}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(grouped[cat] || []).map((s) => (
              <div
                key={s.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                  s.isActive ? 'border-rose-100' : 'border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      Cash {formatCurrency(s.price)}
                    </p>
                    {s.priceCard != null && Number(s.priceCard) !== Number(s.price) && (
                      <p className="text-sm text-slate-600">
                        Card {formatCurrency(s.priceCard)}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {s.duration} min · sort {s.menuSort ?? 0}
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                    {labelCat(s.category)}
                  </span>
                </div>
                {s.description && (
                  <p className="mt-2 line-clamp-3 text-xs text-slate-600">{s.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(s)}
                    className="text-sm font-medium text-slate-600 hover:underline"
                  >
                    {s.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">
              {modal === 'add' ? 'Add service' : 'Edit service'}
            </h3>
            <form onSubmit={save} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Name (English)</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(ev) => setForm({ ...form, name: ev.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Name (Vietnamese)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.nameVi}
                  onChange={(ev) => setForm({ ...form, nameVi: ev.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Category</label>
                <select
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm capitalize"
                  value={form.category}
                  onChange={(ev) => setForm({ ...form, category: ev.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {labelCat(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Cash price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.price}
                    onChange={(ev) => setForm({ ...form, price: ev.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Card price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.priceCard}
                    onChange={(ev) => setForm({ ...form, priceCard: ev.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Duration (min)</label>
                  <input
                    type="number"
                    required
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.duration}
                    onChange={(ev) => setForm({ ...form, duration: ev.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Menu sort</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.menuSort}
                    onChange={(ev) => setForm({ ...form, menuSort: ev.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Description</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(ev) => setForm({ ...form, description: ev.target.value })}
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
