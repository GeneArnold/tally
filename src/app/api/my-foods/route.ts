import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const tagFilter = searchParams.get('tag')?.trim();

  const filters: string[] = [];
  if (query) {
    filters.push(`filter[description][_icontains]=${encodeURIComponent(query)}`);
  }

  const fields = 'id,description,brand_name,energy_kcal,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,default_serving_size,default_serving_unit,tags,source';
  const url = `${DIRECTUS_URL}/items/nx_foods?fields=${fields}&sort=description&limit=100${filters.length ? '&' + filters.join('&') : ''}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to fetch foods' }, { status: 500 });
    }

    const data = await res.json();
    let foods = data.data || [];

    // Client-side tag filter
    if (tagFilter) {
      foods = foods.filter((f: Record<string, unknown>) => {
        const tags = f.tags as string[] | null;
        return tags && tags.includes(tagFilter);
      });
    }

    // Collect all unique tags
    const tagSet = new Set<string>();
    for (const f of data.data || []) {
      const tags = f.tags as string[] | null;
      if (tags) tags.forEach((t: string) => tagSet.add(t));
    }

    return NextResponse.json({
      foods,
      tags: Array.from(tagSet).sort(),
      total: foods.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
