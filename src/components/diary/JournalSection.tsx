'use client';

import { useState, useEffect } from 'react';
import { Trash2, Pencil, X, BookOpen } from 'lucide-react';

interface JournalEntry {
  id: string;
  entry_date: string;
  entry_time: string;
  content: string;
  date_created: string;
}

export default function JournalSection({ date }: { date: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [date]);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch(`/api/journal?date=${date}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setContent('');
    setError('');
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(entry: JournalEntry) {
    setTime(entry.entry_time.slice(0, 5));
    setContent(entry.content);
    setError('');
    setEditingId(entry.id);
    setShowAdd(true);
  }

  function closeSheet() {
    setShowAdd(false);
    setContent('');
    setTime('');
    setError('');
    setEditingId(null);
  }

  async function handleSave() {
    if (!content.trim()) {
      setError('Write something first');
      return;
    }
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        const res = await fetch(`/api/journal/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim(), entry_time: `${time}:00` }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to update');
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entry_date: date,
            entry_time: `${time}:00`,
            content: content.trim(),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to save');
          setSaving(false);
          return;
        }
      }

      closeSheet();
      loadEntries();
    } catch {
      setError('Failed to save entry');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        loadEntries();
      }
    } catch {
      // Silent
    }
  }

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-purple-600" />
            <h2 className="font-semibold text-gray-800">Journal</h2>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 px-4 py-3">Loading...</p>
        ) : entries.length === 0 ? (
          <button
            onClick={openAdd}
            className="w-full px-4 py-3 text-purple-600 text-sm font-medium active:bg-gray-50 min-h-[44px] flex items-center"
          >
            + Add journal entry
          </button>
        ) : (
          <div className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-600 font-medium mb-0.5">{formatTime(entry.entry_time)}</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(entry)}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gray-100"
                    >
                      <Pencil size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(entry.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gray-100"
                    >
                      <Trash2 size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={openAdd}
              className="w-full px-4 py-3 text-purple-600 text-sm font-medium active:bg-gray-50 min-h-[44px] flex items-center"
            >
              + Add another entry
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Bottom Sheet */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={closeSheet}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-24 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Entry' : 'New Journal Entry'}
              </h3>
              <button onClick={closeSheet} className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gray-100">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-1">How are you feeling?</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Brain fog, headache, feeling great, full of energy..."
                rows={4}
                autoFocus
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

            <div className="flex gap-3">
              <button
                onClick={closeSheet}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3.5 text-base font-medium text-gray-700 active:bg-gray-100 min-h-[52px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-3.5 text-base font-semibold text-white active:bg-purple-800 disabled:opacity-50 min-h-[52px]"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Entry?</h3>
            <p className="text-sm text-gray-500 mb-4">This journal entry will be removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-medium text-gray-700 active:bg-gray-100 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-base font-semibold text-white active:bg-red-800 min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
