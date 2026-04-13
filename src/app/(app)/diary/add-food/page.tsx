'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ArrowLeft, Check, Plus, Minus } from 'lucide-react';

interface Food {
  id: string;
  description: string;
  brand_name: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  tags: string[] | null;
}

interface SelectedFood extends Food {
  quantity: number;
}

function AddFoodForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const meal = searchParams.get('meal') || 'Breakfast';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Map<string, SelectedFood>>(new Map());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      const res = await fetch(`/api/my-foods?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFoods(data.foods || []);
    } catch {
      // Silent fail
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
      const newQty = Math.max(0.25, item.quantity + delta);
      next.set(foodId, { ...item, quantity: newQty });
      return next;
    });
  }

  async function addAllToMeal() {
    if (selected.size === 0) return;
    setAdding(true);
    setError('');

    try {
      for (const [, item] of selected) {
        const res = await fetch('/api/diary/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            meal,
            food: {
              fdc_id: null,
              food_id: item.id,
              description: item.description,
              calories: item.energy_kcal || 0,
              protein_g: item.protein_g || 0,
              fat_g: item.fat_g || 0,
              carbs_g: item.carbs_g || 0,
              sugar_g: 0,
              sodium_mg: 0,
              fiber_g: 0,
            },
            quantity: item.quantity,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to add food');
          setAdding(false);
          return;
        }
      }

      window.location.href = `/diary/${date}`;
    } catch {
      setError('Failed to add foods');
      setAdding(false);
    }
  }

  // Separate selected and unselected foods
  const selectedFoods = foods.filter((f) => selected.has(f.id));
  const unselectedFoods = foods.filter((f) => !selected.has(f.id));
  // Also include selected foods that aren't in current search results
  const selectedNotInResults = Array.from(selected.values()).filter(
    (s) => !foods.find((f) => f.id === s.id),
  );

  const totalCal = Array.from(selected.values()).reduce(
    (sum, f) => sum + (f.energy_kcal || 0) * f.quantity, 0,
  );

  return (
    <div className="pb-24">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-1">Add to {meal}</h1>
      <p className="text-sm text-gray-500 mb-4">{date}</p>

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

      {error && (
        <div className="bg-red-50 text-red-700 text-base rounded-lg p-3 mb-4">{error}</div>
      )}

      {/* Selected foods (pinned to top) */}
      {(selectedFoods.length > 0 || selectedNotInResults.length > 0) && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Selected ({selected.size})
          </p>
          <div className="space-y-2">
            {[...selectedFoods, ...selectedNotInResults].map((food) => {
              const sel = selected.get(food.id)!;
              return (
                <div key={food.id} className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleFood(food)}
                      className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <Check size={16} className="text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-base">{food.description}</p>
                      <div className="flex gap-3 mt-1 text-sm text-gray-600">
                        <span className="text-orange-600 font-medium">
                          {Math.round((food.energy_kcal || 0) * sel.quantity)} cal
                        </span>
                        <span>P {Math.round((food.protein_g || 0) * sel.quantity)}g</span>
                      </div>
                    </div>
                  </div>
                  {/* Quantity controls */}
                  <div className="flex items-center gap-3 mt-3 ml-10">
                    <button
                      onClick={() => updateQuantity(food.id, -0.25)}
                      className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-bold text-gray-900 w-12 text-center">{sel.quantity}</span>
                    <button
                      onClick={() => updateQuantity(food.id, 0.25)}
                      className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center"
                    >
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
      ) : unselectedFoods.length === 0 && selectedFoods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {query ? 'No foods match your search' : 'No foods in your catalog yet'}
          </p>
          <a href="/my-foods/add" className="text-blue-600 font-medium text-sm mt-2 inline-block">
            Add foods to My Foods first
          </a>
        </div>
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
                {(food.brand_name) && (
                  <p className="text-sm text-gray-500 mt-0.5">{food.brand_name}</p>
                )}
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

      {/* Sticky add button */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-40">
          <div className="max-w-lg mx-auto">
            <button
              onClick={addAllToMeal}
              disabled={adding}
              className="w-full bg-blue-600 text-white rounded-xl px-4 py-4 text-lg font-semibold shadow-lg active:bg-blue-800 disabled:opacity-50 min-h-[56px] flex items-center justify-center gap-2"
            >
              {adding
                ? 'Adding...'
                : `Add ${selected.size} food${selected.size > 1 ? 's' : ''} to ${meal} (${Math.round(totalCal)} cal)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddFoodPage() {
  return (
    <Suspense>
      <AddFoodForm />
    </Suspense>
  );
}
