'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Tag } from 'lucide-react';
import Link from 'next/link';

interface Food {
  id: string;
  description: string;
  brand_name: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  default_serving_size: number | null;
  default_serving_unit: string | null;
  tags: { id: string; name: string; color: string | null }[] | null;
}

export default function MyFoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<{ name: string; color: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (tagFilters.length > 0) params.set('tags', tagFilters.join(','));

      params.set('_t', Date.now().toString());
      const res = await fetch(`/api/my-foods?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFoods(data.foods || []);
      if (data.tags) setAllTags(data.tags);
    } catch {
      // Silent fail — empty list shown
    } finally {
      setLoading(false);
    }
  }, [search, tagFilters]);

  useEffect(() => {
    const timer = setTimeout(fetchFoods, 300);
    return () => clearTimeout(timer);
  }, [fetchFoods]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">My Foods</h1>
        <Link
          href="/my-foods/add"
          className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 active:bg-blue-800 min-h-[44px]"
        >
          <Plus size={18} />
          Add Food
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search my foods..."
          className="w-full rounded-lg border-2 border-gray-300 pl-10 pr-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tag filter pills — cumulative, click to toggle each */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-4 px-4">
          {tagFilters.length > 0 && (
            <button
              onClick={() => setTagFilters([])}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium min-h-[36px] bg-gray-200 text-gray-600 active:bg-gray-300"
            >
              Clear
            </button>
          )}
          {allTags.map((tag) => {
            const active = tagFilters.includes(tag.name);
            return (
              <button
                key={tag.name}
                onClick={() => {
                  if (active) {
                    setTagFilters(tagFilters.filter((t) => t !== tag.name));
                  } else {
                    setTagFilters([...tagFilters, tag.name]);
                  }
                }}
                className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium min-h-[36px]"
                style={active
                  ? { backgroundColor: tag.color || '#3B82F6', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#4b5563' }
                }
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Food list */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : foods.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-base mb-2">
            {search || tagFilters.length > 0 ? 'No foods match your search' : 'No foods yet'}
          </p>
          {!search && tagFilters.length === 0 && (
            <p className="text-gray-400 text-sm">
              Tap &ldquo;Add Food&rdquo; to start building your catalog
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {foods.map((food) => (
            <Link
              key={food.id}
              href={`/my-foods/${food.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
            >
              <p className="font-medium text-gray-900 text-base">{food.description}</p>
              {(food.brand_name) && (
                <p className="text-sm text-gray-500 mt-0.5">{food.brand_name}</p>
              )}
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-orange-600 font-medium">{food.energy_kcal || 0} cal</span>
                <span className="text-gray-600">P {food.protein_g || 0}g</span>
                <span className="text-gray-600">C {food.carbs_g || 0}g</span>
                <span className="text-gray-600">F {food.fat_g || 0}g</span>
              </div>
              {food.tags && food.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {food.tags.map((tag) => (
                    <span key={tag.id} className="text-xs rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: tag.color || '#3B82F6' }}>{tag.name}</span>
                  ))}
                </div>
              )}
              {food.default_serving_size && (
                <p className="text-xs text-gray-400 mt-1">
                  Serving: {food.default_serving_size}{food.default_serving_unit ? ` ${food.default_serving_unit}` : ''}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
