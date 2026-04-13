'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Tag {
  id: string;
  name: string;
  color: string | null;
  sort: number;
}

const COLOR_PRESETS = [
  '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#A855F7',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16',
];

export default function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add');
  const [sheetTagId, setSheetTagId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [sheetColor, setSheetColor] = useState(COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);
  const [error, setError] = useState('');

  async function loadTags() {
    try {
      const res = await fetch(`/api/tags?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTags(); }, []);

  function openAdd() {
    setSheetMode('add');
    setSheetTagId('');
    setSheetName('');
    setSheetColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
    setError('');
    setShowSheet(true);
  }

  function openEdit(tag: Tag) {
    setSheetMode('edit');
    setSheetTagId(tag.id);
    setSheetName(tag.name);
    setSheetColor(tag.color || COLOR_PRESETS[0]);
    setError('');
    setShowSheet(true);
  }

  function closeSheet() {
    setShowSheet(false);
    setError('');
  }

  async function handleSave() {
    if (!sheetName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');

    try {
      if (sheetMode === 'add') {
        if (tags.some((t) => t.name.toLowerCase() === sheetName.trim().toLowerCase())) {
          setError('Tag already exists');
          setSaving(false);
          return;
        }
        const res = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: sheetName.trim(), color: sheetColor }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to add');
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch(`/api/tags/${sheetTagId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: sheetName.trim().toLowerCase(), color: sheetColor }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to update');
          setSaving(false);
          return;
        }
      }
      closeSheet();
      await loadTags();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTag) return;
    try {
      await fetch('/api/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: deleteTag.id }),
      });
      setDeleteTag(null);
      closeSheet();
      await loadTags();
    } catch {
      // Silent
    }
  }

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Food Tags</h2>
        <button
          onClick={openAdd}
          className="text-blue-600 text-sm font-medium flex items-center gap-1 min-h-[44px]"
        >
          <Plus size={16} />
          Add Tag
        </button>
      </div>

      {/* Tag chips */}
      {tags.length === 0 ? (
        <p className="text-sm text-gray-400">No tags yet. Tap &ldquo;Add Tag&rdquo; to get started.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => openEdit(tag)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-white min-h-[36px] active:opacity-80"
              style={{ backgroundColor: tag.color || '#3B82F6' }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Bottom sheet */}
      {showSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={closeSheet}>
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {sheetMode === 'add' ? 'New Tag' : 'Edit Tag'}
              </h3>
              <button onClick={closeSheet} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="e.g. breakfast, protein"
                autoFocus
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            {/* Color */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-3 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSheetColor(c)}
                    className={`w-10 h-10 rounded-full ${sheetColor === c ? 'ring-3 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            {sheetName.trim() && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <span
                  className="inline-block rounded-full px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: sheetColor }}
                >
                  {sheetName.trim().toLowerCase()}
                </span>
              </div>
            )}

            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

            {/* Actions */}
            <button
              onClick={handleSave}
              disabled={saving || !sheetName.trim()}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-3.5 text-base font-semibold active:bg-blue-800 disabled:opacity-50 min-h-[52px] mb-3"
            >
              {saving ? 'Saving...' : sheetMode === 'add' ? 'Add Tag' : 'Save Changes'}
            </button>

            {sheetMode === 'edit' && (
              <button
                onClick={() => {
                  const tag = tags.find((t) => t.id === sheetTagId);
                  if (tag) setDeleteTag(tag);
                }}
                className="w-full text-red-500 text-sm font-medium min-h-[44px]"
              >
                Delete this tag
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTag}
        title="Delete tag?"
        message={`Delete "${deleteTag?.name}"? This won't remove the tag from foods that already use it.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTag(null)}
      />
    </div>
  );
}
