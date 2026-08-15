'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface Meal {
  id: string;
  name: string;
  description: string | null;
  default_meal_type: string | null;
  items: {
    id: string;
    quantity: number;
    food: {
      id: string;
      description: string;
      energy_kcal: number | null;
    } | null;
  }[];
  meal_tags?: { nx_food_tags_id: { id: string; name: string; color: string | null } }[];
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMeals() {
      try {
        const res = await fetch(`/api/meals?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setMeals(data.meals || []);
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    loadMeals();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Meals</h1>
        <Link
          href="/meals/new"
          className="bg-brand-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 active:bg-brand-800 min-h-[44px]"
        >
          <Plus size={18} />
          New Meal
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : meals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-base mb-2">No meal templates yet</p>
          <p className="text-gray-400 text-sm">Create meals to quickly log multiple foods at once</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => {
            const totalCal = meal.items.reduce((sum, item) => {
              return sum + ((item.food?.energy_kcal || 0) * item.quantity);
            }, 0);
            const foodCount = meal.items.length;

            return (
              <Link
                key={meal.id}
                href={`/meals/${meal.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-base">{meal.name}</p>
                    {meal.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{meal.description}</p>
                    )}
                  </div>
                  {meal.default_meal_type && (
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-1">{meal.default_meal_type}</span>
                  )}
                </div>
                <div className="flex gap-3 mt-2 text-sm text-gray-600">
                  <span className="text-orange-600 font-medium">{Math.round(totalCal)} cal</span>
                  <span>{foodCount} food{foodCount !== 1 ? 's' : ''}</span>
                </div>
                {meal.meal_tags && meal.meal_tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {meal.meal_tags.map((t) => (
                      <span key={t.nx_food_tags_id.id} className="text-xs rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: t.nx_food_tags_id.color || '#2EA96B' }}>{t.nx_food_tags_id.name}</span>
                    ))}
                  </div>
                )}
                {meal.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {meal.items.slice(0, 4).map((item) => (
                      <span key={item.id} className="text-xs text-gray-400 bg-gray-50 rounded px-1.5 py-0.5">
                        {item.food?.description || 'Unknown'}
                      </span>
                    ))}
                    {meal.items.length > 4 && (
                      <span className="text-xs text-gray-400">+{meal.items.length - 4} more</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
