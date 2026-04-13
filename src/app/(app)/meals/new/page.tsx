'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Check, Plus, Minus } from 'lucide-react';
import { MEAL_TYPES } from '@/lib/constants';

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

export default function NewMealPage() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'foods'>('info');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Food picker state
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Map<string, SelectedFood>>(new Map());

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      params.set('_t', Date.now().toString());
      const res = await fetch(`/api/my-foods?${params}`);
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
    if (step === 'foods') {
      const timer = setTimeout(fetchFoods, 300);
      return () => clearTimeout(timer);
    }
  }, [fetchFoods, step]);

  function toggleFood(food: Food) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(food.id)) {
        next.delete(food.id);
      } else {
        next.set(food.id, { ...food, quantity: 1 });
      }
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
    if (!name.trim()) { setError('Meal name is required'); return; }
    if (selected.size === 0) { setError('Add at least one food'); return; }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          default_meal_type: mealType || null,
          food_items: Array.from(selected.values()).map((f) => ({
            food_id: f.id,
            quantity: f.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create meal');
        setSaving(false);
        return;
      }

      window.location.href = '/meals';
    } catch {
      setError('Failed to create meal');
      setSaving(false);
    }
  }

  // Step 1: Meal info
  if (step === 'info') {
    return (
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-6">New Meal</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Chicken Dinner, Morning Oatmeal"
              autoFocus
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quick note about this meal"
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Meal Slot (optional)</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No default</option>
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3">{error}</div>}

          <button
            onClick={() => {
              if (!name.trim()) { setError('Meal name is required'); return; }
              setError('');
              setStep('foods');
            }}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-4 text-lg font-semibold active:bg-blue-800 min-h-[52px]"
          >
            Next — Add Foods
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Pick foods
  const selectedFoods = foods.filter((f) => selected.has(f.id));
  const unselectedFoods = foods.filter((f) => !selected.has(f.id));
  const selectedNotInResults = Array.from(selected.values()).filter(
    (s) => !foods.find((f) => f.id === s.id),
  );

  const totalCal = Array.from(selected.values()).reduce(
    (sum, f) => sum + (f.energy_kcal || 0) * f.quantity, 0,
  );

  return (
    <div className="pb-24">
      <button onClick={() => setStep('info')} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Add Foods to &ldquo;{name}&rdquo;</h1>
      <p className="text-sm text-gray-500 mb-4">Select foods from your catalog</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search my foods..."
          className="w-full rounded-lg border-2 border-gray-300 pl-10 pr-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3 mb-4">{error}</div>}

      {/* Selected foods (pinned to top) */}
      {(selectedFoods.length > 0 || selectedNotInResults.length > 0) && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">In this meal ({selected.size})</p>
          <div className="space-y-2">
            {[...selectedFoods, ...selectedNotInResults].map((food) => {
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
                    <button onClick={() => updateQuantity(food.id, -0.25)} className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-bold text-gray-900 w-12 text-center">{sel.quantity}</span>
                    <button onClick={() => updateQuantity(food.id, 0.25)} className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                      <Plus size={16} />
                    </button>
                    <span className="text-sm text-gray-500">servings</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unselected foods */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <div className="space-y-2">
          {unselectedFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => toggleFood(food)}
              className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50 flex items-start gap-3 min-h-[44px]"
            >
              <div className="w-7 h-7 rounded border-2 border-gray-300 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-base">{food.description}</p>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span className="text-orange-600 font-medium">{food.energy_kcal || 0} cal</span>
                  <span>P {food.protein_g || 0}g</span>
                  <span>C {food.carbs_g || 0}g</span>
                  <span>F {food.fat_g || 0}g</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Save button */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-40">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded-xl px-4 py-4 text-lg font-semibold shadow-lg active:bg-blue-800 disabled:opacity-50 min-h-[56px]"
            >
              {saving ? 'Creating...' : `Create Meal (${selected.size} foods, ${Math.round(totalCal)} cal)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
