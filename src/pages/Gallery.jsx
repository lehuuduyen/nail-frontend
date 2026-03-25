import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

const categories = [
  'manicure',
  'pedicure',
  'acrylic',
  'gel',
  'dip',
  'waxing',
  'other',
  'nail_art',
];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [cat, setCat] = useState('manicure');

  const load = useCallback(async () => {
    const { data } = await api.get('/api/gallery/admin');
    setItems(data || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const persistOrder = async (ordered) => {
    setItems(ordered);
    await Promise.all(
      ordered.map((row, i) => api.put(`/api/gallery/${row.id}`, { displayOrder: i }))
    );
    await load();
  };

  const onDrop = (targetId) => {
    if (dragId == null || dragId === targetId) return;
    const ix = items.findIndex((x) => x.id === dragId);
    const iy = items.findIndex((x) => x.id === targetId);
    if (ix < 0 || iy < 0) return;
    const next = [...items];
    const [removed] = next.splice(ix, 1);
    next.splice(iy, 0, removed);
    persistOrder(next);
    setDragId(null);
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    const baseOrder = items.length;
    try {
      for (let i = 0; i < files.length; i += 1) {
        setUploadProgress({ current: i + 1, total: files.length });
        const fd = new FormData();
        fd.append('image', files[i]);
        fd.append('category', cat);
        fd.append('displayOrder', String(baseOrder + i));
        await api.post('/api/gallery', fd);
      }
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setUploadProgress(null);
      setUploading(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      await api.put(`/api/gallery/${row.id}`, { isActive: !row.isActive });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const remove = async (row) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await api.delete(`/api/gallery/${row.id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <p className="text-slate-500">Loading gallery…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gallery</h2>
        <p className="text-sm text-slate-500">Upload and organize photos for the public website.</p>
      </div>

      <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-primary">Upload photos</h3>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Category</label>
            <select
              className="mt-1 block rounded-lg border border-rose-200 px-3 py-2 text-sm capitalize"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark">
            {uploading && uploadProgress
              ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…`
              : uploading
                ? 'Uploading…'
                : 'Choose images'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Select multiple images at once (same category). Drag cards to reorder on the website.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((row) => (
          <div
            key={row.id}
            draggable
            onDragStart={() => setDragId(row.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(row.id)}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
              dragId === row.id ? 'border-primary opacity-60' : 'border-rose-100'
            } ${row.isActive ? '' : 'opacity-50'}`}
          >
            <div className="aspect-square bg-slate-100">
              <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-2 p-3">
              <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                {row.category?.replace('_', ' ')}
              </span>
              {row.title && <p className="text-sm font-medium text-slate-800">{row.title}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(row)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(row)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
