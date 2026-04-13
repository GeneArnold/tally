'use client';

import { useState } from 'react';
import { Scale } from 'lucide-react';

export default function LogWeightButton() {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!weight) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/measurements/log-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parseFloat(weight) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save');
        setSaving(false);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        setOpen(false);
        setSaved(false);
        setWeight('');
        window.location.reload();
      }, 1000);
    } catch {
      setError('Failed to save weight');
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-white rounded-xl p-4 shadow-sm text-center active:bg-gray-50 min-h-[72px] flex flex-col items-center justify-center"
      >
        <Scale size={24} className="text-blue-600 mb-1" />
        <span className="text-sm font-medium text-gray-700">Log Weight</span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => { setOpen(false); setWeight(''); setError(''); }}>
        <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-[env(safe-area-inset-bottom)] animate-slide-up" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Log Weight</h3>

          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1">Today&apos;s weight</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
                autoFocus
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-4 text-3xl font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <span className="text-lg text-gray-500 pb-5">lbs</span>
          </div>

          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

          <div className="flex gap-3">
            <button
              onClick={() => { setOpen(false); setWeight(''); setError(''); }}
              className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3.5 text-base font-medium text-gray-700 active:bg-gray-100 min-h-[52px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !weight || saved}
              className={`flex-1 rounded-lg px-4 py-3.5 text-base font-semibold min-h-[52px] ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white active:bg-blue-800 disabled:opacity-50'
              }`}
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
