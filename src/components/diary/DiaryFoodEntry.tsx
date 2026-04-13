'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Trash2, Plus, Minus, Pencil, Check } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { FoodEntryData } from '@/app/(app)/diary/[date]/page';

interface Props {
  entry: FoodEntryData;
  diaryEntryId: string;
  date: string;
}

export default function DiaryFoodEntry({ entry, diaryEntryId, date }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(entry.quantity);
  const [saving, setSaving] = useState(false);

  const foodName = entry.food?.description || 'Unknown food';
  const brandName = entry.food?.brand_name;
  const basePerServing = entry.food;

  // When editing, show live-calculated values based on new qty
  // When not editing, show the stored values
  const displayQty = editing ? qty : entry.quantity;
  const cal = editing && basePerServing
    ? Math.round((basePerServing.energy_kcal || 0) * qty)
    : Math.round(entry.energy_kcal || 0);
  const pro = editing && basePerServing
    ? Math.round((basePerServing.protein_g || 0) * qty * 10) / 10
    : Math.round((entry.protein_g || 0) * 10) / 10;
  const carb = editing && basePerServing
    ? Math.round((basePerServing.carbs_g || 0) * qty * 10) / 10
    : Math.round((entry.carbs_g || 0) * 10) / 10;
  const fat = editing && basePerServing
    ? Math.round((basePerServing.fat_g || 0) * qty * 10) / 10
    : Math.round((entry.fat_g || 0) * 10) / 10;
  const fiber = editing && basePerServing
    ? Math.round((basePerServing.fat_g || 0) * qty * 10) / 10
    : Math.round((entry.fiber_g || 0) * 10) / 10;
  const sodium = editing && basePerServing
    ? Math.round((basePerServing.energy_kcal || 0) * qty)
    : Math.round(entry.sodium_mg || 0);
  const sugar = editing && basePerServing
    ? Math.round((basePerServing.energy_kcal || 0) * qty * 10) / 10
    : Math.round((entry.sugar_g || 0) * 10) / 10;

  const servingInfo = entry.food?.default_serving_size
    ? `${entry.food.default_serving_size}${entry.food.default_serving_unit ? ` ${entry.food.default_serving_unit}` : ''}`
    : null;

  async function saveQuantity() {
    setSaving(true);
    try {
      const res = await fetch('/api/diary/update-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodEntryId: entry.id, diaryEntryId, quantity: qty }),
      });
      if (res.ok) {
        setEditing(false);
        window.location.reload();
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setQty(entry.quantity);
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch('/api/diary/delete-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodEntryId: entry.id, diaryEntryId }),
      });
      if (res.ok) {
        setShowDelete(false);
        window.location.reload();
      }
    } catch {
      // Silent fail
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="px-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-3 flex items-center justify-between min-h-[52px] text-left"
      >
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-medium text-gray-900 text-base truncate">{foodName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {brandName && (
              <span className="text-xs text-gray-400">{brandName}</span>
            )}
            <span className="text-xs text-gray-500">
              {displayQty} serving{displayQty !== 1 ? 's' : ''}{servingInfo ? ` (${servingInfo})` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-orange-600">{cal} cal</span>
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="pb-3 -mt-1">
          {/* Serving editor */}
          {editing ? (
            <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Adjust servings</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(0.25, qty - 0.25))}
                  className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center active:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(0.25, parseFloat(e.target.value) || 0.25))}
                  step="0.25"
                  min="0.25"
                  className="w-20 text-center text-xl font-bold border-2 border-gray-300 rounded-lg py-1.5 text-gray-900"
                />
                <button
                  onClick={() => setQty(qty + 0.25)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center active:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm font-medium active:bg-gray-100 min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveQuantity}
                    disabled={saving || qty === entry.quantity}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 active:bg-blue-800 min-h-[40px] flex items-center gap-1"
                  >
                    <Check size={16} />
                    {saving ? '...' : 'Save'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{cal} cal &middot; P {pro}g &middot; C {carb}g &middot; F {fat}g</p>
            </div>
          ) : null}

          {/* Macro breakdown */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-y-2 text-sm">
              <div className="text-center">
                <p className="font-semibold text-blue-600">{pro}g</p>
                <p className="text-[10px] text-gray-500">protein</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-green-600">{carb}g</p>
                <p className="text-[10px] text-gray-500">carbs</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-purple-600">{fat}g</p>
                <p className="text-[10px] text-gray-500">fat</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">{fiber}g</p>
                <p className="text-[10px] text-gray-500">fiber</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">{sugar}g</p>
                <p className="text-[10px] text-gray-500">sugar</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">{sodium}mg</p>
                <p className="text-[10px] text-gray-500">sodium</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 font-medium min-h-[44px] px-2"
                >
                  <Pencil size={14} />
                  Edit serving
                </button>
              )}
              {entry.food && (
                <a
                  href={`/my-foods/${entry.food.id}?from=/diary/${date}`}
                  className="text-xs text-gray-500 font-medium min-h-[44px] flex items-center px-2"
                >
                  View food
                </a>
              )}
            </div>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1 text-xs text-red-500 font-medium min-h-[44px] px-2"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Remove from diary?"
        message={`Remove ${foodName} from this meal? This won't delete the food from My Foods.`}
        confirmLabel={deleting ? 'Removing...' : 'Remove'}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
