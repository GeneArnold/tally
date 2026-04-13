'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MEAL_TYPES } from '@/lib/constants';
import DiaryFoodEntry from '@/components/diary/DiaryFoodEntry';
import DiaryDateNav from '@/components/diary/DiaryDateNav';

interface FoodEntryData {
  id: string;
  quantity: number;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  sugar_g: number | null;
  food: {
    id: string;
    description: string;
    brand_name: string | null;
    energy_kcal: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    default_serving_size: number | null;
    default_serving_unit: string | null;
  } | null;
}

interface DiaryEntry {
  id: string;
  diary_meal: string;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  food_entries: FoodEntryData[];
}

export { type FoodEntryData };

export default function DiaryDatePage() {
  const params = useParams();
  const date = params.date as string;

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDiary() {
      setLoading(true);
      try {
        const res = await fetch(`/api/diary/${date}`);
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
    loadDiary();
  }, [date]);

  // Merge entries for same meal
  const entryMap = new Map<string, DiaryEntry>();
  for (const e of entries) {
    if (!e.diary_meal) continue;
    const existing = entryMap.get(e.diary_meal);
    if (existing) {
      existing.food_entries = [...existing.food_entries, ...e.food_entries];
      existing.total_calories = (existing.total_calories || 0) + (e.total_calories || 0);
      existing.total_protein_g = (existing.total_protein_g || 0) + (e.total_protein_g || 0);
      existing.total_carbs_g = (existing.total_carbs_g || 0) + (e.total_carbs_g || 0);
      existing.total_fat_g = (existing.total_fat_g || 0) + (e.total_fat_g || 0);
    } else {
      entryMap.set(e.diary_meal, { ...e, food_entries: [...e.food_entries] });
    }
  }

  let dayCal = 0, dayPro = 0, dayCarb = 0, dayFat = 0;
  for (const e of entries) {
    dayCal += e.total_calories || 0;
    dayPro += e.total_protein_g || 0;
    dayCarb += e.total_carbs_g || 0;
    dayFat += e.total_fat_g || 0;
  }

  // Date navigation
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const prev = new Date(year, month - 1, day - 1);
  const next = new Date(year, month - 1, day + 1);
  const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const prevStr = fmt(prev);
  const nextStr = fmt(next);
  const now = new Date();
  const todayStr = fmt(now);
  const isToday = date === todayStr;

  return (
    <div>
      <DiaryDateNav
        date={date}
        prevDate={prevStr}
        nextDate={nextStr}
        isToday={isToday}
        displayLabel={isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        displayDate={`${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`}
      />

      {/* Day totals */}
      {dayCal > 0 && (
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          <div className="bg-orange-50 rounded-lg p-2">
            <p className="text-lg font-bold text-orange-600">{Math.round(dayCal)}</p>
            <p className="text-[10px] text-gray-500">cal</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-lg font-bold text-blue-600">{Math.round(dayPro)}g</p>
            <p className="text-[10px] text-gray-500">protein</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-lg font-bold text-green-600">{Math.round(dayCarb)}g</p>
            <p className="text-[10px] text-gray-500">carbs</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2">
            <p className="text-lg font-bold text-purple-600">{Math.round(dayFat)}g</p>
            <p className="text-[10px] text-gray-500">fat</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <div className="space-y-3">
          {MEAL_TYPES.map((meal) => {
            const entry = entryMap.get(meal);
            const foodEntries = entry?.food_entries || [];
            const mealCal = entry?.total_calories || 0;

            return (
              <div key={meal} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">{meal}</h2>
                  {mealCal > 0 && (
                    <span className="text-sm text-orange-600 font-medium">{Math.round(mealCal)} cal</span>
                  )}
                </div>

                {foodEntries.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {foodEntries.map((fe) => (
                      <DiaryFoodEntry key={fe.id} entry={fe} diaryEntryId={entry!.id} date={date} />
                    ))}
                  </div>
                )}

                <Link
                  href={`/diary/add-food?meal=${encodeURIComponent(meal)}&date=${date}`}
                  className="block px-4 py-3 text-blue-600 text-sm font-medium active:bg-gray-50 min-h-[44px] flex items-center"
                >
                  + Add Food
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
