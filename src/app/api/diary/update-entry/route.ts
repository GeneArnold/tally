import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { foodEntryId, diaryEntryId, quantity } = await request.json();

  if (!foodEntryId || !quantity || quantity <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    // Get the food entry with its linked food's base nutrition
    const feRes = await fetch(
      `${DIRECTUS_URL}/items/nx_food_entries/${foodEntryId}?fields=food.energy_kcal,food.protein_g,food.carbs_g,food.fat_g,food.fiber_g,food.sugar_g,food.sodium_mg`,
      { headers: { Authorization: `Bearer ${session.token}` } },
    );

    if (!feRes.ok) {
      return NextResponse.json({ error: 'Food entry not found' }, { status: 404 });
    }

    const feData = await feRes.json();
    const baseFood = feData.data?.food;

    // Recalculate nutrition based on new quantity
    const updated: Record<string, number> = { quantity };
    if (baseFood) {
      updated.energy_kcal = Math.round((baseFood.energy_kcal || 0) * quantity * 10) / 10;
      updated.protein_g = Math.round((baseFood.protein_g || 0) * quantity * 10) / 10;
      updated.carbs_g = Math.round((baseFood.carbs_g || 0) * quantity * 10) / 10;
      updated.fat_g = Math.round((baseFood.fat_g || 0) * quantity * 10) / 10;
      updated.fiber_g = Math.round((baseFood.fiber_g || 0) * quantity * 10) / 10;
      updated.sugar_g = Math.round((baseFood.sugar_g || 0) * quantity * 10) / 10;
      updated.sodium_mg = Math.round((baseFood.sodium_mg || 0) * quantity * 10) / 10;
    }

    // Update food entry
    const updateRes = await fetch(`${DIRECTUS_URL}/items/nx_food_entries/${foodEntryId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updated),
    });

    if (!updateRes.ok) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    // Recalculate diary entry totals
    if (diaryEntryId) {
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
    }

    return NextResponse.json({ success: true, ...updated });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
