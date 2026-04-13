import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (!body.description?.trim()) {
    return NextResponse.json({ error: 'Food name is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/nx_foods`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: body.description.trim(),
        brand_name: body.brand_name || null,
        barcode: body.barcode || null,
        usda_fdc_id: body.usda_fdc_id || null,
        default_serving_size: body.default_serving_size || null,
        default_serving_unit: body.default_serving_unit || null,
        energy_kcal: body.energy_kcal || null,
        protein_g: body.protein_g || null,
        fat_g: body.fat_g || null,
        carbs_g: body.carbs_g || null,
        fiber_g: body.fiber_g || null,
        sugar_g: body.sugar_g || null,
        sodium_mg: body.sodium_mg || null,
        tags: body.tags || null,
        source: body.source || 'manual',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to save food' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ food: data.data });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
