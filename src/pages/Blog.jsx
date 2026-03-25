import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

const emptyPost = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  metaDescription: '',
  keywords: '',
  published: true,
  publishedAt: '',
  readingMinutes: '',
};

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyPost);
  const [saving, setSaving] = useState(false);

  const siteBase = (import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );

  const load = useCallback(async () => {
    const { data } = await api.get('/api/blog');
    setPosts(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...emptyPost,
      publishedAt: toDatetimeLocal(new Date().toISOString()),
    });
    setModal('edit');
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      slug: row.slug || '',
      title: row.title || '',
      excerpt: row.excerpt || '',
      content: row.content || '',
      metaDescription: row.metaDescription || '',
      keywords: row.keywords || '',
      published: !!row.published,
      publishedAt: toDatetimeLocal(row.publishedAt),
      readingMinutes: row.readingMinutes != null ? String(row.readingMinutes) : '',
    });
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditingId(null);
    setForm(emptyPost);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim() || undefined,
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        metaDescription: form.metaDescription.trim(),
        keywords: form.keywords.trim() || null,
        published: form.published,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
        readingMinutes:
          form.readingMinutes === '' ? undefined : parseInt(form.readingMinutes, 10),
      };
      if (editingId == null) {
        await api.post('/api/blog', payload);
      } else {
        await api.put(`/api/blog/${editingId}`, payload);
      }
      await load();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!confirm(`Delete “${row.title}”? This removes it from the public website.`)) return;
    try {
      await api.delete(`/api/blog/${row.id}`);
      await load();
      if (editingId === row.id) closeModal();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <p className="text-slate-500">Loading blog posts…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Blog</h2>
          <p className="text-sm text-slate-500">
            Edit articles shown on the public site (SEO). Paragraphs: use blank lines in content.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          New article
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-rose-100 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-rose-100 bg-rose-50/80 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-100">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No posts yet. Run backend seed or create one.
                </td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="hover:bg-rose-50/40">
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-800">
                    {p.title}
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-slate-600">{p.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p.published ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {p.publishedAt
                      ? new Date(p.publishedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <a
                      href={`${siteBase}/blog/${encodeURIComponent(p.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 text-xs font-medium text-primary hover:underline"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="mr-2 text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10">
          <div className="w-full max-w-3xl rounded-2xl border border-rose-100 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-rose-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId == null ? 'New article' : 'Edit article'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-rose-50"
              >
                Close
              </button>
            </div>
            <form onSubmit={submit} className="mt-4 max-h-[calc(100vh-8rem)] space-y-4 overflow-y-auto pr-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">Title *</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Slug (auto from title if empty)
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 font-mono text-sm"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="my-article-url"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Reading time (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.readingMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, readingMinutes: e.target.value }))}
                    placeholder="Auto from content if empty"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Published date</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                    value={form.publishedAt}
                    onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="pub"
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  />
                  <label htmlFor="pub" className="text-sm text-slate-700">
                    Published (visible on website)
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Excerpt * (list / intro)</label>
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Meta description * (SEO, max ~320)</label>
                <textarea
                  className="mt-1 min-h-[60px] w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.metaDescription}
                  onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                  required
                  maxLength={320}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Keywords (comma-separated)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={form.keywords}
                  onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Content * (paragraphs separated by blank lines)
                </label>
                <textarea
                  className="mt-1 min-h-[240px] w-full rounded-lg border border-rose-200 px-3 py-2 font-mono text-sm leading-relaxed"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-3 border-t border-rose-100 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingId == null ? 'Create' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
