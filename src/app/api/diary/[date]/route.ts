import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await params;

  const fields = [
    'id', 'diary_meal', 'total_calories', 'total_protein_g', 'total_carbs_g', 'total_fat_g',
    'food_entries.id', 'food_entries.quantity',
    'food_entries.energy_kcal', 'food_entries.protein_g', 'food_entries.carbs_g', 'food_entries.fat_g',
    'food_entries.fiber_g', 'food_entries.sodium_mg', 'food_entries.sugar_g',
    'food_entries.food.id', 'food_entries.food.description', 'food_entries.food.brand_name',
    'food_entries.food.energy_kcal', 'food_entries.food.protein_g', 'food_entries.food.carbs_g',
    'food_entries.food.fat_g', 'food_entries.food.default_serving_size', 'food_entries.food.default_serving_unit',
  ].join(',');

  const url = `${DIRECTUS_URL}/items/nx_diary_entries?filter[date][_eq]=${date}&filter[user][_eq]=${session.user.id}&filter[type][_eq]=diary_meal&fields=${fields}&sort=diary_meal&deep[food_entries][_limit]=-1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ entries: [] });
  }

  const data = await res.json();
  const response = NextResponse.json({ entries: data.data || [] });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  return response;
}
