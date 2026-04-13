import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MEAL_TYPES } from '@/lib/constants';
import DiaryFoodEntry from '@/components/diary/DiaryFoodEntry';

export const dynamic = 'force-dynamic';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

interface DiaryEntry {
  id: string;
  diary_meal: string;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  food_entries: FoodEntryData[];
}

export interface FoodEntryData {
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

interface Props {
  params: Promise<{ date: string }>;
}

async function getDiaryEntries(token: string, userId: string, date: string): Promise<DiaryEntry[]> {
  const fields = [
    'id', 'diary_meal', 'total_calories', 'total_protein_g', 'total_carbs_g', 'total_fat_g',
    'food_entries.id', 'food_entries.quantity',
    'food_entries.energy_kcal', 'food_entries.protein_g', 'food_entries.carbs_g', 'food_entries.fat_g',
    'food_entries.fiber_g', 'food_entries.sodium_mg', 'food_entries.sugar_g',
    'food_entries.food.id', 'food_entries.food.description', 'food_entries.food.brand_name',
    'food_entries.food.energy_kcal', 'food_entries.food.protein_g', 'food_entries.food.carbs_g',
    'food_entries.food.fat_g', 'food_entries.food.default_serving_size', 'food_entries.food.default_serving_unit',
  ].join(',');

  const res = await fetch(
    `${DIRECTUS_URL}/items/nx_diary_entries?filter[date][_eq]=${date}&filter[user][_eq]=${userId}&filter[type][_eq]=diary_meal&fields=${fields}&sort=diary_meal`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function DiaryDatePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { date } = await params;
  const entries = await getDiaryEntries(session.token, session.user.id, date);

  // Merge entries for same meal (in case duplicates exist)
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

  const d = new Date(date + 'T12:00:00');
  const prev = new Date(d); prev.setDate(prev.getDate() - 1);
  const next = new Date(d); next.setDate(next.getDate() + 1);
  const prevStr = prev.toISOString().split('T')[0];
  const nextStr = next.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;

  return (
    <div>
      {/* Date nav */}
      <div className="flex items-center justify-between mb-4">
        <Link href={`/diary/${prevStr}`} className="text-blue-600 font-medium min-w-[44px] min-h-[44px] flex items-center">
          &larr; Prev
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900">
            {isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </h1>
          {isToday && <p className="text-xs text-gray-500">{date}</p>}
        </div>
        <Link href={`/diary/${nextStr}`} className="text-blue-600 font-medium min-w-[44px] min-h-[44px] flex items-center">
          Next &rarr;
        </Link>
      </div>

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

      {/* Meal sections */}
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
    </div>
  );
}
