import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date, meal, food, quantity } = await request.json();

  if (!date || !meal || !food || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Find existing diary entry for this date + meal + user
    const params = new URLSearchParams({
      'filter[date][_eq]': date,
      'filter[diary_meal][_eq]': meal,
      'filter[type][_eq]': 'diary_meal',
      'filter[user][_eq]': session.user.id,
      'fields': 'id',
      'limit': '1',
    });

    const searchRes = await fetch(`${DIRECTUS_URL}/items/nx_diary_entries?${params}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const searchData = await searchRes.json();
    let diaryEntryId: string;

    if (searchData.data && searchData.data.length > 0) {
      diaryEntryId = searchData.data[0].id;
    } else {
      const createRes = await fetch(`${DIRECTUS_URL}/items/nx_diary_entries`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          type: 'diary_meal',
          diary_meal: meal,
          user: session.user.id,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to create diary entry' }, { status: 500 });
      }

      const createData = await createRes.json();
      diaryEntryId = createData.data.id;
    }

    // Calculate nutrition * quantity
    const calories = Math.round((food.calories || 0) * quantity * 10) / 10;
    const protein = Math.round((food.protein_g || 0) * quantity * 10) / 10;
    const carbs = Math.round((food.carbs_g || 0) * quantity * 10) / 10;
    const fat = Math.round((food.fat_g || 0) * quantity * 10) / 10;
    const fiber = Math.round((food.fiber_g || 0) * quantity * 10) / 10;
    const sodium = Math.round((food.sodium_mg || 0) * quantity * 10) / 10;
    const sugar = Math.round((food.sugar_g || 0) * quantity * 10) / 10;

    // Create food entry linked to food record
    const foodEntryRes = await fetch(`${DIRECTUS_URL}/items/nx_food_entries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diary_entry: diaryEntryId,
        food: food.food_id || null,
        quantity,
        energy_kcal: calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        fiber_g: fiber,
        sodium_mg: sodium,
        sugar_g: sugar,
      }),
    });

    if (!foodEntryRes.ok) {
      const err = await foodEntryRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to create food entry' }, { status: 500 });
    }

    // Recalculate diary entry totals
    const totalsParams = new URLSearchParams({
      'filter[diary_entry][_eq]': diaryEntryId,
      'aggregate[sum]': 'energy_kcal,protein_g,carbs_g,fat_g,fiber_g,sodium_mg,sugar_g',
    });
    const totalsRes = await fetch(`${DIRECTUS_URL}/items/nx_food_entries?${totalsParams}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const totalsData = await totalsRes.json();
    const sums = totalsData.data?.[0]?.sum || {};

    await fetch(`${DIRECTUS_URL}/items/nx_diary_entries/${diaryEntryId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        total_calories: parseFloat(sums.energy_kcal) || 0,
        total_protein_g: parseFloat(sums.protein_g) || 0,
        total_carbs_g: parseFloat(sums.carbs_g) || 0,
        total_fat_g: parseFloat(sums.fat_g) || 0,
        total_fiber_g: parseFloat(sums.fiber_g) || 0,
        total_sodium_mg: parseFloat(sums.sodium_mg) || 0,
        total_sugar_g: parseFloat(sums.sugar_g) || 0,
      }),
    });

    return NextResponse.json({ success: true, diary_entry: diaryEntryId });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
