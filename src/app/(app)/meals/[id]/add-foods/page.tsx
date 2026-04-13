'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Search, Check, Plus, Minus } from 'lucide-react';

interface Food {
  id: string;
  description: string;
  brand_name: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

interface SelectedFood extends Food {
  quantity: number;
}

export default function AddFoodsToMealPage() {
  const router = useRouter();
  const params = useParams();
  const mealId = params.id as string;

  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Map<string, SelectedFood>>(new Map());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (query) p.set('q', query);
      const res = await fetch(`/api/my-foods?${p}`);
      if (res.ok) {
        const data = await res.json();
        setFoods(data.foods || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(fetchFoods, 300);
    return () => clearTimeout(timer);
  }, [fetchFoods]);

  function toggleFood(food: Food) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(food.id)) next.delete(food.id);
      else next.set(food.id, { ...food, quantity: 1 });
      return next;
    });
  }

  function updateQuantity(foodId: string, delta: number) {
    setSelected((prev) => {
      const next = new Map(prev);
      const item = next.get(foodId);
      if (!item) return prev;
      next.set(foodId, { ...item, quantity: Math.max(0.25, item.quantity + delta) });
      return next;
    });
  }

  async function handleSave() {
    if (selected.size === 0) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/meals/${mealId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_items: Array.from(selected.values()).map((f) => ({
            food_id: f.id,
            quantity: f.quantity,
          })),
        }),
      });

      if (res.ok) {
        window.location.href = `/meals/${mealId}`;
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to add foods');
        setSaving(false);
      }
    } catch {
      setError('Failed to add foods');
      setSaving(false);
    }
  }

  const selectedFoods = foods.filter((f) => selected.has(f.id));
  const unselectedFoods = foods.filter((f) => !selected.has(f.id));

  return (
    <div className="pb-24">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Add Foods to Meal</h1>

      <div className="relative mb-4">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search my foods..."
          className="w-full rounded-lg border-2 border-gray-300 pl-10 pr-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3 mb-4">{error}</div>}

      {selectedFoods.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected ({selected.size})</p>
          <div className="space-y-2">
            {selectedFoods.map((food) => {
              const sel = selected.get(food.id)!;
              return (
                <div key={food.id} className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleFood(food)} className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={16} className="text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-base">{food.description}</p>
                      <span className="text-orange-600 text-sm font-medium">{Math.round((food.energy_kcal || 0) * sel.quantity)} cal</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 ml-10">
                    <button onClick={() => updateQuantity(food.id, -0.25)} className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center"><Minus size={16} /></button>
                    <span className="text-lg font-bold text-gray-900 w-12 text-center">{sel.quantity}</span>
                    <button onClick={() => updateQuantity(food.id, 0.25)} className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center"><Plus size={16} /></button>
                    <span className="text-sm text-gray-500">servings</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <div className="space-y-2">
          {unselectedFoods.map((food) => (
            <button key={food.id} onClick={() => toggleFood(food)}
              className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50 flex items-start gap-3 min-h-[44px]">
              <div className="w-7 h-7 rounded border-2 border-gray-300 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-base">{food.description}</p>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span className="text-orange-600 font-medium">{food.energy_kcal || 0} cal</span>
                  <span>P {food.protein_g || 0}g</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-40">
          <div className="max-w-lg mx-auto">
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-blue-600 text-white rounded-xl px-4 py-4 text-lg font-semibold shadow-lg active:bg-blue-800 disabled:opacity-50 min-h-[56px]">
              {saving ? 'Adding...' : `Add ${selected.size} food${selected.size > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
