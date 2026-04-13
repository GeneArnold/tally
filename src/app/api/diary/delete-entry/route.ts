import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { foodEntryId, diaryEntryId } = await request.json();

  if (!foodEntryId) {
    return NextResponse.json({ error: 'Missing foodEntryId' }, { status: 400 });
  }

  try {
    // Delete the food entry
    const res = await fetch(`${DIRECTUS_URL}/items/nx_food_entries/${foodEntryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok && res.status !== 204) {
      return NextResponse.json({ error: 'Failed to delete food entry' }, { status: 500 });
    }

    // Recalculate diary entry totals
    if (diaryEntryId) {
      const totalsRes = await fetch(
        `${DIRECTUS_URL}/items/nx_food_entries?filter[diary_entry][_eq]=${diaryEntryId}&aggregate[sum]=energy_kcal,protein_g,carbs_g,fat_g,fiber_g,sodium_mg,sugar_g`,
        { headers: { Authorization: `Bearer ${session.token}` } },
      );
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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
