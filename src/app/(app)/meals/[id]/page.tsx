'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Plus, UtensilsCrossed } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { MEAL_TYPES } from '@/lib/constants';

interface MealItem {
  id: string;
  quantity: number;
  food: {
    id: string;
    description: string;
    brand_name: string | null;
    energy_kcal: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
  } | null;
}

interface Meal {
  id: string;
  name: string;
  description: string | null;
  default_meal_type: string | null;
  items: MealItem[];
}

export default function MealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const mealId = params.id as string;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteItem, setShowDeleteItem] = useState<string | null>(null);
  const [logSlot, setLogSlot] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [logging, setLogging] = useState(false);

  async function loadMeal() {
    try {
      const res = await fetch(`/api/meals/${mealId}`);
      if (res.ok) {
        const data = await res.json();
        setMeal(data.meal);
        if (data.meal?.default_meal_type) {
          setLogSlot(data.meal.default_meal_type);
        }
      } else {
        router.push('/meals');
      }
    } catch {
      router.push('/meals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMeal(); }, [mealId]);

  async function handleDeleteMeal() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/meals/${mealId}`, { method: 'DELETE' });
      if (res.ok) window.location.href = '/meals';
    } catch {
      // Silent
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      const res = await fetch(`/api/meals/${mealId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        setShowDeleteItem(null);
        await loadMeal();
      }
    } catch {
      // Silent
    }
  }

  async function handleLogMeal() {
    if (!meal || !logSlot) return;
    setLogging(true);

    try {
      const today = new Date();
      const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      for (const item of meal.items) {
        if (!item.food) continue;
        await fetch('/api/diary/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            meal: logSlot,
            food: {
              food_id: item.food.id,
              description: item.food.description,
              calories: item.food.energy_kcal || 0,
              protein_g: item.food.protein_g || 0,
              fat_g: item.food.fat_g || 0,
              carbs_g: item.food.carbs_g || 0,
              sugar_g: 0,
              sodium_mg: 0,
              fiber_g: 0,
            },
            quantity: item.quantity,
          }),
        });
      }

      window.location.href = `/diary/${new Date().toISOString().split('T')[0]}`;
    } catch {
      setLogging(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!meal) return null;

  const totalCal = meal.items.reduce((sum, i) => sum + ((i.food?.energy_kcal || 0) * i.quantity), 0);
  const totalPro = meal.items.reduce((sum, i) => sum + ((i.food?.protein_g || 0) * i.quantity), 0);
  const totalCarb = meal.items.reduce((sum, i) => sum + ((i.food?.carbs_g || 0) * i.quantity), 0);
  const totalFat = meal.items.reduce((sum, i) => sum + ((i.food?.fat_g || 0) * i.quantity), 0);

  return (
    <div className="pb-24">
      <button onClick={() => router.push('/meals')} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
        <ArrowLeft size={20} /> Meals
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{meal.name}</h1>
          {meal.description && <p className="text-gray-500 text-sm mt-1">{meal.description}</p>}
        </div>
        {meal.default_meal_type && (
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-1">{meal.default_meal_type}</span>
        )}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-4 gap-2 text-center mb-4">
        <div className="bg-orange-50 rounded-lg p-2">
          <p className="text-lg font-bold text-orange-600">{Math.round(totalCal)}</p>
          <p className="text-[10px] text-gray-500">cal</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-lg font-bold text-blue-600">{Math.round(totalPro)}g</p>
          <p className="text-[10px] text-gray-500">protein</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-lg font-bold text-green-600">{Math.round(totalCarb)}g</p>
          <p className="text-[10px] text-gray-500">carbs</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-2">
          <p className="text-lg font-bold text-purple-600">{Math.round(totalFat)}g</p>
          <p className="text-[10px] text-gray-500">fat</p>
        </div>
      </div>

      {/* Food list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Foods ({meal.items.length})</h2>
        </div>
        {meal.items.map((item) => (
          <div key={item.id} className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{item.food?.description || 'Deleted food'}</p>
              <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                <span>{item.quantity} serving{item.quantity !== 1 ? 's' : ''}</span>
                <span className="text-orange-600">{Math.round((item.food?.energy_kcal || 0) * item.quantity)} cal</span>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteItem(item.id)}
              className="text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <Link
          href={`/meals/${mealId}/add-foods`}
          className="block px-4 py-3 text-blue-600 text-sm font-medium active:bg-gray-50 min-h-[44px] flex items-center gap-1"
        >
          <Plus size={16} /> Add more foods
        </Link>
      </div>

      {/* Log to diary */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Log to Diary</h2>
        <div className="flex gap-2 mb-3">
          {MEAL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setLogSlot(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium min-h-[40px] ${
                logSlot === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() => { if (logSlot) setShowLog(true); }}
          disabled={!logSlot || logging}
          className="w-full bg-green-600 text-white rounded-lg px-4 py-3.5 text-base font-semibold active:bg-green-800 disabled:opacity-50 min-h-[52px] flex items-center justify-center gap-2"
        >
          <UtensilsCrossed size={20} />
          {logging ? 'Logging...' : `Log to ${logSlot || '...'}`}
        </button>
      </div>

      {/* Delete meal */}
      <button
        onClick={() => setShowDelete(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 px-4 py-3 text-red-600 font-medium active:bg-red-50 min-h-[48px]"
      >
        <Trash2 size={18} />
        Delete Meal
      </button>

      {/* Confirm log */}
      <ConfirmDialog
        open={showLog}
        title={`Log ${meal.name}?`}
        message={`Add ${meal.items.length} food${meal.items.length !== 1 ? 's' : ''} (${Math.round(totalCal)} cal) to today's ${logSlot}?`}
        confirmLabel={logging ? 'Logging...' : 'Log Meal'}
        onConfirm={handleLogMeal}
        onCancel={() => setShowLog(false)}
      />

      {/* Confirm delete meal */}
      <ConfirmDialog
        open={showDelete}
        title="Delete meal?"
        message={`Delete "${meal.name}"? This won't affect foods already logged in your diary.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteMeal}
        onCancel={() => setShowDelete(false)}
      />

      {/* Confirm delete item */}
      <ConfirmDialog
        open={!!showDeleteItem}
        title="Remove food?"
        message="Remove this food from the meal template?"
        confirmLabel="Remove"
        onConfirm={() => showDeleteItem && handleDeleteItem(showDeleteItem)}
        onCancel={() => setShowDeleteItem(null)}
      />
    </div>
  );
}

// Need Link import for the "Add more foods" link
import Link from 'next/link';
