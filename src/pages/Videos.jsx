import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

const emptyForm = {
  youtubeId: '',
  title: '',
  description: '',
  uploadDate: '',
  durationSeconds: '',
  featured: false,
  isActive: true,
  displayOrder: 0,
};

function thumb(youtubeId) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export default function Videos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'add' | { id } edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/api/videos/admin');
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

  const openEdit = (v) => {
    setForm({
      youtubeId: v.youtubeId || '',
      title: v.title || '',
      description: v.description || '',
      uploadDate: v.uploadDate || '',
      durationSeconds: v.durationSeconds ?? '',
      featured: !!v.featured,
      isActive: !!v.isActive,
      displayOrder: v.displayOrder ?? 0,
    });
    setModal({ id: v.id });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        durationSeconds: form.durationSeconds === '' ? null : Number(form.durationSeconds),
        displayOrder: Number(form.displayOrder) || 0,
      };
      if (modal === 'add') {
        await api.post('/api/videos', payload);
      } else {
        await api.put(`/api/videos/${modal.id}`, payload);
      }
      setModal(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (v, field) => {
    try {
      await api.put(`/api/videos/${v.id}`, { [field]: !v[field] });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const remove = async (v) => {
    if (!confirm(`Delete video "${v.title}"?`)) return;
    try {
      await api.delete(`/api/videos/${v.id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <p className="text-slate-500">Loading videos…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Videos</h2>
          <p className="text-sm text-slate-500">
            YouTube clips shown on the website. Mark <span className="font-medium">Featured</span> to
            display on the homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          + Add video
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-slate-500">No videos yet. Click “Add video”.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
            <div
              key={v.id}
              className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm"
            >
              <div className="relative aspect-video bg-slate-100">
                <img
                  src={thumb(v.youtubeId)}
                  alt={v.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute left-2 top-2 flex gap-1">
                  {v.featured && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      Featured
                    </span>
                  )}
                  {!v.isActive && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      Hidden
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-semibold text-slate-900" title={v.title}>
                  {v.title}
                </p>
                <p className="truncate text-xs text-slate-500" title={v.youtubeId}>
                  {v.youtubeId}
                  {v.durationSeconds ? ` · ${v.durationSeconds}s` : ''}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggle(v, 'featured')}
                    className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  >
                    {v.featured ? '★ Unfeature' : '☆ Feature'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(v, 'isActive')}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {v.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(v)}
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-primary hover:bg-rose-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(v)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              {modal === 'add' ? 'Add video' : 'Edit video'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  YouTube ID or URL *
                </label>
                <input
                  required
                  value={form.youtubeId}
                  onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
                  placeholder="dQw4w9WgXcQ  hoặc  https://youtu.be/dQw4w9WgXcQ"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
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
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Upload date
                  </label>
                  <input
                    type="date"
                    value={form.uploadDate}
                    onChange={(e) => setForm({ ...form, uploadDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.durationSeconds}
                    onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                <div className="flex items-end gap-4 pb-1">
                  <label className="flex items-center gap-1.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="accent-primary"
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="accent-primary"
                    />
                    Active
                  </label>
                </div>
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
